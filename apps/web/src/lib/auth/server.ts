import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export type AuthContext = {
  userId: string
  email: string
  name: string | null
  role: 'ADMIN' | 'EVALUATOR' | 'DISTRICT_ADMIN' | 'TEACHER'
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
        try {
          const cookieOptions = {
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            httpOnly: false,
            sameSite: 'lax' as const,
            maxAge: 60 * 60 * 24 * 7, // 7 days
            ...options,
          }
          cookieStore.set({ name, value, ...cookieOptions })
        } catch {
          // Ignore cookie set failures in RSC contexts
        }
      },
      remove(name: string, options: Record<string, unknown>) {
        try {
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
        } catch {
          // Ignore cookie remove failures in RSC contexts
        }
      },
    },
  })

  return client
}

export async function getAuthContext(): Promise<AuthContext | null> {
  try {
    // Demo mode disabled entirely; require real auth
    
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
    const userEmail = user.email as string
    const isDbConfigured = Boolean(process.env.DATABASE_URL)
    const userMetadata = (user.user_metadata as { name?: string; full_name?: string; firstName?: string; lastName?: string; schoolName?: string; schoolId?: string }) || {}
    const composedName =
      userMetadata?.name ||
      userMetadata?.full_name ||
      `${userMetadata?.firstName ?? ''} ${userMetadata?.lastName ?? ''}`.trim() ||
      null

    // Prefer Prisma when DATABASE_URL is configured and not in demo mode
    if (isDbConfigured) {
      try {
        const { prisma } = await import('@trellis/database')
        // Fetch both in parallel
        const [prismaUser, prismaTeacher] = await Promise.all([
          prisma.user.findUnique({
            where: { email: user.email },
            include: { school: { select: { name: true } } },
          }),
          prisma.teacher.findFirst({
            where: { email: { equals: userEmail, mode: 'insensitive' } },
            include: { school: { select: { name: true } } },
          }),
        ])

        // Prefer high-privilege staff roles first (ADMIN/DISTRICT_ADMIN)
        if (prismaUser && ['ADMIN', 'DISTRICT_ADMIN'].includes(String(prismaUser.role))) {
          return {
            userId: prismaUser.id,
            email: prismaUser.email ?? userEmail,
            name: prismaUser.name ?? composedName,
            role: prismaUser.role,
            schoolId: prismaUser.schoolId,
            schoolName: prismaUser.school?.name ?? userMetadata?.schoolName,
          }
        }

        // Prefer teacher over evaluator if both exist (common when a teacher was initially created as evaluator)
        if (prismaTeacher) {
          return {
            userId: prismaTeacher.id,
            email: userEmail,
            name: composedName,
            role: 'TEACHER',
            schoolId: prismaTeacher.schoolId,
            schoolName: prismaTeacher.school?.name ?? userMetadata?.schoolName,
          }
        }

        // Otherwise fall back to any remaining user record (e.g., EVALUATOR)
        if (prismaUser) {
          return {
            userId: prismaUser.id,
            email: prismaUser.email ?? userEmail,
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

    // Fallback: prefer staff user in Supabase public schema if accessible
    {
      try {
        const { createClient } = await import('@supabase/supabase-js')
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        if (supabaseUrl && supabaseAnonKey) {
          const client = createClient(supabaseUrl, supabaseAnonKey)
          // Look up staff user first
          const { data: dbUser } = await client
            .from('User')
            .select('name, role, schoolId, School(name)')
            .eq('email', userEmail)
            .limit(1)
            .maybeSingle()
          if (dbUser && ['ADMIN','DISTRICT_ADMIN'].includes(dbUser.role)) {
            const schoolRelation = (dbUser as { School?: { name?: string } | { name?: string }[] }).School
            const relatedSchoolName = Array.isArray(schoolRelation)
              ? (schoolRelation as { name?: string }[])[0]?.name
              : (schoolRelation as { name?: string } | undefined)?.name
            return {
              userId: user.id,
              email: userEmail,
              name: dbUser.name ?? composedName,
              role: dbUser.role as AuthContext['role'],
              schoolId: dbUser.schoolId ?? '',
              schoolName: relatedSchoolName ?? userMetadata?.schoolName,
            }
          }

          // Prefer Teacher over Evaluator when both exist
          const { data: teacher } = await client
            .from('Teacher')
            .select('id, email, schoolId, School(name)')
            .eq('email', userEmail)
            .limit(1)
            .maybeSingle()
          if (teacher) {
            const schoolRelation = (teacher as { School?: { name?: string } | { name?: string }[] }).School
            const relatedSchoolName = Array.isArray(schoolRelation)
              ? schoolRelation[0]?.name
              : schoolRelation?.name
            return {
              userId: teacher.id,
              email: userEmail,
              name: composedName,
              role: 'TEACHER',
              schoolId: teacher.schoolId ?? '',
              schoolName: relatedSchoolName ?? userMetadata?.schoolName,
            }
          }

          // Finally, treat remaining user as evaluator
          if (dbUser) {
            const schoolRelation = (dbUser as { School?: { name?: string } | { name?: string }[] }).School
            const relatedSchoolName = Array.isArray(schoolRelation)
              ? (schoolRelation as { name?: string }[])[0]?.name
              : (schoolRelation as { name?: string } | undefined)?.name
            return {
              userId: user.id,
              email: userEmail,
              name: dbUser.name ?? composedName,
              role: 'EVALUATOR',
              schoolId: dbUser.schoolId ?? '',
              schoolName: relatedSchoolName ?? userMetadata?.schoolName,
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
      email: userEmail,
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


