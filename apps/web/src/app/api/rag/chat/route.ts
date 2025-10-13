export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthContext } from '@/lib/auth/server'
import { checkRateLimit, getClientIpFromHeaders } from '@/lib/rate-limit'
import { searchRag } from '@/lib/rag/retrieval'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'

const schema = z.object({
  message: z.string().min(1),
  topK: z.number().int().min(1).max(20).optional(),
  filters: z.object({ type: z.enum(['observation', 'evaluation']).optional() }).optional(),
  conversationId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIpFromHeaders(request.headers)
    const rl = checkRateLimit(ip, 'rag:chat', 60, 60_000)
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } })
    }

    const auth = await getAuthContext()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!['ADMIN','DISTRICT_ADMIN'].includes(auth.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const json = await request.json()
    const { message, topK, filters, conversationId } = schema.parse(json)

    const hits = await searchRag({ query: message, topK, filters, role: auth.role, userSchoolId: auth.schoolId })

    const system = `You are a helpful assistant for school administrators. Answer using only the provided context from observations and evaluations. If insufficient, say so. Include citations like [source:TYPE:ID:CHUNKID]. Role: ${auth.role}. Scope: ${auth.role === 'DISTRICT_ADMIN' ? 'district' : 'school'}.`

    const contextBlock = hits
      .map((h) => {
        const type = h.sourceType === 'OBSERVATION' ? 'observation' : 'evaluation'
        return `- [${type}:${h.sourceId}:${h.chunkId}] ${h.snippet}`
      })
      .join('\n')

    const prompt = `${system}\n\nCONTEXT:\n${contextBlock}\n\nUSER QUESTION: ${message}\n\nINSTRUCTIONS:\n- Be concise.\n- Cite sources inline using [source:TYPE:ID:CHUNKID].\n- If the answer is not in context, say you don't have enough information.`

    const { text } = await generateText({ model: openai('gpt-4o-mini'), prompt, temperature: 0.2 })

    // Persist conversation minimal messages (best-effort)
    try {
      const { prisma } = await import('@trellis/database')
      const conv = conversationId
        ? await prisma.ragConversation.findUnique({ where: { id: conversationId } })
        : await prisma.ragConversation.create({ data: { userId: auth.userId, role: auth.role, schoolId: auth.schoolId, district: null } })
      const convId = conv?.id || (await prisma.ragConversation.create({ data: { userId: auth.userId, role: auth.role, schoolId: auth.schoolId, district: null } })).id
      await prisma.ragMessage.create({ data: { conversationId: convId, role: 'user', content: message } })
      await prisma.ragMessage.create({ data: { conversationId: convId, role: 'assistant', content: text, citations: hits.map(h => ({ chunkId: h.chunkId, sourceType: h.sourceType, sourceId: h.sourceId, score: h.score })) } })
    } catch (persistErr) {
      console.warn('Failed to persist rag chat:', persistErr)
    }

    return NextResponse.json({ message: text, hits })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    console.error('RAG chat error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
