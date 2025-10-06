import { NextRequest, NextResponse } from 'next/server'
// Import Prisma dynamically to avoid crashes when DATABASE_URL isn't configured
import { z } from 'zod'
import type { ObservationType } from '@trellis/types'
import { getAuthContext } from '@/lib/auth/server'
import { checkRateLimit, getClientIpFromHeaders } from '@/lib/rate-limit'

const observationSchema = z.object({
  teacherId: z.string().min(1, 'Teacher ID is required'),
  rawNotes: z.string().min(1, 'Raw notes are required'),
  enhancedNotes: z.string().optional(),
  observationType: z.enum(['FORMAL', 'INFORMAL', 'WALKTHROUGH', 'OTHER']) as unknown as z.ZodType<ObservationType>,
  duration: z.number().min(1, 'Duration must be at least 1 minute').optional(),
  focusAreas: z.array(z.string()).default([]),
  // Accept either full ISO datetime or simple YYYY-MM-DD date strings
  date: z.string().optional(),
  // Optional separate time input in HH:mm format to combine with date
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  // Optional subject for this observation instance
  subject: z.string().optional().or(z.literal('')),
  artifacts: z.array(z.object({
    fileName: z.string(),
    fileUrl: z.string(),
    fileType: z.string()
  })).default([])
})

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (auth.role === 'TEACHER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get('teacherId')

    const where: Record<string, string> = {}
    if (teacherId) where.teacherId = teacherId
    where.schoolId = auth.schoolId

    const { prisma } = await import('@trellis/database')
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
    const ip = getClientIpFromHeaders(request.headers)
    const rl = checkRateLimit(ip, 'observations:POST', 60, 60_000)
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } })
    }
    const auth = await getAuthContext()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (auth.role === 'TEACHER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const body = await request.json()
    const validated = observationSchema.parse(body)
    
    const { prisma } = await import('@trellis/database')
    // Verify the teacher belongs to the same school
    const teacher = await prisma.teacher.findUnique({ where: { id: validated.teacherId }, select: { schoolId: true } })
    if (!teacher || teacher.schoolId !== auth.schoolId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Resolve Prisma user id to ensure FK integrity (auto-create if missing)
    let prismaUser = await prisma.user.findUnique({ where: { email: auth.email } })
    if (!prismaUser) {
      prismaUser = await prisma.user.create({
        data: {
          email: auth.email,
          name: auth.name ?? auth.email.split('@')[0],
          role: 'EVALUATOR',
          schoolId: auth.schoolId,
        },
      })
    }
    // Normalize provided date, accepting both ISO and YYYY-MM-DD
    const dateInput = validated.date
    let parsedDate: Date
    if (dateInput && typeof dateInput === 'string') {
      // YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        // If time provided, combine; else start of day (UTC) to avoid TZ drift
        if (validated.time && /^\d{2}:\d{2}$/.test(validated.time)) {
          parsedDate = new Date(`${dateInput}T${validated.time}:00.000Z`)
        } else {
          parsedDate = new Date(`${dateInput}T00:00:00.000Z`)
        }
      } else {
        const d = new Date(dateInput)
        parsedDate = isNaN(d.getTime()) ? new Date() : d
      }
    } else {
      parsedDate = new Date()
    }

    const observation = await prisma.observation.create({
      data: {
        teacherId: validated.teacherId,
        observerId: prismaUser.id,
        schoolId: auth.schoolId,
        rawNotes: validated.rawNotes,
        enhancedNotes: validated.enhancedNotes,
        observationType: validated.observationType,
        duration: validated.duration,
        focusAreas: validated.focusAreas,
        date: parsedDate,
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