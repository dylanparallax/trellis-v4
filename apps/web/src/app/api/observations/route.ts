import { NextRequest, NextResponse } from 'next/server'
// Import Prisma dynamically to avoid crashes when DATABASE_URL isn't configured
import { z } from 'zod'
import { getAuthContext } from '@/lib/auth/server'
import { checkRateLimit, getClientIpFromHeaders } from '@/lib/rate-limit'

const observationSchema = z.object({
  teacherId: z.string().min(1, 'Teacher ID is required'),
  rawNotes: z.string().min(1, 'Raw notes are required'),
  enhancedNotes: z.string().optional(),
  observationType: z.enum(['FORMAL', 'INFORMAL', 'WALKTHROUGH']),
  duration: z.number().min(1, 'Duration must be at least 1 minute').optional(),
  focusAreas: z.array(z.string()).default([]),
  // Accept either full ISO datetime or simple YYYY-MM-DD date strings
  date: z.string().optional(),
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
    const body = await request.json()
    const validated = observationSchema.parse(body)
    
    const { prisma } = await import('@trellis/database')
    // Resolve Prisma user id to ensure FK integrity
    const prismaUser = await prisma.user.findUnique({ where: { email: auth.email } })
    if (!prismaUser) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 403 })
    }
    // Normalize provided date, accepting both ISO and YYYY-MM-DD
    const dateInput = validated.date
    let parsedDate: Date
    if (dateInput && typeof dateInput === 'string') {
      // YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        // Interpret as start of day in UTC to avoid TZ drift
        parsedDate = new Date(`${dateInput}T00:00:00.000Z`)
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