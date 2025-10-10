export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthContext } from '@/lib/auth/server'
import { checkRateLimit, getClientIpFromHeaders } from '@/lib/rate-limit'
import { searchRag } from '@/lib/rag/retrieval'

const schema = z.object({
  query: z.string().min(2),
  topK: z.number().int().min(1).max(20).optional(),
  filters: z.object({ type: z.enum(['observation', 'evaluation']).optional() }).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIpFromHeaders(request.headers)
    const rl = checkRateLimit(ip, 'rag:search', 120, 60_000)
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } })
    }

    const auth = await getAuthContext()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!['ADMIN','DISTRICT_ADMIN'].includes(auth.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const json = await request.json()
    const { query, topK, filters } = schema.parse(json)

    const results = await searchRag({ query, topK, filters, role: auth.role, userSchoolId: auth.schoolId })

    return NextResponse.json({ results })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    console.error('RAG search error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
