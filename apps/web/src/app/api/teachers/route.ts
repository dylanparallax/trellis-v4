import { NextRequest, NextResponse } from 'next/server'
// Import Prisma dynamically to avoid SSR crashes when DATABASE_URL is not set
import { z } from 'zod'
import { getAuthContext } from '@/lib/auth/server'

const teacherSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional().or(z.literal('')),
  subject: z.string().optional().or(z.literal('')),
  gradeLevel: z.string().optional().or(z.literal('')),
  photoUrl: z.string().url().optional().or(z.literal('')),
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

    const { prisma } = await import('@trellis/database')
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
    
    // Create teacher without optional columns that may not exist in older Prisma clients
    const { prisma } = await import('@trellis/database')
    const teacher = await prisma.teacher.create({
      data: {
        name: validated.name,
        email: validated.email || undefined,
        subject: validated.subject || undefined,
        gradeLevel: validated.gradeLevel || undefined,
        schoolId: auth.schoolId,
        performanceHistory: [],
        currentGoals: validated.currentGoals,
        strengths: validated.strengths,
        growthAreas: validated.growthAreas,
      },
      include: {
        school: true
      }
    })

    // Best-effort: if photoUrl provided and the column exists, persist it with a raw query.
    if (validated.photoUrl) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        await prisma.$executeRawUnsafe(
          'UPDATE "Teacher" SET "photoUrl" = $1 WHERE "id" = $2',
          validated.photoUrl,
          teacher.id,
        )
      } catch (e) {
        // ignore if column does not exist in this environment
      }
    }

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