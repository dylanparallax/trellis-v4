import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@trellis/database'
import { getAuthContext } from '@/lib/auth/server'
import { checkRateLimit, getClientIpFromHeaders } from '@/lib/rate-limit'

export const runtime = 'nodejs'

type SearchItem = {
  type: 'observation' | 'evaluation' | 'teacher'
  id: string
  title: string
  subtitle?: string
  href: string
}

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIpFromHeaders(request.headers)
    const rl = checkRateLimit(ip, 'search:GET', 180, 60_000)
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } })
    }

    const auth = await getAuthContext()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const q = (searchParams.get('q') || '').trim()
    if (q.length < 2) return NextResponse.json({ results: [] as SearchItem[] })

    const qInsensitive = q

    // Observations: staff only
    const observations = auth.role === 'TEACHER' ? [] : await prisma.observation.findMany({
      where: {
        schoolId: auth.schoolId,
        OR: [
          { rawNotes: { contains: qInsensitive, mode: 'insensitive' } },
          { enhancedNotes: { contains: qInsensitive, mode: 'insensitive' } },
          { teacher: { name: { contains: qInsensitive, mode: 'insensitive' } } },
          { observer: { name: { contains: qInsensitive, mode: 'insensitive' } } },
        ],
      },
      include: {
        teacher: { select: { name: true, subject: true } },
        observer: { select: { name: true } },
      },
      orderBy: { date: 'desc' },
      take: 5,
    })

    // Evaluations: search summary and related names; fetch a few and filter content markdown on server
    const evalWhere: Record<string, unknown> = { schoolId: auth.schoolId }
    if (auth.role === 'TEACHER') {
      const teacher = await prisma.teacher.findFirst({ where: { email: auth.email, schoolId: auth.schoolId }, select: { id: true } })
      if (!teacher) return NextResponse.json({ results: [] })
      evalWhere.teacherId = teacher.id
    } else {
      evalWhere.OR = [
        { summary: { contains: qInsensitive, mode: 'insensitive' } },
        { teacher: { name: { contains: qInsensitive, mode: 'insensitive' } } },
        { evaluator: { name: { contains: qInsensitive, mode: 'insensitive' } } },
      ]
    }
    const evaluationsRaw = await prisma.evaluation.findMany({
      where: evalWhere,
      include: {
        teacher: { select: { name: true } },
        evaluator: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 12,
    })
    const evaluations = evaluationsRaw
      .filter((e) => {
        const c = e.content as unknown
        if (typeof c === 'string') return c.toLowerCase().includes(qInsensitive.toLowerCase())
        if (c && typeof c === 'object' && 'markdown' in (c as Record<string, unknown>)) {
          const md = (c as Record<string, unknown>).markdown
          if (typeof md === 'string') return md.toLowerCase().includes(qInsensitive.toLowerCase())
        }
        return Boolean(e.summary && e.summary.toLowerCase().includes(qInsensitive.toLowerCase()))
      })
      .slice(0, 5)

    // Teachers: search basic fields
    // Teachers: staff only
    const teachers = auth.role === 'TEACHER' ? [] : await prisma.teacher.findMany({
      where: {
        schoolId: auth.schoolId,
        OR: [
          { name: { contains: qInsensitive, mode: 'insensitive' } },
          { subject: { contains: qInsensitive, mode: 'insensitive' } },
          { gradeLevel: { contains: qInsensitive, mode: 'insensitive' } },
        ],
      },
      orderBy: { name: 'asc' },
      take: 5,
    })

    const results: SearchItem[] = [
      ...observations.map((o) => ({
        type: 'observation' as const,
        id: o.id,
        title: o.teacher?.name ? `${o.teacher.name} • Observation` : 'Observation',
        subtitle: o.observer?.name ? `Observer: ${o.observer.name}` : undefined,
        href: `/dashboard/observations/${o.id}`,
      })),
      ...evaluations.map((e) => ({
        type: 'evaluation' as const,
        id: e.id,
        title: e.teacher?.name ? `${e.teacher.name} • Evaluation` : 'Evaluation',
        subtitle: e.summary || undefined,
        href: `/dashboard/evaluations/${e.id}`,
      })),
      ...teachers.map((t) => ({
        type: 'teacher' as const,
        id: t.id,
        title: t.name,
        subtitle: [t.subject, t.gradeLevel].filter(Boolean).join(' • ') || undefined,
        href: `/dashboard/teachers/${t.id}`,
      })),
    ]

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Error in global search:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}


