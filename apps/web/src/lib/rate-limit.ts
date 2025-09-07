type Counter = {
  count: number
  windowStart: number
}

const memoryStore: Map<string, Counter> = new Map()

export function getClientIpFromHeaders(headers: Headers): string {
  const xff = headers.get('x-forwarded-for') || headers.get('x-real-ip')
  if (xff) return xff.split(',')[0]!.trim()
  // Fall back to a constant to avoid undefined keys in local/dev
  return 'local'
}

export function checkRateLimit(
  identifier: string,
  key: string,
  limit = 60,
  windowMs = 60_000,
) {
  const now = Date.now()
  const bucketKey = `${key}:${identifier}`
  const entry = memoryStore.get(bucketKey)
  if (!entry) {
    memoryStore.set(bucketKey, { count: 1, windowStart: now })
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 }
  }
  const elapsed = now - entry.windowStart
  if (elapsed > windowMs) {
    // Reset window
    entry.count = 1
    entry.windowStart = now
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 }
  }
  if (entry.count >= limit) {
    const retryAfterSeconds = Math.ceil((windowMs - elapsed) / 1000)
    return { allowed: false, remaining: 0, retryAfterSeconds }
  }
  entry.count += 1
  return { allowed: true, remaining: Math.max(0, limit - entry.count), retryAfterSeconds: 0 }
}


