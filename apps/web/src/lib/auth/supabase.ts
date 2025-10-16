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
    })
  : createSupabaseJsClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        // No URL detection on the server
        detectSessionInUrl: false,
      },
    })

// Client-side guard: throttle repeated refresh failures and force sign-out if stuck
if (isBrowser) {
  const MAX_FAILURES = 3
  let consecutiveRefreshFailures = 0
  let isBackoffActive = false

  const backoff = async () => {
    if (isBackoffActive) return
    isBackoffActive = true
    const delayMs = Math.min(30000, 1000 * 2 ** consecutiveRefreshFailures)
    await new Promise((r) => setTimeout(r, delayMs))
    isBackoffActive = false
  }

  // Subscribe once for the app lifecycle
  supabase.auth.onAuthStateChange(async (event) => {
    if (event === 'TOKEN_REFRESHED') {
      consecutiveRefreshFailures = 0
      return
    }
    if (event === 'SIGNED_OUT') {
      consecutiveRefreshFailures = 0
      return
    }
    // Some versions emit 'SIGNED_OUT' with refresh failure; also catch repeated null sessions
    if ((event as unknown) === 'TOKEN_REFRESH_FAILED') {
      consecutiveRefreshFailures += 1
      await backoff()
      if (consecutiveRefreshFailures >= MAX_FAILURES) {
        // Hard reset to break refresh loops
        try {
          await supabase.auth.signOut()
        } finally {
          // Redirect to login to clear stuck state
          if (typeof window !== 'undefined') {
            window.location.href = '/login'
          }
        }
      }
    }
  })
}

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