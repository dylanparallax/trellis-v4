import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@trellis/database'
import { z } from 'zod'
import { getAuthContext, assertSameSchool } from '@/lib/auth/server'

export const runtime = 'nodejs'

const teacherUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email().optional().or(z.literal('')),
  subject: z.string().optional().or(z.literal('')),
  gradeLevel: z.string().optional().or(z.literal('')),
  strengths: z.array(z.string()).optional(),
  growthAreas: z.array(z.string()).optional(),
  currentGoals: z.array(z.object({
    goal: z.string(),
    progress: z.number().min(0).max(100)
  })).optional(),
  photoUrl: z.string().url().optional().or(z.literal('')),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthContext()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = params
    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: {
        school: true,
        observations: { orderBy: { date: 'desc' }, take: 5 },
        evaluations: { orderBy: { createdAt: 'desc' }, take: 3 },
      }
    })
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    assertSameSchool(teacher, auth.schoolId)
    return NextResponse.json(teacher)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch teacher' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthContext()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = params
    const body = await request.json()
    const validated = teacherUpdateSchema.parse(body)

    const existing = await prisma.teacher.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    assertSameSchool(existing, auth.schoolId)

    const updateData: Record<string, unknown> = {}
    if (validated.name !== undefined) updateData.name = validated.name
    if (validated.email !== undefined) updateData.email = validated.email || null
    if (validated.subject !== undefined) updateData.subject = validated.subject || null
    if (validated.gradeLevel !== undefined) updateData.gradeLevel = validated.gradeLevel || null
    if (validated.strengths !== undefined) updateData.strengths = validated.strengths
    if (validated.growthAreas !== undefined) updateData.growthAreas = validated.growthAreas
    if (validated.currentGoals !== undefined) updateData.currentGoals = validated.currentGoals

    const teacher = await prisma.teacher.update({
      where: { id },
      data: updateData,
      include: { school: true },
    })

    if (validated.photoUrl) {
      try {
        await prisma.$executeRawUnsafe(
          'UPDATE "Teacher" SET "photoUrl" = $1 WHERE "id" = $2',
          validated.photoUrl,
          id,
        )
      } catch {}
    }

    return NextResponse.json(teacher)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update teacher' }, { status: 500 })
  }
}
