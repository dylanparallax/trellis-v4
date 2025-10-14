import { prisma } from '@trellis/database'
import { createHash } from 'crypto'
import { chunkText } from './chunk'
import { embedTexts } from './embed'
import { normalizeObservation, normalizeEvaluation } from './normalize'

export type RagSourceType = 'OBSERVATION' | 'EVALUATION'

export async function enqueueIndex(action: 'UPSERT' | 'DELETE', sourceType: RagSourceType, sourceId: string) {
  try {
    await prisma.ragIndexQueue.create({ data: { action, sourceType, sourceId } })
  } catch (error) {
    console.warn('Failed to enqueue RAG index:', { action, sourceType, sourceId, error })
  }
}

export async function processIndexQueue(maxItems = 50) {
  // Simple FIFO processing without DB-level locks; acceptable for single-runner
  const items = await prisma.ragIndexQueue.findMany({ orderBy: { createdAt: 'asc' }, take: maxItems })
  for (const item of items) {
    try {
      if (item.action === 'UPSERT') {
        if (item.sourceType === 'OBSERVATION') await upsertObservationChunks(item.sourceId)
        if (item.sourceType === 'EVALUATION') await upsertEvaluationChunks(item.sourceId)
      } else if (item.action === 'DELETE') {
        await prisma.ragChunk.deleteMany({ where: { sourceType: item.sourceType, sourceId: item.sourceId } })
      }
      await prisma.ragIndexQueue.delete({ where: { id: item.id } })
    } catch (error) {
      await prisma.ragIndexQueue.update({ where: { id: item.id }, data: { attemptCount: { increment: 1 } } })
      console.error('Index item failed:', item, error)
    }
  }
}

async function upsertObservationChunks(observationId: string) {
  const observation = await prisma.observation.findUnique({
    where: { id: observationId },
    include: {
      teacher: { select: { id: true, name: true, subject: true, gradeLevel: true } },
      observer: { select: { id: true, name: true } },
      school: { select: { id: true, name: true, district: true } },
    },
  })
  if (!observation) return
  const norm = normalizeObservation(observation)
  const full = `${norm.header}\n\n${norm.body}`
  const chunks = chunkText(full)
  const embeddings = await embedTexts(chunks.map((c) => c.content))
  const school = observation.school
  const district = school?.district || null

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]!
    const embedding = embeddings[i]!
    const hash = sha(`${observation.id}:OBSERVATION:${i}:${chunk.content}`)
    await upsertRagChunk({
      sourceType: 'OBSERVATION',
      sourceId: observation.id,
      schoolId: observation.schoolId,
      district: district || undefined,
      content: chunk.content,
      tokenCount: chunk.tokenCount,
      embedding,
      contentHash: hash,
      metadata: { ...norm.metadata, chunkIndex: i },
    })
  }
}

async function upsertEvaluationChunks(evaluationId: string) {
  const evaluation = await prisma.evaluation.findUnique({
    where: { id: evaluationId },
    include: {
      teacher: { select: { id: true, name: true, subject: true, gradeLevel: true } },
      evaluator: { select: { id: true, name: true } },
      school: { select: { id: true, name: true, district: true } },
    },
  })
  if (!evaluation) return
  const norm = normalizeEvaluation(evaluation)
  const full = `${norm.header}\n\n${norm.body}`
  const chunks = chunkText(full)
  const embeddings = await embedTexts(chunks.map((c) => c.content))
  const school = evaluation.school
  const district = school?.district || null

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]!
    const embedding = embeddings[i]!
    const hash = sha(`${evaluation.id}:EVALUATION:${i}:${chunk.content}`)
    await upsertRagChunk({
      sourceType: 'EVALUATION',
      sourceId: evaluation.id,
      schoolId: evaluation.schoolId,
      district: district || undefined,
      content: chunk.content,
      tokenCount: chunk.tokenCount,
      embedding,
      contentHash: hash,
      metadata: { ...norm.metadata, chunkIndex: i },
    })
  }
}

function sha(s: string) {
  return createHash('sha256').update(s).digest('hex')
}

async function upsertRagChunk(input: {
  sourceType: RagSourceType
  sourceId: string
  schoolId: string
  district?: string
  content: string
  tokenCount: number
  embedding: number[]
  contentHash: string
  metadata: Record<string, unknown>
}) {
  try {
    await prisma.ragChunk.create({
      data: {
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        schoolId: input.schoolId,
        district: input.district || null,
        content: input.content,
        tokenCount: input.tokenCount,
        embedding: input.embedding,
        contentHash: input.contentHash,
        metadata: input.metadata,
      },
    })
  } catch (err) {
    // If unique violation on contentHash, update existing
    const error = err as { code?: string | number; message?: unknown }
    if (String(error?.code) === 'P2002' || /Unique constraint/i.test(String(error?.message ?? ''))) {
      await prisma.ragChunk.update({
        where: { contentHash: input.contentHash },
        data: {
          content: input.content,
          tokenCount: input.tokenCount,
          embedding: input.embedding,
          metadata: input.metadata,
          updatedAt: new Date(),
        },
      })
      return
    }
    throw error
  }
}
