export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@trellis/database'
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

    // Merge a deliveredAt meta timestamp into content JSON without breaking markdown payloads
    let nextContent: unknown = existing.content
    try {
      if (existing.content && typeof existing.content === 'object' && !Array.isArray(existing.content)) {
        const obj = existing.content as Record<string, unknown>
        const meta = { ...(obj.meta as Record<string, unknown> | undefined), deliveredAt: now.toISOString(), deliveredByEmail: auth.email }
        nextContent = { ...obj, meta }
      } else if (existing.content && typeof existing.content === 'string') {
        nextContent = { markdown: existing.content, meta: { deliveredAt: now.toISOString(), deliveredByEmail: auth.email } }
      } else if (existing.content && typeof existing.content === 'object' && 'markdown' in (existing.content as Record<string, unknown>)) {
        const obj = existing.content as { markdown?: string; [k: string]: unknown }
        const prevMeta = (obj as { meta?: Record<string, unknown> }).meta || {}
        nextContent = { ...obj, meta: { ...prevMeta, deliveredAt: now.toISOString(), deliveredByEmail: auth.email } }
      } else {
        nextContent = { markdown: '', meta: { deliveredAt: now.toISOString(), deliveredByEmail: auth.email } }
      }
    } catch {
      nextContent = existing.content
    }

    const updated = await prisma.evaluation.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
        submittedAt: now,
        content: nextContent,
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


