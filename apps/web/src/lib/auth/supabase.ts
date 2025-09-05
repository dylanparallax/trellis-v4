import { createClient as createSupabaseJsClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  !supabaseUrl.includes('placeholder') &&
  supabaseAnonKey !== 'placeholder-key'
)

const isBrowser = typeof window !== 'undefined'

export const supabase = isBrowser
  ? createBrowserClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
      cookies: {
        get(name: string) {
          if (typeof document === 'undefined') return undefined
          const value = `; ${document.cookie}`
          const parts = value.split(`; ${name}=`)
          if (parts.length === 2) return parts.pop()?.split(';').shift()
          return undefined
        },
        set(name: string, value: string, options: Record<string, unknown> = {}) {
          if (typeof document === 'undefined') return
          
          const cookieOptions = {
            path: '/',
            domain: window.location.hostname === 'localhost' ? undefined : `.${window.location.hostname}`,
            secure: window.location.protocol === 'https:',
            httpOnly: false,
            sameSite: 'lax' as const,
            ...options,
          }
          
          let cookieString = `${name}=${value}`
          if (cookieOptions.path) cookieString += `; path=${cookieOptions.path}`
          if (cookieOptions.domain) cookieString += `; domain=${cookieOptions.domain}`
          if (cookieOptions.secure) cookieString += `; secure`
          if (cookieOptions.httpOnly) cookieString += `; httpOnly`
          if (cookieOptions.sameSite) cookieString += `; samesite=${cookieOptions.sameSite}`
          if (cookieOptions.maxAge) cookieString += `; max-age=${cookieOptions.maxAge}`
          if (cookieOptions.expires) cookieString += `; expires=${cookieOptions.expires}`
          
          document.cookie = cookieString
        },
        remove(name: string, options: Record<string, unknown> = {}) {
          if (typeof document === 'undefined') return
          
          const cookieOptions = {
            path: '/',
            domain: window.location.hostname === 'localhost' ? undefined : `.${window.location.hostname}`,
            secure: window.location.protocol === 'https:',
            httpOnly: false,
            sameSite: 'lax' as const,
            ...options,
          }
          
          let cookieString = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`
          if (cookieOptions.path) cookieString += `; path=${cookieOptions.path}`
          if (cookieOptions.domain) cookieString += `; domain=${cookieOptions.domain}`
          
          document.cookie = cookieString
        },
      },
    })
  : createSupabaseJsClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        // No URL detection on the server
        detectSessionInUrl: false,
      },
    })

// Auth helpers
export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  return { data, error }
}

export const signUpWithEmail = async (email: string, password: string, metadata: Record<string, unknown>) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata
    }
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  return { session, error }
} 