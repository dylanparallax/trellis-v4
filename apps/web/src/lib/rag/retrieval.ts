import { prisma } from '@trellis/database'
import { embedQuery, cosineSimilarity } from './embed'

export type Role = 'ADMIN' | 'DISTRICT_ADMIN' | 'EVALUATOR' | 'TEACHER'

export type RagFilters = {
  type?: 'observation' | 'evaluation'
  startDate?: string
  endDate?: string
}

export async function searchRag(
  params: {
    query: string
    role: Role
    userSchoolId: string
    topK?: number
    filters?: RagFilters
  }
): Promise<
  Array<{
    chunkId: string
    sourceType: 'OBSERVATION' | 'EVALUATION'
    sourceId: string
    schoolId: string
    district?: string
    snippet: string
    metadata: Record<string, unknown>
    score: number
  }>
> {
  const { query, role, userSchoolId } = params
  const topK = Math.min(20, Math.max(1, params.topK ?? 8))

  // Determine scope
  let district: string | null = null
  if (role === 'DISTRICT_ADMIN') {
    const school = await prisma.school.findUnique({ where: { id: userSchoolId }, select: { district: true } })
    district = school?.district || null
  }

  // Build where clause
  const where: {
    schoolId?: string
    district?: string | null
    sourceType?: 'OBSERVATION' | 'EVALUATION'
  } = {}
  if (role === 'ADMIN' || role === 'EVALUATOR' || role === 'TEACHER') {
    where.schoolId = userSchoolId
  } else if (role === 'DISTRICT_ADMIN') {
    if (district) {
      where.district = district
    } else {
      // Fallback to school scope if district not set
      where.schoolId = userSchoolId
    }
  }
  if (params.filters?.type) {
    where.sourceType = params.filters.type.toUpperCase() === 'OBSERVATION' ? 'OBSERVATION' : 'EVALUATION'
  }
  // Date filter approximated via metadata.date/createdAt
  // We will filter after fetch due to JSON structure

  // Fetch candidate chunks (cap to 500 for performance)
  const candidates = await prisma.ragChunk.findMany({ where, take: 500, orderBy: { updatedAt: 'desc' } })
  if (candidates.length === 0) return []

  const qVec = await embedQuery(query)
  const scored = candidates.map((c) => ({
    chunkId: c.id,
    sourceType: c.sourceType as 'OBSERVATION' | 'EVALUATION',
    sourceId: c.sourceId,
    schoolId: c.schoolId,
    district: c.district || undefined,
    snippet: c.content.slice(0, 600),
    metadata: c.metadata as Record<string, unknown>,
    score: cosineSimilarity(qVec, c.embedding as unknown as number[]),
  }))

  scored.sort((a, b) => b.score - a.score)
  // Deduplicate by sourceId keeping top chunk per source
  const seen = new Set<string>()
  const deduped: typeof scored = []
  for (const s of scored) {
    const key = `${s.sourceType}:${s.sourceId}`
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push(s)
    if (deduped.length >= topK) break
  }
  return deduped
}
