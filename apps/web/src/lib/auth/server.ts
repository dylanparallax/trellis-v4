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
  if (error || !data.user?.email) return null

  const isDbConfigured = Boolean(process.env.DATABASE_URL)
  const userMetadata = (data.user.user_metadata as { name?: string; schoolName?: string; schoolId?: string }) || {}
  if (!isDbConfigured) {
    return {
      userId: data.user.id,
      email: data.user.email,
      name: userMetadata?.name ?? null,
      role: 'EVALUATOR',
      schoolId: userMetadata?.schoolId ?? '',
      schoolName: userMetadata?.schoolName,
    }
  }

  try {
    const { prisma } = await import('@trellis/database')
    const appUser = await prisma.user.findUnique({ where: { email: data.user.email } })

    return {
      userId: appUser.id,
      email: appUser.email,
      name: appUser.name,
      role: appUser.role as AuthContext['role'],
      schoolId: appUser.schoolId,
      // layout will fetch school name from DB; keep optional metadata as fallback
      schoolName: userMetadata?.schoolName,
    }
  } catch {
    return {
      userId: data.user.id,
      email: data.user.email,
      name: userMetadata?.name ?? null,
      role: 'EVALUATOR',
      schoolId: userMetadata?.schoolId ?? '',
      schoolName: userMetadata?.schoolName,
    }
  }
}

export function assertSameSchool<T extends { schoolId: string }>(entity: T, schoolId: string) {
  if (entity.schoolId !== schoolId) {
    const err = new Error('Forbidden')
    ;(err as Error & { status?: number }).status = 403
    throw err
  }
}


