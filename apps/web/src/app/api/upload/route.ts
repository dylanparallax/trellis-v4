export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { extractPathFromSignedUrl, getSignedUrlForStoragePath } from '@/lib/storage'
import { checkRateLimit, getClientIpFromHeaders } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIpFromHeaders(req.headers)
    const rl = checkRateLimit(ip, 'upload:POST', 20, 60_000)
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } })
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Storage not configured' }, { status: 500 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const supabase = createClient(supabaseUrl, serviceKey)
    const arrayBuffer = await file.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    const filePath = `teachers/${Date.now()}-${file.name}`

    const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'profilePic'
    const { error } = await supabase.storage.from(bucket).upload(filePath, bytes, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Generate signed URL for client display and return the storage path so APIs can persist path
    const signedUrl = await getSignedUrlForStoragePath(filePath, 60 * 60) // 1 hour
    return NextResponse.json({
      path: filePath,
      url: signedUrl,
      expiresIn: 3600,
    })
  } catch {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}


