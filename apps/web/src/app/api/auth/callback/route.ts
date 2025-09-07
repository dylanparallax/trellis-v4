import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    if (!supabaseUrl || !supabaseAnonKey) return NextResponse.json({ ok: false })

    const body = await req.json().catch(() => ({})) as { session?: { access_token?: string; refresh_token?: string } }
    const access_token = body?.session?.access_token
    const refresh_token = body?.session?.refresh_token
    if (!access_token || !refresh_token) return NextResponse.json({ ok: false })

    const response = NextResponse.json({ ok: true })
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get: (name: string) => req.cookies.get(name)?.value,
        set: (name: string, value: string, options: Record<string, unknown>) => {
          response.cookies.set({
            name,
            value,
            path: '/',
            httpOnly: true,
            sameSite: 'lax',
            secure: req.nextUrl.protocol === 'https:',
            ...options,
          })
        },
        remove: (name: string, options: Record<string, unknown>) => {
          response.cookies.set({ name, value: '', path: '/', maxAge: 0, ...options })
        },
      },
    })

    await supabase.auth.setSession({ access_token, refresh_token })
    return response
  } catch (e) {
    return NextResponse.json({ ok: false })
  }
}


