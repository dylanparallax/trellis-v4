export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@trellis/database'
import { getAuthContext } from '@/lib/auth/server'
import { checkRateLimit, getClientIpFromHeaders } from '@/lib/rate-limit'

export async function GET(request: Request) {
  try {
    const ip = getClientIpFromHeaders(request.headers as Headers)
    const rl = checkRateLimit(ip, 'notifications:GET', 120, 60_000)
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } })
    }

    const auth = await getAuthContext()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (auth.role === 'TEACHER') {
      // Teacher notifications: count evaluations submitted to them but not acknowledged
      const teacherByEmail = await prisma.teacher.findFirst({ where: { email: { equals: auth.email, mode: 'insensitive' }, schoolId: auth.schoolId }, select: { id: true } })
      const teacherId: string | null = teacherByEmail?.id || null
      // No additional fallback; only email-based match is used for teacher context
      if (!teacherId) return NextResponse.json({ count: 0 })
      const count = await prisma.evaluation.count({ where: { teacherId, schoolId: auth.schoolId, status: 'SUBMITTED' } })
      return NextResponse.json({ count })
    }

    // Admin/Evaluator notifications: count draft evaluations to send
    const count = await prisma.evaluation.count({ where: { schoolId: auth.schoolId, status: 'DRAFT' } })
    return NextResponse.json({ count })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


