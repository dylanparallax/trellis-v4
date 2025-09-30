import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthContext, getSupabaseServerClient } from '@/lib/auth/server'
import { checkRateLimit, getClientIpFromHeaders } from '@/lib/rate-limit'
import { createClient } from '@supabase/supabase-js'

const schema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
})

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIpFromHeaders(request.headers)
    const rl = checkRateLimit(ip, 'me:password', 10, 60_000)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
      )
    }

    const auth = await getAuthContext()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]
      const message = firstIssue?.message ?? 'Invalid request body'
      return NextResponse.json({ error: message }, { status: 400 })
    }
    const { currentPassword, newPassword } = parsed.data

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: 'New password must be different from current password' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Password change is not available' }, { status: 500 })
    }

    // Verify the current password with a fresh auth client that does not persist the session
    const verifier = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    })
    const { error: verifyError } = await verifier.auth.signInWithPassword({
      email: auth.email,
      password: currentPassword,
    })
    if (verifyError) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
    }

    const supabase = await getSupabaseServerClient()
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
    if (updateError) {
      return NextResponse.json({ error: updateError.message || 'Failed to update password' }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Password change error:', error)
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 })
  }
}

