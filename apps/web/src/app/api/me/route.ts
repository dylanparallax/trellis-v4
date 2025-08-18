export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth/server'
import { prisma } from '@trellis/database'
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const auth = await getAuthContext()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    let name = auth.name
    let role = auth.role
    let schoolId = auth.schoolId
    let schoolName = auth.schoolName

    try {
      const user = await prisma.user.findUnique({ where: { email: auth.email }, select: { name: true, role: true, schoolId: true } })
      if (user) {
        name = user.name
        role = user.role as typeof role
        schoolId = user.schoolId
      }
      if (schoolId) {
        const school = await prisma.school.findUnique({ where: { id: schoolId }, select: { name: true } })
        schoolName = school?.name ?? schoolName
      }
    } catch {
      // ignore and use auth fallbacks
    }

    // Fallback: query Supabase directly with service role if still missing
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
    if ((!name || !schoolName) && process.env.NEXT_PUBLIC_SUPABASE_URL && serviceKey) {
      try {
        const admin = createSupabaseAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL, serviceKey)
        if (!name || !schoolId) {
          const { data: dbUser } = await admin
            .from('User')
            .select('name, schoolId')
            .eq('email', auth.email)
            .limit(1)
            .maybeSingle()
          if (dbUser) {
            name = name || dbUser.name
            schoolId = schoolId || dbUser.schoolId
          }
        }
        if (!schoolName && schoolId) {
          const { data: school } = await admin
            .from('School')
            .select('name')
            .eq('id', schoolId)
            .limit(1)
            .maybeSingle()
          if (school) schoolName = school.name
        }
      } catch {
        // ignore
      }
    }

    return NextResponse.json({ name, role, email: auth.email, schoolId, schoolName })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


