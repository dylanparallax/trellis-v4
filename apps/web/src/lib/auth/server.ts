import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export type AuthContext = {
  userId: string
  email: string
  name: string | null
  role: 'ADMIN' | 'EVALUATOR' | 'DISTRICT_ADMIN'
  schoolId: string
  schoolName?: string
}

export async function getSupabaseServerClient() {
  const cookieStore = await cookies()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

  const client = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: Record<string, unknown>) {
        cookieStore.set({ name, value, ...options })
      },
      remove(name: string, options: Record<string, unknown>) {
        cookieStore.set({ name, value: '', ...options })
      },
    },
  })

  return client
}

export async function getAuthContext(): Promise<AuthContext | null> {
  try {
    if (process.env.DEMO_MODE === 'true') {
      return {
        userId: 'demo-user-1',
        email: 'demo@trellis.local',
        name: 'Demo User',
        role: 'ADMIN',
        schoolId: 'demo-school-1',
        schoolName: 'Demo School',
      }
    }
    
    const supabase = await getSupabaseServerClient()
    const { data, error } = await supabase.auth.getUser()
    
    if (error) {
      console.warn('Auth user error:', error.message)
      return null
    }
    
    if (!data.user?.email) {
      console.warn('No user email found in auth data')
      return null
    }

    const isDbConfigured = Boolean(process.env.DATABASE_URL)
    const userMetadata = (data.user.user_metadata as { name?: string; full_name?: string; firstName?: string; lastName?: string; schoolName?: string; schoolId?: string }) || {}
    const composedName =
      userMetadata?.name ||
      userMetadata?.full_name ||
      `${userMetadata?.firstName ?? ''} ${userMetadata?.lastName ?? ''}`.trim() ||
      null
      
    if (!isDbConfigured) {
      // Try to read app user from Supabase DB directly using service role
      let resolvedName = composedName
      let resolvedSchoolId = userMetadata?.schoolId ?? ''
      let resolvedRole: AuthContext['role'] = 'EVALUATOR'

      try {
        const { createClient } = await import('@supabase/supabase-js')
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
        if (process.env.NEXT_PUBLIC_SUPABASE_URL && serviceKey) {
          const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, serviceKey)
          const { data: dbUser } = await admin
            .from('User')
            .select('name, role, schoolId')
            .eq('email', data.user.email)
            .limit(1)
            .maybeSingle()
          if (dbUser) {
            resolvedName = resolvedName || dbUser.name || null
            resolvedSchoolId = resolvedSchoolId || dbUser.schoolId || ''
            if (dbUser.role && ['ADMIN','EVALUATOR','DISTRICT_ADMIN'].includes(dbUser.role)) {
              resolvedRole = dbUser.role as AuthContext['role']
            }
          }
        }
      } catch (error) {
        console.warn('Failed to fetch user from Supabase DB:', error)
        // ignore and use metadata fallbacks
      }

      return {
        userId: data.user.id,
        email: data.user.email,
        name: resolvedName,
        role: resolvedRole,
        schoolId: resolvedSchoolId,
        schoolName: userMetadata?.schoolName,
      }
    }

    try {
      const { prisma } = await import('@trellis/database')
      const appUser = await prisma.user.findUnique({ where: { email: data.user.email } })

      if (!appUser) {
        // Try to fetch school linkage directly from the DB via Supabase service key
        let inferredSchoolId = userMetadata?.schoolId ?? ''
        let inferredName = composedName
        try {
          const { createClient } = await import('@supabase/supabase-js')
          const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
          if (process.env.NEXT_PUBLIC_SUPABASE_URL && serviceKey) {
            const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, serviceKey)
            const { data: dbUser } = await admin
              .from('User')
              .select('name, schoolId')
              .eq('email', data.user.email)
              .limit(1)
              .maybeSingle()
            if (dbUser) {
              inferredName = inferredName || dbUser.name || null
              inferredSchoolId = inferredSchoolId || dbUser.schoolId || ''
            }
          }
        } catch (error) {
          console.warn('Failed to fetch user from Supabase DB fallback:', error)
          // ignore and use metadata fallbacks
        }

        return {
          userId: data.user.id,
          email: data.user.email,
          name: inferredName,
          role: 'EVALUATOR',
          schoolId: inferredSchoolId,
          schoolName: userMetadata?.schoolName,
        }
      }

      return {
        userId: appUser.id,
        email: appUser.email,
        name: appUser.name,
        role: appUser.role as AuthContext['role'],
        schoolId: appUser.schoolId,
        // layout will fetch school name from DB; keep optional metadata as fallback
        schoolName: userMetadata?.schoolName,
      }
    } catch (error) {
      console.warn('Failed to fetch user from Prisma DB:', error)
      return {
        userId: data.user.id,
        email: data.user.email,
        name: userMetadata?.name || userMetadata?.full_name || `${userMetadata?.firstName ?? ''} ${userMetadata?.lastName ?? ''}`.trim() || null,
        role: 'EVALUATOR',
        schoolId: userMetadata?.schoolId ?? '',
        schoolName: userMetadata?.schoolName,
      }
    }
  } catch (error) {
    console.error('Critical error in getAuthContext:', error)
    return null
  }
}

export function assertSameSchool<T extends { schoolId: string }>(entity: T, schoolId: string) {
  if (entity.schoolId !== schoolId) {
    const err = new Error('Forbidden')
    ;(err as Error & { status?: number }).status = 403
    throw err
  }
}


