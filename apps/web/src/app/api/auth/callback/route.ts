import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({})) as { session?: { access_token?: string; refresh_token?: string } }
    const access_token = body?.session?.access_token
    const refresh_token = body?.session?.refresh_token
    if (!access_token || !refresh_token) return NextResponse.json({ ok: false })

    const response = NextResponse.json({ ok: true })
    const secure = req.nextUrl.protocol === 'https:'
    const host = req.nextUrl.hostname
    const isWww = host.startsWith('www.')
    const parentDomain = isWww ? host.slice(4) : host
    const domain = parentDomain.split('.').length >= 2 ? `.${parentDomain}` : undefined
    const cookieBase = { path: '/', httpOnly: true, sameSite: 'lax' as const, secure, ...(domain ? { domain } : {}) }
    // Explicitly set Supabase cookies expected by SSR/middleware
    response.cookies.set({ name: 'sb-access-token', value: access_token, ...cookieBase })
    response.cookies.set({ name: 'sb-refresh-token', value: refresh_token, ...cookieBase })
    return response
  } catch (e) {
    return NextResponse.json({ ok: false })
  }
}


