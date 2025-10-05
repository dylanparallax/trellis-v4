export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@trellis/database'
import { getAuthContext, assertSameSchool } from '@/lib/auth/server'
import { checkRateLimit, getClientIpFromHeaders } from '@/lib/rate-limit'
import { z } from 'zod'
import { AIEvaluationService } from '@/lib/ai/evaluation-service'

const bodySchema = z.object({
  userMessage: z.string().min(1),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = getClientIpFromHeaders(request.headers)
    const rl = checkRateLimit(ip, 'evaluations:CHAT_ONE', 60, 60_000)
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } })
    }
    const auth = await getAuthContext()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const { userMessage } = bodySchema.parse(await request.json())

    const evaluation = await prisma.evaluation.findUnique({
      where: { id },
      include: {
        teacher: true,
      },
    })
    if (!evaluation) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    assertSameSchool(evaluation, auth.schoolId)

    // Only the evaluator/admin or the evaluation's teacher can chat
    if (auth.role === 'TEACHER') {
      const teacher = await prisma.teacher.findFirst({ where: { email: auth.email, schoolId: auth.schoolId }, select: { id: true } })
      if (!teacher || teacher.id !== evaluation.teacherId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const teacher = evaluation.teacher
    const [obsRecords, evalRecords] = await Promise.all([
      prisma.observation.findMany({ where: { teacherId: teacher.id }, orderBy: { date: 'desc' }, take: 5 }),
      prisma.evaluation.findMany({ where: { teacherId: teacher.id }, orderBy: { createdAt: 'desc' }, take: 3 }),
    ])

    const previousObservations = obsRecords.map((o) => ({
      date: o.date,
      enhancedNotes: o.enhancedNotes ?? undefined,
      rawNotes: o.rawNotes,
    }))
    const previousEvaluations = evalRecords.map((e) => ({
      createdAt: e.createdAt,
      type: e.type,
      summary: e.summary ?? undefined,
      artifacts: (() => {
        try {
          const c = e.content
          if (c && typeof c === 'object') {
            const meta = (c as { meta?: Record<string, unknown> }).meta || {}
            const list = (meta.artifacts as Array<Record<string, unknown>> | undefined) || []
            return list.filter(a => (a?.status as string) === 'APPROVED').map(a => ({
              fileName: String(a.fileName || ''),
              fileType: String(a.fileType || ''),
              fileUrl: String(a.fileUrl || ''),
            }))
          }
        } catch {}
        return []
      })(),
    }))

    const service = new AIEvaluationService()
    const currentMarkdown = typeof evaluation.content === 'object' && evaluation.content && 'markdown' in (evaluation.content as Record<string, unknown>)
      ? String((evaluation.content as { markdown?: unknown }).markdown || '')
      : typeof evaluation.content === 'string'
        ? evaluation.content
        : ''

    const resp = await service.handleChatMessage(userMessage, {
      teacher: {
        id: teacher.id,
        name: teacher.name,
        subject: teacher.subject ?? undefined,
        gradeLevel: teacher.gradeLevel ?? undefined,
        strengths: (teacher.strengths as string[] | null) ?? undefined,
        growthAreas: (teacher.growthAreas as string[] | null) ?? undefined,
      },
      evaluationType: evaluation.type as 'FORMATIVE' | 'SUMMATIVE',
      schoolYear: String(new Date().getFullYear()),
      previousObservations,
      previousEvaluations,
      chatHistory: [],
      requesterRole: auth.role,
    }, currentMarkdown)

    return NextResponse.json(resp)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


