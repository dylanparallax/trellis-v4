import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@trellis/database'
import { getAuthContext, assertSameSchool } from '@/lib/auth/server'
import { z } from 'zod'

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
    const auth = await getAuthContext()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const existing = await prisma.evaluation.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    assertSameSchool(existing, auth.schoolId)

    await prisma.evaluation.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete evaluation' }, { status: 500 })
  }
}


