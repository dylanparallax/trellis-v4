export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@trellis/database'
import type { Prisma } from '@prisma/client'
import { getAuthContext, assertSameSchool } from '@/lib/auth/server'
import { checkRateLimit, getClientIpFromHeaders } from '@/lib/rate-limit'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = getClientIpFromHeaders(request.headers)
    const rl = checkRateLimit(ip, 'evaluations:ACK', 60, 60_000)
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } })
    }

    const auth = await getAuthContext()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (auth.role !== 'TEACHER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    const existing = await prisma.evaluation.findUnique({ where: { id }, include: { teacher: true } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    assertSameSchool(existing, auth.schoolId)

    // Only the evaluation's teacher can acknowledge
    if (existing.teacher?.email && existing.teacher.email.toLowerCase() !== auth.email.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const now = new Date()
    const metaBase = { acknowledgedAt: now.toISOString(), acknowledgedByEmail: auth.email }
    let nextContent: Prisma.InputJsonValue = { markdown: '', meta: metaBase } as unknown as Prisma.InputJsonValue
    try {
      if (typeof existing.content === 'string') {
        nextContent = { markdown: existing.content, meta: metaBase } as unknown as Prisma.InputJsonValue
      } else if (existing.content && typeof existing.content === 'object' && !Array.isArray(existing.content)) {
        const obj = existing.content as unknown as Record<string, unknown>
        const prevMeta = (obj.meta as Record<string, unknown> | undefined) || {}
        nextContent = { ...obj, meta: { ...prevMeta, ...metaBase } } as unknown as Prisma.InputJsonValue
      } else {
        nextContent = { markdown: '', meta: metaBase } as unknown as Prisma.InputJsonValue
      }
    } catch {
      nextContent = { markdown: '', meta: metaBase } as unknown as Prisma.InputJsonValue
    }

    const updated = await prisma.evaluation.update({
      where: { id },
      data: {
        status: 'ACKNOWLEDGED',
        content: nextContent,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


