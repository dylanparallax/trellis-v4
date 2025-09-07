import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function withSecurityHeaders(response: NextResponse) {
  const csp = [
    "default-src 'self'",
    "img-src 'self' data: https://*.supabase.co",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "connect-src 'self' https://*.supabase.co https://api.openai.com https://api.anthropic.com",
    "font-src 'self' data:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')
  response.headers.set('Content-Security-Policy', csp)
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-DNS-Prefetch-Control', 'off')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  return response
}

export async function middleware(req: NextRequest) {
  try {
    // Enable demo mode only when explicitly set
    const isDemoMode = process.env.DEMO_MODE === 'true'
    if (isDemoMode) {
      return withSecurityHeaders(NextResponse.next({ request: { headers: req.headers } }))
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
      // If Supabase is not configured, allow all routes (demo/dev mode)
      return withSecurityHeaders(NextResponse.next())
    }

    // Base response where any refreshed cookies will be attached
    const baseResponse = NextResponse.next({ request: { headers: req.headers } })

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          const cookieOptions = {
            path: '/',
            secure: req.nextUrl.protocol === 'https:',
            httpOnly: true,
            sameSite: 'lax' as const,
            maxAge: 60 * 60 * 24 * 7, // 7 days
            ...options,
          }
          // Attach to base response so we return the same response object
          baseResponse.cookies.set({ name, value, ...cookieOptions })
        },
        remove(name: string, options: Record<string, unknown>) {
          const cookieOptions = {
            path: '/',
            secure: req.nextUrl.protocol === 'https:',
            httpOnly: true,
            sameSite: 'lax' as const,
            maxAge: 0,
            expires: new Date(0),
            ...options,
          }
          baseResponse.cookies.set({ name, value: '', ...cookieOptions })
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
          return withSecurityHeaders(baseResponse)
        }
        console.warn('Auth session error in middleware:', error.message)
        // Only redirect to login if we're not already on login/signup pages
        if (!req.nextUrl.pathname.startsWith('/login') && !req.nextUrl.pathname.startsWith('/signup')) {
          const response = NextResponse.redirect(new URL('/login', req.url))
          response.cookies.delete('sb-access-token')
          response.cookies.delete('sb-refresh-token')
          return withSecurityHeaders(response)
        }
        // If we're already on login/signup, just clear cookies and continue
        const response = NextResponse.next()
        response.cookies.delete('sb-access-token')
        response.cookies.delete('sb-refresh-token')
        return withSecurityHeaders(response)
      }
      session = sessionData
    } catch (error) {
      console.warn('Unexpected auth error in middleware:', error)
      // Only redirect to login if we're not already on login/signup pages
      if (!req.nextUrl.pathname.startsWith('/login') && !req.nextUrl.pathname.startsWith('/signup')) {
        const response = NextResponse.redirect(new URL('/login', req.url))
        response.cookies.delete('sb-access-token')
        response.cookies.delete('sb-refresh-token')
        return withSecurityHeaders(response)
      }
      // If we're already on login/signup, just clear cookies and continue
      const response = NextResponse.next()
      response.cookies.delete('sb-access-token')
      response.cookies.delete('sb-refresh-token')
      return withSecurityHeaders(response)
    }

    if (!session && req.nextUrl.pathname.startsWith('/dashboard')) {
      return withSecurityHeaders(NextResponse.redirect(new URL('/login', req.url)))
    }

    if (session && (req.nextUrl.pathname.startsWith('/login') || req.nextUrl.pathname.startsWith('/signup'))) {
      return withSecurityHeaders(NextResponse.redirect(new URL('/dashboard', req.url)))
    }

    return withSecurityHeaders(baseResponse)
  } catch (error) {
    console.error('Critical middleware error:', error)
    // If there's a critical error, redirect to login to be safe
    // But only if we're not already on login/signup pages to prevent redirect loops
    if (req.nextUrl.pathname.startsWith('/dashboard')) {
      const response = NextResponse.redirect(new URL('/login', req.url))
      // Clear any potentially corrupted cookies
      response.cookies.delete('sb-access-token')
      response.cookies.delete('sb-refresh-token')
      return withSecurityHeaders(response)
    }
    // For login/signup pages, just clear cookies and continue
    if (req.nextUrl.pathname.startsWith('/login') || req.nextUrl.pathname.startsWith('/signup')) {
      const response = NextResponse.next()
      response.cookies.delete('sb-access-token')
      response.cookies.delete('sb-refresh-token')
      return withSecurityHeaders(response)
    }
    return withSecurityHeaders(NextResponse.next())
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/signup'
  ]
} 