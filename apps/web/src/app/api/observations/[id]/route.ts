import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@trellis/database'
import { getAuthContext, assertSameSchool } from '@/lib/auth/server'
import { z } from 'zod'
import { checkRateLimit, getClientIpFromHeaders } from '@/lib/rate-limit'

export const runtime = 'nodejs'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const observation = await prisma.observation.findUnique({
      where: { id },
      include: {
        teacher: { select: { id: true, name: true, subject: true, gradeLevel: true } },
        observer: { select: { id: true, name: true, email: true } },
        artifacts: true,
      },
    })

    if (!observation) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    assertSameSchool(observation, auth.schoolId)

    return NextResponse.json(observation)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch observation' }, { status: 500 })
  }
}

const updateSchema = z.object({
  rawNotes: z.string().min(1).optional(),
  enhancedNotes: z.string().optional().nullable(),
  duration: z.number().int().min(1).optional(),
  observationType: z.enum(['FORMAL', 'INFORMAL', 'WALKTHROUGH']).optional(),
  focusAreas: z.array(z.string()).optional(),
  // Accept either full ISO datetime or simple YYYY-MM-DD date strings
  date: z.string().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = getClientIpFromHeaders(req.headers)
    const rl = checkRateLimit(ip, 'observations:PATCH', 60, 60_000)
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } })
    }
    const auth = await getAuthContext()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const existing = await prisma.observation.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    assertSameSchool(existing, auth.schoolId)

    const body = await req.json()
    const parsed = updateSchema.parse(body)

    // Normalize provided date, accepting both ISO and YYYY-MM-DD (match create API behavior)
    const dateInput = parsed.date
    let normalizedDate: Date | undefined
    if (typeof dateInput === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        // Interpret as start of day in UTC to avoid TZ drift
        normalizedDate = new Date(`${dateInput}T00:00:00.000Z`)
      } else {
        const d = new Date(dateInput)
        normalizedDate = isNaN(d.getTime()) ? undefined : d
      }
    }

    const updated = await prisma.observation.update({
      where: { id },
      data: {
        rawNotes: parsed.rawNotes ?? undefined,
        enhancedNotes: parsed.enhancedNotes === undefined ? undefined : parsed.enhancedNotes || null,
        duration: parsed.duration ?? undefined,
        observationType: parsed.observationType ?? undefined,
        focusAreas: parsed.focusAreas ?? undefined,
        date: normalizedDate ?? undefined,
      },
      include: {
        teacher: { select: { id: true, name: true, subject: true, gradeLevel: true } },
        observer: { select: { id: true, name: true, email: true } },
        artifacts: true,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update observation' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = getClientIpFromHeaders(_req.headers)
    const rl = checkRateLimit(ip, 'observations:DELETE', 30, 60_000)
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } })
    }
    const auth = await getAuthContext()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const existing = await prisma.observation.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    assertSameSchool(existing, auth.schoolId)

    // Ensure artifacts are removed first if FK constraints block deletion
    await prisma.observationArtifact.deleteMany({ where: { observationId: id } })
    await prisma.observation.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete observation' }, { status: 500 })
  }
}
