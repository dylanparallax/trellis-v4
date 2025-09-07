export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@trellis/database'
import { getAuthContext } from '@/lib/auth/server'
import { checkRateLimit, getClientIpFromHeaders } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get('teacherId')

    const where: Record<string, string> = {}
    if (teacherId) where.teacherId = teacherId
    where.schoolId = auth.schoolId

    const evaluations = await prisma.evaluation.findMany({
      where,
      include: {
        teacher: { select: { id: true, name: true, subject: true, gradeLevel: true } },
        evaluator: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(evaluations)
  } catch (error) {
    console.error('Error fetching evaluations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch evaluations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIpFromHeaders(request.headers)
    const rl = checkRateLimit(ip, 'evaluations:POST', 30, 60_000)
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } })
    }
    const auth = await getAuthContext()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    const {
      teacherId,
      evaluationType,
      schoolYear,
      content,
      summary,
      scores,
      status,
    } = body as {
      teacherId: string
      evaluationType: 'FORMATIVE' | 'SUMMATIVE' | 'MID_YEAR' | 'END_YEAR'
      schoolYear?: string
      content: unknown
      summary?: string
      scores?: unknown
      status?: 'DRAFT' | 'SUBMITTED'
    }

    if (!teacherId || !content) {
      return NextResponse.json({ error: 'teacherId and content are required' }, { status: 400 })
    }

    // Ensure teacher is in same school
    const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } })
    if (!teacher || teacher.schoolId !== auth.schoolId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Resolve Prisma user id to ensure FK integrity
    const prismaUser = await prisma.user.findUnique({ where: { email: auth.email } })
    if (!prismaUser) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 403 })
    }
    const evaluation = await prisma.evaluation.create({
      data: {
        teacherId,
        evaluatorId: prismaUser.id,
        schoolId: auth.schoolId,
        type: evaluationType || 'FORMATIVE',
        content: typeof content === 'string' ? { markdown: content } : content,
        summary: summary || null,
        scores: scores || {},
        status: status || 'DRAFT',
      },
      include: {
        teacher: { select: { id: true, name: true } },
        evaluator: { select: { id: true, name: true } },
      }
    })

    return NextResponse.json(evaluation, { status: 201 })
  } catch (error) {
    console.error('Error creating evaluation:', error)
    return NextResponse.json({ error: 'Failed to create evaluation' }, { status: 500 })
  }
}


