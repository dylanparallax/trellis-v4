export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@trellis/database'
import { getAuthContext, assertSameSchool } from '@/lib/auth/server'
import { checkRateLimit, getClientIpFromHeaders } from '@/lib/rate-limit'
import { z } from 'zod'
import { coachService } from '@/lib/ai/coach-service'

const bodySchema = z.object({
  userMessage: z.string().min(1),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = getClientIpFromHeaders(request.headers)
    const rl = checkRateLimit(ip, 'evaluations:COACH', 60, 60_000)
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } })
    }

    const auth = await getAuthContext()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (auth.role !== 'TEACHER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { id } = await params
    const { userMessage } = bodySchema.parse(await request.json())

    const evaluation = await prisma.evaluation.findUnique({
      where: { id },
      include: { teacher: true },
    })
    if (!evaluation) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    assertSameSchool(evaluation, auth.schoolId)

    // Ensure teacher is the owner
    const teacher = await prisma.teacher.findFirst({ where: { email: { equals: auth.email, mode: 'insensitive' }, schoolId: auth.schoolId }, select: { id: true } })
    if (!teacher || teacher.id !== evaluation.teacherId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const [obsRecords, evalRecords] = await Promise.all([
      prisma.observation.findMany({ where: { teacherId: evaluation.teacherId }, orderBy: { date: 'desc' }, take: 5 }),
      prisma.evaluation.findMany({ where: { teacherId: evaluation.teacherId }, orderBy: { createdAt: 'desc' }, take: 3 }),
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
    }))

    const resp = await coachService.handleMessage(userMessage, {
      teacher: {
        id: evaluation.teacher.id,
        name: evaluation.teacher.name,
        subject: evaluation.teacher.subject ?? undefined,
        gradeLevel: evaluation.teacher.gradeLevel ?? undefined,
        strengths: (evaluation.teacher.strengths as string[] | null) ?? undefined,
        growthAreas: (evaluation.teacher.growthAreas as string[] | null) ?? undefined,
      },
      evaluationType: evaluation.type as any,
      schoolYear: String(new Date().getFullYear()),
      previousObservations,
      previousEvaluations,
    })

    return NextResponse.json(resp)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


