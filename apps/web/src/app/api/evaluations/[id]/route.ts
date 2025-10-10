import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@trellis/database'
import { getAuthContext, assertSameSchool } from '@/lib/auth/server'
import { z } from 'zod'
import { checkRateLimit, getClientIpFromHeaders } from '@/lib/rate-limit'
import { enqueueIndex } from '@/lib/rag/indexer'

export const runtime = 'nodejs'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const evaluation = await prisma.evaluation.findUnique({
      where: { id },
      include: {
        teacher: { select: { id: true, name: true, subject: true, gradeLevel: true } },
        evaluator: { select: { id: true, name: true, email: true } },
      },
    })
    if (!evaluation) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    assertSameSchool(evaluation, auth.schoolId)
    // Teachers may only access their own evaluations
    if (auth.role === 'TEACHER') {
      // Resolve teacher either by email or via User.teacherId link
      const teacherByEmail = await prisma.teacher.findFirst({ where: { email: { equals: auth.email, mode: 'insensitive' }, schoolId: auth.schoolId }, select: { id: true } })
      const teacherId: string | null = teacherByEmail?.id || null
      // No additional fallback; only email-based match is used for teacher context
      if (!teacherId || teacherId !== evaluation.teacher.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }
    return NextResponse.json(evaluation)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch evaluation' }, { status: 500 })
  }
}

const updateSchema = z.object({
  summary: z.string().optional().nullable(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'ACKNOWLEDGED']).optional(),
  type: z.enum(['FORMATIVE', 'SUMMATIVE', 'MID_YEAR', 'END_YEAR']).optional(),
  content: z.unknown().optional(),
  scores: z.unknown().optional(),
  recommendations: z.array(z.string()).optional(),
  nextSteps: z.array(z.string()).optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = getClientIpFromHeaders(req.headers)
    const rl = checkRateLimit(ip, 'evaluations:PATCH', 60, 60_000)
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } })
    }
    const auth = await getAuthContext()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const existing = await prisma.evaluation.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    assertSameSchool(existing, auth.schoolId)

    const body = await req.json()
    const parsed = updateSchema.parse(body)
    const updated = await prisma.evaluation.update({
      where: { id },
      data: {
        summary: parsed.summary === undefined ? undefined : parsed.summary || null,
        status: parsed.status ?? undefined,
        type: parsed.type ?? undefined,
        content: parsed.content ?? undefined,
        scores: parsed.scores ?? undefined,
        recommendations: parsed.recommendations ?? undefined,
        nextSteps: parsed.nextSteps ?? undefined,
      },
      include: {
        teacher: { select: { id: true, name: true, subject: true, gradeLevel: true } },
        evaluator: { select: { id: true, name: true, email: true } },
      },
    })
    // Re-index updated evaluation
    enqueueIndex('UPSERT', 'EVALUATION', id).catch(() => {})
    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update evaluation' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = getClientIpFromHeaders(_req.headers)
    const rl = checkRateLimit(ip, 'evaluations:DELETE', 20, 60_000)
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } })
    }
    const auth = await getAuthContext()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const existing = await prisma.evaluation.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    assertSameSchool(existing, auth.schoolId)

    await prisma.evaluation.delete({ where: { id } })
    // Remove from index
    enqueueIndex('DELETE', 'EVALUATION', id).catch(() => {})
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete evaluation' }, { status: 500 })
  }
}


