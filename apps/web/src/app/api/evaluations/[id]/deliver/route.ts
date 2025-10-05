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
    const rl = checkRateLimit(ip, 'evaluations:DELIVER', 30, 60_000)
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } })
    }

    const auth = await getAuthContext()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (auth.role === 'TEACHER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    const existing = await prisma.evaluation.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    assertSameSchool(existing, auth.schoolId)

    const now = new Date()
    const metaBase = { deliveredAt: now.toISOString(), deliveredByEmail: auth.email }
    // Merge a deliveredAt meta timestamp into content JSON without breaking markdown payloads
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
        status: 'SUBMITTED',
        submittedAt: now,
        content: nextContent as Prisma.InputJsonValue,
      },
      include: {
        teacher: { select: { id: true, name: true } },
      },
    })

    // Optional: fire-and-forget webhook for email notification if configured
    try {
      const webhookUrl = process.env.NOTIFY_WEBHOOK_URL
      if (webhookUrl) {
        fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'evaluation.delivered',
            evaluationId: updated.id,
            teacherId: updated.teacherId,
            deliveredAt: now.toISOString(),
            deliveredBy: auth.email,
          })
        }).catch(() => {})
      }
    } catch {}

    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


