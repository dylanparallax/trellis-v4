export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth/server'
import { getSupabaseServerClient } from '@/lib/auth/server'
import { extractPathFromSignedUrl, getSignedUrlForStoragePath } from '@/lib/storage'
import { checkRateLimit, getClientIpFromHeaders } from '@/lib/rate-limit'

export async function GET() {
  try {
    const auth = await getAuthContext()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    let name = auth.name
    let role = auth.role
    let schoolId = auth.schoolId
    let schoolName = auth.schoolName
    let photoUrl: string | undefined

    // Enrich from Prisma whenever DB is configured
    const isDbConfigured = Boolean(process.env.DATABASE_URL)
    if (isDbConfigured) {
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

    // Try to resolve photo from Supabase auth metadata and sign when path is present
    try {
      const supabase = await getSupabaseServerClient()
      const { data } = await supabase.auth.getUser()
      const meta = (data.user?.user_metadata as { photo_url?: string; photo_path?: string } | undefined)
      const path = meta?.photo_path
      const metaUrl = meta?.photo_url
      if (path) {
        const signed = await getSignedUrlForStoragePath(path, 3600)
        photoUrl = signed ?? undefined
      } else if (typeof metaUrl === 'string' && metaUrl.length > 0) {
        // If a signed URL was previously stored, try to extract path to re-sign
        const fromUrl = extractPathFromSignedUrl(metaUrl)
        if (fromUrl) {
          const signed = await getSignedUrlForStoragePath(fromUrl, 3600)
          photoUrl = signed ?? metaUrl
        } else {
          photoUrl = metaUrl
        }
      }
    } catch {}

    return NextResponse.json({ name, role, email: auth.email, schoolId, schoolName, photoUrl })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    // Request has no Headers type; cast from any to extract headers
    const ip = getClientIpFromHeaders((request as unknown as { headers: Headers }).headers)
    const rl = checkRateLimit(ip, 'me:PATCH', 30, 60_000)
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } })
    }
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
    let photo_path: string | undefined
    if (photoUrl) {
      // Prefer storing path when possible
      const path = extractPathFromSignedUrl(photoUrl) || (photoUrl.startsWith('http') ? undefined : photoUrl)
      if (path) photo_path = path
    }
    const { error } = await supabase.auth.updateUser({
      data: {
        ...(name ? { name } : {}),
        ...(photoUrl ? { photo_url: photoUrl } : {}),
        ...(photo_path ? { photo_path } : {}),
      }
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


