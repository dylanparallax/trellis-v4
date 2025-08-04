import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@trellis/database'
import { z } from 'zod'

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const schoolId = searchParams.get('schoolId')
    
    if (!schoolId) {
      return NextResponse.json(
        { error: 'School ID is required' },
        { status: 400 }
      )
    }

    const teachers = await prisma.teacher.findMany({
      where: { schoolId },
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
    const body = await request.json()
    const validated = teacherSchema.parse(body)
    
    // For now, we'll use a default school ID
    // In a real app, this would come from the authenticated user's context
    const schoolId = 'demo-school-1'
    
    const teacher = await prisma.teacher.create({
      data: {
        ...validated,
        schoolId,
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
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create teacher' },
      { status: 500 }
    )
  }
} 