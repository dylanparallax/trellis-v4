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
        const cookieOptions = {
          path: '/',
          secure: process.env.NODE_ENV === 'production',
          httpOnly: false,
          sameSite: 'lax' as const,
          maxAge: 60 * 60 * 24 * 7, // 7 days
          ...options,
        }
        cookieStore.set({ name, value, ...cookieOptions })
      },
      remove(name: string, options: Record<string, unknown>) {
        const cookieOptions = {
          path: '/',
          secure: process.env.NODE_ENV === 'production',
          httpOnly: false,
          sameSite: 'lax' as const,
          maxAge: 0,
          expires: new Date(0),
          ...options,
        }
        cookieStore.set({ name, value: '', ...cookieOptions })
      },
    },
  })

  return client
}

export async function getAuthContext(): Promise<AuthContext | null> {
  try {
    // Enable demo mode only when explicitly set
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

    const user = data.user
    const isDbConfigured = Boolean(process.env.DATABASE_URL)
    const userMetadata = (user.user_metadata as { name?: string; full_name?: string; firstName?: string; lastName?: string; schoolName?: string; schoolId?: string }) || {}
    const composedName =
      userMetadata?.name ||
      userMetadata?.full_name ||
      `${userMetadata?.firstName ?? ''} ${userMetadata?.lastName ?? ''}`.trim() ||
      null

    // Prefer Prisma when DATABASE_URL is configured and not in demo mode
    if (isDbConfigured && process.env.DEMO_MODE !== 'true') {
      try {
        const { prisma } = await import('@trellis/database')
        const prismaUser = await prisma.user.findUnique({
          where: { email: user.email },
          include: { school: { select: { name: true } } },
        })
        if (prismaUser && prismaUser.email) {
          return {
            userId: prismaUser.id,
            email: prismaUser.email,
            name: prismaUser.name ?? composedName,
            role: prismaUser.role,
            schoolId: prismaUser.schoolId,
            schoolName: prismaUser.school?.name ?? userMetadata?.schoolName,
          }
        } else if (prismaUser) {
          return {
            userId: prismaUser.id,
            email: user.email!,
            name: prismaUser.name ?? composedName,
            role: prismaUser.role,
            schoolId: prismaUser.schoolId,
            schoolName: prismaUser.school?.name ?? userMetadata?.schoolName,
          }
        }
      } catch (prismaError) {
        console.log('Failed to fetch user from Prisma DB:', prismaError)
      }
    }

    // Fallback: try Supabase public schema 'User' table if accessible and not in demo mode
    if (process.env.DEMO_MODE !== 'true') {
      try {
        const { createClient } = await import('@supabase/supabase-js')
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        if (supabaseUrl && supabaseAnonKey) {
          const client = createClient(supabaseUrl, supabaseAnonKey)
          const { data: dbUser } = await client
            .from('User')
            .select('name, role, schoolId, School(name)')
            .eq('email', user.email)
            .limit(1)
            .maybeSingle()
          if (dbUser) {
            const role =
              (['ADMIN','EVALUATOR','DISTRICT_ADMIN'].includes(dbUser.role)
                ? dbUser.role
                : 'EVALUATOR') as AuthContext['role']
            return {
              userId: user.id,
              email: user.email,
              name: dbUser.name ?? composedName,
              role,
              schoolId: dbUser.schoolId ?? '',
              schoolName: dbUser.School?.name ?? userMetadata?.schoolName,
            }
          }
        }
      } catch (error) {
        console.warn('Failed to fetch user from Supabase:', error)
      }
    }

    // Final fallback with metadata
    return {
      userId: user.id,
      email: user.email,
      name: composedName,
      role: 'EVALUATOR',
      schoolId: userMetadata?.schoolId ?? '',
      schoolName: userMetadata?.schoolName,
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


