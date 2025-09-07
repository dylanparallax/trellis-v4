export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth/server'
import { checkRateLimit, getClientIpFromHeaders } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  try {
    // Basic rate limit: 3 exports per hour per IP
    const ip = getClientIpFromHeaders(request.headers)
    const rl = checkRateLimit(ip, 'export:GET', 3, 60 * 60 * 1000)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
      )
    }

    const auth = await getAuthContext()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // If Prisma is not configured, fail fast
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { prisma } = await import('@trellis/database')

    // Fetch all school-scoped data
    const [school, users, teachers, observations, evaluations] = await Promise.all([
      prisma.school.findUnique({ where: { id: auth.schoolId } }),
      prisma.user.findMany({ where: { schoolId: auth.schoolId }, select: { id: true, email: true, name: true, role: true, createdAt: true } }),
      prisma.teacher.findMany({ where: { schoolId: auth.schoolId } }),
      prisma.observation.findMany({
        where: { schoolId: auth.schoolId },
        include: { artifacts: true, observer: { select: { id: true, email: true, name: true } }, teacher: { select: { id: true, name: true } } },
        orderBy: { date: 'desc' },
      }),
      prisma.evaluation.findMany({
        where: { schoolId: auth.schoolId },
        include: { evaluator: { select: { id: true, email: true, name: true } }, teacher: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    const payload = {
      exportVersion: 1,
      exportedAt: new Date().toISOString(),
      school,
      users,
      teachers,
      observations,
      evaluations,
    }

    const filenameSafeSchool = (school?.name || auth.schoolName || 'school').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const filename = `trellis-export-${filenameSafeSchool}-${new Date().toISOString().slice(0, 10)}.json`

    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('Export failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


