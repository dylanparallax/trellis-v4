export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkRateLimit, getClientIpFromHeaders } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIpFromHeaders(req.headers)
    const rl = checkRateLimit(ip, 'auth:password', 10, 60_000)
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } })
    }

    const { email, password } = (await req.json().catch(() => ({}))) as { email?: string; password?: string }
    if (!email || !password) return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseAnonKey) return NextResponse.json({ error: 'Auth not configured' }, { status: 500 })

    const client = createClient(supabaseUrl, supabaseAnonKey)

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
    const MAX_ATTEMPTS = 5
    let attempt = 0
    let lastError: string | null = null
    let lastStatus: number | undefined

    while (attempt < MAX_ATTEMPTS) {
      const { data, error } = await client.auth.signInWithPassword({ email, password })
      if (!error && data.session) {
        const access_token = data.session.access_token
        const refresh_token = data.session.refresh_token
        const response = NextResponse.json({ ok: true })
        const secure = req.nextUrl.protocol === 'https:'
        const cookieBase = { path: '/', httpOnly: true, sameSite: 'lax' as const, secure }
        response.cookies.set({ name: 'sb-access-token', value: access_token, ...cookieBase })
        response.cookies.set({ name: 'sb-refresh-token', value: refresh_token, ...cookieBase })
        return response
      }

      if (error) {
        // Read status if present
        const status = (error as unknown as { status?: number }).status
        lastStatus = status
        lastError = error.message
        if (status === 429 || /rate limit|too many requests|over_request_rate_limit/i.test(error.message)) {
          const retryAfterHeader = 0
          const backoffMs = Math.min(30000, retryAfterHeader > 0 ? retryAfterHeader * 1000 : 1000 * 2 ** attempt)
          await sleep(backoffMs)
          attempt += 1
          continue
        }
        return NextResponse.json({ error: error.message }, { status: typeof status === 'number' ? status : 400 })
      }
      break
    }

    return NextResponse.json({ error: lastError || 'Login failed' }, { status: typeof lastStatus === 'number' ? lastStatus : 400 })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}



