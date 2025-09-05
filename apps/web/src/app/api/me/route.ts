export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth/server'
import { getSupabaseServerClient } from '@/lib/auth/server'

export async function GET() {
  try {
    const auth = await getAuthContext()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    let name = auth.name
    let role = auth.role
    let schoolId = auth.schoolId
    let schoolName = auth.schoolName

    // Enrich from Prisma whenever DB is configured and not in demo mode
    const isDbConfigured = Boolean(process.env.DATABASE_URL)
    if (isDbConfigured && process.env.DEMO_MODE !== 'true') {
      try {
        const { prisma } = await import('@trellis/database')
        const user = await prisma.user.findUnique({
          where: { email: auth.email },
          select: { name: true, role: true, schoolId: true, school: { select: { name: true } } },
        })
        if (user) {
          name = user.name ?? name
          role = (user.role as typeof role) ?? role
          schoolId = user.schoolId ?? schoolId
          schoolName = user.school?.name ?? schoolName
        }
      } catch {
        // ignore and use auth fallbacks
      }
    }

    return NextResponse.json({ name, role, email: auth.email, schoolId, schoolName })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await getAuthContext()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json() as { name?: string; photoUrl?: string }
    const name = typeof body.name === 'string' ? body.name.trim() : undefined
    const photoUrl = typeof body.photoUrl === 'string' ? body.photoUrl.trim() : undefined

    // Update Prisma User name when provided
    if (name) {
      try {
        const { prisma } = await import('@trellis/database')
        await prisma.user.update({ where: { email: auth.email }, data: { name } })
      } catch {
        // ignore prisma failure and still update auth metadata
      }
    }

    // Update Supabase auth user metadata for profile fields
    const supabase = await getSupabaseServerClient()
    const { error } = await supabase.auth.updateUser({
      data: {
        ...(name ? { name } : {}),
        ...(photoUrl ? { photo_url: photoUrl } : {}),
      }
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


