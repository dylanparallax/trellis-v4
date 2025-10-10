export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthContext } from '@/lib/auth/server'
import { checkRateLimit, getClientIpFromHeaders } from '@/lib/rate-limit'
import { enqueueIndex, processIndexQueue } from '@/lib/rag/indexer'
import { prisma } from '@trellis/database'

const schema = z.object({
  scope: z.enum(['school', 'district']).default('school'),
  limit: z.number().int().min(1).max(1000).default(200)
})

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIpFromHeaders(request.headers)
    const rl = checkRateLimit(ip, 'rag:index:run', 10, 60_000)
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } })
    }

    const auth = await getAuthContext()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!['ADMIN','DISTRICT_ADMIN'].includes(auth.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const json = await request.json().catch(() => ({}))
    const { scope, limit } = schema.parse(json)

    // Enqueue items by scope
    if (scope === 'school') {
      const [obs, evals] = await Promise.all([
        prisma.observation.findMany({ where: { schoolId: auth.schoolId }, select: { id: true }, take: limit }),
        prisma.evaluation.findMany({ where: { schoolId: auth.schoolId }, select: { id: true }, take: limit }),
      ])
      for (const o of obs) await enqueueIndex('UPSERT', 'OBSERVATION', o.id)
      for (const e of evals) await enqueueIndex('UPSERT', 'EVALUATION', e.id)
    } else {
      // DISTRICT scope: find all schools sharing the same district label
      const school = await prisma.school.findUnique({ where: { id: auth.schoolId }, select: { district: true } })
      const district = school?.district || null
      if (!district) return NextResponse.json({ error: 'No district set for your school' }, { status: 400 })
      const [obs, evals] = await Promise.all([
        prisma.observation.findMany({ where: { school: { district } }, select: { id: true }, take: limit }),
        prisma.evaluation.findMany({ where: { school: { district } }, select: { id: true }, take: limit }),
      ])
      for (const o of obs) await enqueueIndex('UPSERT', 'OBSERVATION', o.id)
      for (const e of evals) await enqueueIndex('UPSERT', 'EVALUATION', e.id)
    }

    await processIndexQueue(200)

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    console.error('RAG index run error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
