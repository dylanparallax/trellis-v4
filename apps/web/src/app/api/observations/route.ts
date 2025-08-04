import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@trellis/database'
import { z } from 'zod'

const observationSchema = z.object({
  teacherId: z.string().min(1, 'Teacher ID is required'),
  rawNotes: z.string().min(1, 'Raw notes are required'),
  enhancedNotes: z.string().optional(),
  observationType: z.enum(['FORMAL', 'INFORMAL', 'WALKTHROUGH']),
  duration: z.number().min(1, 'Duration must be at least 1 minute').optional(),
  focusAreas: z.array(z.string()).default([]),
  date: z.string().datetime().optional(),
  artifacts: z.array(z.object({
    fileName: z.string(),
    fileUrl: z.string(),
    fileType: z.string()
  })).default([])
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get('teacherId')
    const schoolId = searchParams.get('schoolId')
    
    if (!teacherId && !schoolId) {
      return NextResponse.json(
        { error: 'Either teacherId or schoolId is required' },
        { status: 400 }
      )
    }

    const where: Record<string, string> = {}
    if (teacherId) where.teacherId = teacherId
    if (schoolId) where.schoolId = schoolId

    const observations = await prisma.observation.findMany({
      where,
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            subject: true,
            gradeLevel: true
          }
        },
        observer: {
          select: {
            id: true,
            name: true
          }
        },
        artifacts: true
      },
      orderBy: { date: 'desc' }
    })

    return NextResponse.json(observations)
  } catch (error) {
    console.error('Error fetching observations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch observations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = observationSchema.parse(body)
    
    // For now, we'll use default values for demo
    // In a real app, these would come from the authenticated user's context
    const observerId = 'demo-observer-1'
    const schoolId = 'demo-school-1'
    
    const observation = await prisma.observation.create({
      data: {
        teacherId: validated.teacherId,
        observerId,
        schoolId,
        rawNotes: validated.rawNotes,
        enhancedNotes: validated.enhancedNotes,
        observationType: validated.observationType,
        duration: validated.duration,
        focusAreas: validated.focusAreas,
        date: validated.date ? new Date(validated.date) : new Date(),
        artifacts: {
          create: validated.artifacts
        }
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            subject: true,
            gradeLevel: true
          }
        },
        observer: {
          select: {
            id: true,
            name: true
          }
        },
        artifacts: true
      }
    })

    return NextResponse.json(observation, { status: 201 })
  } catch (error) {
    console.error('Error creating observation:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create observation' },
      { status: 500 }
    )
  }
} 