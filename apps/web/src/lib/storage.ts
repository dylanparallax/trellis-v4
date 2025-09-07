import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'profilePic'

export function isLikelyStoragePath(value: string | null | undefined): value is string {
  if (!value) return false
  if (value.startsWith('http')) return false
  // simple heuristic: looks like a key path under our bucket
  return /\w+\//.test(value)
}

export function extractPathFromSignedUrl(url: string): string | null {
  try {
    const u = new URL(url)
    // Expected pattern: /storage/v1/object/sign/<bucket>/<path>
    const parts = u.pathname.split('/')
    const idx = parts.findIndex((p) => p === 'sign')
    if (idx !== -1 && parts[idx + 1] && parts[idx + 2]) {
      const bucket = parts[idx + 1]
      const path = parts.slice(idx + 2).join('/')
      // Only trust our configured bucket
      if (bucket === (process.env.SUPABASE_STORAGE_BUCKET || 'profilePic')) {
        return path
      }
    }
    // Also support /object/public/<bucket>/<path> (just in case)
    const publicIdx = parts.findIndex((p) => p === 'public')
    if (publicIdx !== -1 && parts[publicIdx + 1] && parts[publicIdx + 2]) {
      const bucket = parts[publicIdx + 1]
      const path = parts.slice(publicIdx + 2).join('/')
      if (bucket === (process.env.SUPABASE_STORAGE_BUCKET || 'profilePic')) {
        return path
      }
    }
  } catch {
    // ignore
  }
  return null
}

export async function getSignedUrlForStoragePath(path: string, expiresInSeconds = 60 * 60): Promise<string | null> {
  if (!SUPABASE_URL || !SERVICE_KEY) return null
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY)
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresInSeconds)
  if (error) return null
  return data.signedUrl
}


