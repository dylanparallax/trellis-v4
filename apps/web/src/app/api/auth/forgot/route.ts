export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { checkRateLimit, getClientIpFromHeaders } from '@/lib/rate-limit'

const requestSchema = z.object({
  email: z.string().email(),
})

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIpFromHeaders(req.headers)
    const rl = checkRateLimit(ip, 'auth:forgot', 5, 60_000)
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } })
    }

    const json = await req.json().catch(() => ({}))
    const { email } = requestSchema.parse(json)

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Auth not configured' }, { status: 500 })
    }

    const redirectToBase = `${req.nextUrl.origin}`
    const redirectTo = `${redirectToBase}/reset-password`

    const client = createClient(supabaseUrl, supabaseAnonKey)
    const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo })
    if (error) {
      // Do not leak user existence; return generic response
      return NextResponse.json({ message: 'If the email exists, a reset link was sent.' })
    }
    return NextResponse.json({ message: 'If the email exists, a reset link was sent.' })
  } catch (e) {
    // Generic response to avoid user enumeration
    return NextResponse.json({ message: 'If the email exists, a reset link was sent.' })
  }
}


