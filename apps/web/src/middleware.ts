import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  try {
    // Enable demo mode only when explicitly set
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
      // If Supabase is not configured, redirect dashboard routes to login
      // But allow login/signup pages to load normally
      if (req.nextUrl.pathname.startsWith('/dashboard')) {
        return NextResponse.redirect(new URL('/login', req.url))
      }
      // For login/signup pages, just continue without auth checks
      return NextResponse.next()
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          const cookieOptions = {
            path: '/',
            secure: req.nextUrl.protocol === 'https:',
            httpOnly: false,
            sameSite: 'lax' as const,
            maxAge: 60 * 60 * 24 * 7, // 7 days
            ...options,
          }
          
          req.cookies.set({ name, value, ...cookieOptions })
          const response = NextResponse.next({ request: { headers: req.headers } })
          response.cookies.set({ name, value, ...cookieOptions })
        },
        remove(name: string, options: Record<string, unknown>) {
          const cookieOptions = {
            path: '/',
            secure: req.nextUrl.protocol === 'https:',
            httpOnly: false,
            sameSite: 'lax' as const,
            maxAge: 0,
            expires: new Date(0),
            ...options,
          }
          
          req.cookies.set({ name, value: '', ...cookieOptions })
          const response = NextResponse.next({ request: { headers: req.headers } })
          response.cookies.set({ name, value: '', ...cookieOptions })
        },
      },
    })

    // Wrap the session check in try-catch to handle any auth errors gracefully
    let session = null
    try {
      const { data: { session: sessionData }, error } = await supabase.auth.getSession()
      if (error) {
        // Handle rate limiting gracefully
        if (error.message.includes('rate limit') || error.message.includes('over_request_rate_limit')) {
          console.warn('Supabase rate limit reached, skipping auth check for this request')
          // Allow the request to proceed without authentication check
          return NextResponse.next()
        }
        console.warn('Auth session error in middleware:', error.message)
        // Only redirect to login if we're not already on login/signup pages
        if (!req.nextUrl.pathname.startsWith('/login') && !req.nextUrl.pathname.startsWith('/signup')) {
          const response = NextResponse.redirect(new URL('/login', req.url))
          response.cookies.delete('sb-access-token')
          response.cookies.delete('sb-refresh-token')
          return response
        }
        // If we're already on login/signup, just clear cookies and continue
        const response = NextResponse.next()
        response.cookies.delete('sb-access-token')
        response.cookies.delete('sb-refresh-token')
        return response
      }
      session = sessionData
    } catch (error) {
      console.warn('Unexpected auth error in middleware:', error)
      // Only redirect to login if we're not already on login/signup pages
      if (!req.nextUrl.pathname.startsWith('/login') && !req.nextUrl.pathname.startsWith('/signup')) {
        const response = NextResponse.redirect(new URL('/login', req.url))
        response.cookies.delete('sb-access-token')
        response.cookies.delete('sb-refresh-token')
        return response
      }
      // If we're already on login/signup, just clear cookies and continue
      const response = NextResponse.next()
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
    // But only if we're not already on login/signup pages to prevent redirect loops
    if (req.nextUrl.pathname.startsWith('/dashboard')) {
      const response = NextResponse.redirect(new URL('/login', req.url))
      // Clear any potentially corrupted cookies
      response.cookies.delete('sb-access-token')
      response.cookies.delete('sb-refresh-token')
      return response
    }
    // For login/signup pages, just clear cookies and continue
    if (req.nextUrl.pathname.startsWith('/login') || req.nextUrl.pathname.startsWith('/signup')) {
      const response = NextResponse.next()
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