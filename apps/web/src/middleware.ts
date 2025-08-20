import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  try {
    const isDemoMode = process.env.DEMO_MODE === 'true'
    if (isDemoMode) {
      return NextResponse.next({ request: { headers: req.headers } })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

    // If Supabase is not configured, avoid attempting network calls in middleware.
    // Instead, require auth by redirecting dashboard routes to /login.
    const isSupabaseConfigured = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      !supabaseUrl.includes('placeholder') &&
      supabaseAnonKey !== 'placeholder-key'
    )

    if (!isSupabaseConfigured) {
      if (req.nextUrl.pathname.startsWith('/dashboard')) {
        return NextResponse.redirect(new URL('/login', req.url))
      }
      return NextResponse.next()
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          req.cookies.set({ name, value, ...options })
          const response = NextResponse.next({ request: { headers: req.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: Record<string, unknown>) {
          req.cookies.set({ name, value: '', ...options })
          const response = NextResponse.next({ request: { headers: req.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    })

    // Wrap the session check in try-catch to handle any auth errors gracefully
    let session = null
    try {
      const { data: { session: sessionData }, error } = await supabase.auth.getSession()
      if (error) {
        console.warn('Auth session error in middleware:', error.message)
        // Clear any corrupted cookies by removing them
        const response = NextResponse.redirect(new URL('/login', req.url))
        response.cookies.delete('sb-access-token')
        response.cookies.delete('sb-refresh-token')
        return response
      }
      session = sessionData
    } catch (error) {
      console.warn('Unexpected auth error in middleware:', error)
      // Clear cookies and redirect to login
      const response = NextResponse.redirect(new URL('/login', req.url))
      response.cookies.delete('sb-access-token')
      response.cookies.delete('sb-refresh-token')
      return response
    }

    if (!session && req.nextUrl.pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    if (session && (req.nextUrl.pathname.startsWith('/login') || req.nextUrl.pathname.startsWith('/signup'))) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return NextResponse.next()
  } catch (error) {
    console.error('Critical middleware error:', error)
    // If there's a critical error, redirect to login to be safe
    if (req.nextUrl.pathname.startsWith('/dashboard')) {
      const response = NextResponse.redirect(new URL('/login', req.url))
      // Clear any potentially corrupted cookies
      response.cookies.delete('sb-access-token')
      response.cookies.delete('sb-refresh-token')
      return response
    }
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/signup'
  ]
} 