import { NextRequest, NextResponse } from 'next/server'
// Import Prisma dynamically to avoid SSR crashes when DATABASE_URL is not set
import { z } from 'zod'
import { getAuthContext } from '@/lib/auth/server'
import { getSignedUrlForStoragePath, isLikelyStoragePath } from '@/lib/storage'
import { checkRateLimit, getClientIpFromHeaders } from '@/lib/rate-limit'

const teacherSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional().or(z.literal('')),
  subject: z.string().optional().or(z.literal('')),
  gradeLevel: z.string().optional().or(z.literal('')),
  photoUrl: z.string().url().optional().or(z.literal('')),
  tenureStatus: z.enum(['TEMPORARY', 'PROBATIONARY', 'PERMANENT']).optional(),
  strengths: z.array(z.string()).default([]),
  growthAreas: z.array(z.string()).default([]),
  departments: z.array(z.string()).default([]),
  currentGoals: z.array(z.object({
    goal: z.string(),
    progress: z.number().min(0).max(100)
  })).default([])
})

export async function GET() {
  try {
    const auth = await getAuthContext()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (auth.role === 'TEACHER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

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

    // Sign any stored storage paths for client consumption
    const result = await Promise.all(
      teachers.map(async (t) => {
        let photoUrl = (t as unknown as { photoUrl?: string | null }).photoUrl ?? null
        if (photoUrl && isLikelyStoragePath(photoUrl)) {
          const signed = await getSignedUrlForStoragePath(photoUrl)
          photoUrl = signed ?? null
          ;(t as unknown as { photoUrl?: string | null }).photoUrl = photoUrl
        }
        return t
      })
    )

    return NextResponse.json(result)
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
    // Rate limit per IP for teacher creation
    const ip = getClientIpFromHeaders(request.headers)
    const rl = checkRateLimit(ip, 'teachers:POST', 20, 60_000)
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } })
    }
    const auth = await getAuthContext()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (auth.role === 'TEACHER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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
        tenureStatus: validated.tenureStatus || undefined,
        departments: validated.departments,
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

    // If client passed a signed URL, store only the storage path instead
    if (validated.photoUrl) {
      try {
        const { prisma } = await import('@trellis/database')
        const path = validated.photoUrl
        await prisma.$executeRawUnsafe(
          'UPDATE "Teacher" SET "photoUrl" = $1 WHERE "id" = $2',
          path,
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