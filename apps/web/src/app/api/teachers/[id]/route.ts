import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@trellis/database'
import { z } from 'zod'

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
  })).optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id: params.id },
      include: {
        school: true,
        observations: {
          orderBy: { date: 'desc' },
          include: {
            artifacts: true
          }
        },
        evaluations: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!teacher) {
      return NextResponse.json(
        { error: 'Teacher not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(teacher)
  } catch (error) {
    console.error('Error fetching teacher:', error)
    return NextResponse.json(
      { error: 'Failed to fetch teacher' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validated = teacherUpdateSchema.parse(body)

    const teacher = await prisma.teacher.update({
      where: { id: params.id },
      data: validated,
      include: {
        school: true
      }
    })

    return NextResponse.json(teacher)
  } catch (error) {
    console.error('Error updating teacher:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to update teacher' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if teacher has any observations or evaluations
    const teacherWithData = await prisma.teacher.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            observations: true,
            evaluations: true
          }
        }
      }
    })

    if (!teacherWithData) {
      return NextResponse.json(
        { error: 'Teacher not found' },
        { status: 404 }
      )
    }

    if (teacherWithData._count.observations > 0 || teacherWithData._count.evaluations > 0) {
      return NextResponse.json(
        { error: 'Cannot delete teacher with existing observations or evaluations' },
        { status: 400 }
      )
    }

    await prisma.teacher.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Teacher deleted successfully' })
  } catch (error) {
    console.error('Error deleting teacher:', error)
    return NextResponse.json(
      { error: 'Failed to delete teacher' },
      { status: 500 }
    )
  }
} 