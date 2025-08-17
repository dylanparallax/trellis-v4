import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@trellis/database'
import { z } from 'zod'
import { getAuthContext } from '@/lib/auth/server'
import { mockTeachers } from '@/lib/data/mock-data'

const teacherSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional().or(z.literal('')),
  subject: z.string().optional().or(z.literal('')),
  gradeLevel: z.string().optional().or(z.literal('')),
  strengths: z.array(z.string()).default([]),
  growthAreas: z.array(z.string()).default([]),
  currentGoals: z.array(z.object({
    goal: z.string(),
    progress: z.number().min(0).max(100)
  })).default([])
})

export async function GET() {
  try {
    const auth = await getAuthContext()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Demo-mode fallback
    if (process.env.DEMO_MODE === 'true' || process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
      // Return a minimal slice of fields consistent with usage in clients
      const teachers = mockTeachers.map(t => ({
        id: t.id,
        name: t.name,
        subject: t.subject ?? '',
        gradeLevel: t.gradeLevel ?? '',
      }))
      return NextResponse.json(teachers)
    }

    const teachers = await prisma.teacher.findMany({
      where: { schoolId: auth.schoolId },
      include: {
        observations: {
          orderBy: { date: 'desc' },
          take: 5
        },
        evaluations: {
          orderBy: { createdAt: 'desc' },
          take: 3
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(teachers)
  } catch (error) {
    console.error('Error fetching teachers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch teachers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    const validated = teacherSchema.parse(body)
    
    const teacher = await prisma.teacher.create({
      data: {
        ...validated,
        schoolId: auth.schoolId,
        performanceHistory: [],
        currentGoals: validated.currentGoals,
        strengths: validated.strengths,
        growthAreas: validated.growthAreas
      },
      include: {
        school: true
      }
    })

    return NextResponse.json(teacher, { status: 201 })
  } catch (error) {
    console.error('Error creating teacher:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create teacher' },
      { status: 500 }
    )
  }
} 