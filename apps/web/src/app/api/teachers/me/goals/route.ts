import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthContext } from '@/lib/auth/server'

export const runtime = 'nodejs'

const goalsSchema = z.array(z.object({ goal: z.string().min(1), progress: z.number().min(0).max(100).default(0) }))

export async function GET() {
  try {
    const auth = await getAuthContext()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (auth.role !== 'TEACHER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { prisma } = await import('@trellis/database')
    // Prefer matching by authenticated Teacher ID
    let teacher = await prisma.teacher.findFirst({ where: { id: auth.userId, schoolId: auth.schoolId }, select: { id: true, currentGoals: true } })
    if (!teacher) {
      // Fallback by email for older records without linkage
      teacher = await prisma.teacher.findFirst({ where: { email: { equals: auth.email, mode: 'insensitive' }, schoolId: auth.schoolId }, select: { id: true, currentGoals: true } })
    }
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    return NextResponse.json({ goals: Array.isArray(teacher.currentGoals) ? teacher.currentGoals : [] })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await getAuthContext()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (auth.role !== 'TEACHER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const goals = goalsSchema.parse(body?.goals ?? body)

    const { prisma } = await import('@trellis/database')
    // Prefer matching by authenticated Teacher ID
    let teacher = await prisma.teacher.findFirst({ where: { id: auth.userId, schoolId: auth.schoolId }, select: { id: true } })
    if (!teacher) {
      // Fallback by email for older records without linkage
      teacher = await prisma.teacher.findFirst({ where: { email: { equals: auth.email, mode: 'insensitive' }, schoolId: auth.schoolId }, select: { id: true } })
    }
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })

    await prisma.teacher.update({ where: { id: teacher.id }, data: { currentGoals: goals } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update goals' }, { status: 500 })
  }
}


