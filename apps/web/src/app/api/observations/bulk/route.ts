import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { parse } from 'csv-parse/sync'
import { getAuthContext } from '@/lib/auth/server'
import { checkRateLimit, getClientIpFromHeaders } from '@/lib/rate-limit'

// CSV columns supported:
// teacherEmail (preferred) | teacherName (fallback), date (YYYY-MM-DD or ISO), observationType, duration, focusAreas, rawNotes
// Optional: observerEmail (otherwise current user), gradeLevel/subject ignored here
const rowSchema = z.object({
  teacherEmail: z.string().optional().or(z.literal('')),
  teacherName: z.string().optional().or(z.literal('')),
  date: z.string().optional().or(z.literal('')),
  observationType: z.enum(['FORMAL', 'INFORMAL', 'WALKTHROUGH', 'OTHER']).default('INFORMAL'),
  duration: z.string().optional().or(z.literal('')),
  focusAreas: z.string().optional().or(z.literal('')),
  rawNotes: z.string().min(1, 'rawNotes required'),
})

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIpFromHeaders(request.headers)
    const rl = checkRateLimit(ip, 'observations:bulk', 10, 60_000)
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } })
    }

    const auth = await getAuthContext()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const contentType = request.headers.get('content-type') || ''
    let records: Array<Record<string, string>> = []
    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData()
      const file = form.get('file') as File | null
      if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
      const buf = Buffer.from(await file.arrayBuffer())
      records = parse(buf, { columns: true, skip_empty_lines: true, trim: true })
    } else {
      const text = await request.text()
      if (!text?.trim()) return NextResponse.json({ error: 'Empty CSV' }, { status: 400 })
      records = parse(text, { columns: true, skip_empty_lines: true, trim: true })
    }

    const rows: Array<z.infer<typeof rowSchema>> = []
    const errors: Array<{ row: number; error: string }> = []
    records.forEach((rec: Record<string, unknown>, idx) => {
      try {
        const normalized = rowSchema.parse({
          teacherEmail: (rec as Record<string, string>).teacherEmail ?? (rec as Record<string, string>).TeacherEmail ?? (rec as Record<string, string>).email ?? (rec as Record<string, string>).Email ?? '',
          teacherName: (rec as Record<string, string>).teacherName ?? (rec as Record<string, string>).TeacherName ?? (rec as Record<string, string>).name ?? (rec as Record<string, string>).Name ?? '',
          date: (rec as Record<string, string>).date ?? (rec as Record<string, string>).Date ?? '',
          observationType: (((rec as Record<string, string>).observationType ?? (rec as Record<string, string>).ObservationType ?? 'INFORMAL') as string).toUpperCase(),
          duration: (rec as Record<string, string>).duration ?? (rec as Record<string, string>).Duration ?? '',
          focusAreas: (rec as Record<string, string>).focusAreas ?? (rec as Record<string, string>)['Focus Areas'] ?? (rec as Record<string, string>).FocusAreas ?? '',
          rawNotes: (rec as Record<string, string>).rawNotes ?? (rec as Record<string, string>).RawNotes ?? (rec as Record<string, string>).notes ?? (rec as Record<string, string>).Notes ?? '',
        })
        rows.push(normalized)
      } catch (e) {
        let message = 'Invalid row'
        if (e && typeof e === 'object' && 'issues' in (e as { issues?: Array<{ path: (string | number)[]; message: string }> })) {
          const issues = (e as { issues?: Array<{ path: (string | number)[]; message: string }> }).issues || []
          message = issues.map(i => `${(i.path?.[0] as string) || 'field'}: ${i.message}`).join('; ')
        } else if (e instanceof Error) {
          message = e.message
        }
        errors.push({ row: idx + 2, error: message })
      }
    })

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No valid rows found', details: errors }, { status: 400 })
    }

    const { prisma } = await import('@trellis/database')
    // Resolve observer once
    const prismaUser = await prisma.user.findUnique({ where: { email: auth.email } })
    if (!prismaUser) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 403 })
    }

    const parseList = (val?: string) => !val ? [] : [...new Set((val.includes(';') ? val.split(';') : val.split(',')).map(s => s.trim()).filter(Boolean))]
    const created: string[] = []
    for (const row of rows) {
      // Find or create teacher by email/name within school
      let teacherId: string | null = null
      if (row.teacherEmail) {
        const existing = await prisma.teacher.findFirst({ where: { schoolId: auth.schoolId, email: row.teacherEmail } })
        if (existing) teacherId = existing.id
      }
      if (!teacherId && row.teacherName) {
        const existingByName = await prisma.teacher.findFirst({ where: { schoolId: auth.schoolId, name: row.teacherName } })
        if (existingByName) teacherId = existingByName.id
      }
      if (!teacherId) {
        // Minimal create if name present
        const createdTeacher = await prisma.teacher.create({ data: { name: row.teacherName || 'Unknown Teacher', email: row.teacherEmail || undefined, schoolId: auth.schoolId, performanceHistory: [], currentGoals: [], strengths: [], growthAreas: [] } })
        teacherId = createdTeacher.id
      }

      // Date parsing: YYYY-MM-DD → midnight UTC; else Date()
      const dateStr = row.date?.trim()
      let parsedDate: Date
      if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        parsedDate = new Date(`${dateStr}T00:00:00.000Z`)
      } else if (dateStr) {
        const d = new Date(dateStr)
        parsedDate = isNaN(d.getTime()) ? new Date() : d
      } else {
        parsedDate = new Date()
      }

      const duration = row.duration && /^\d+$/.test(row.duration) ? Number(row.duration) : null

      const obs = await prisma.observation.create({
        data: {
          teacherId: teacherId!,
          observerId: prismaUser.id,
          schoolId: auth.schoolId,
          rawNotes: row.rawNotes,
          enhancedNotes: null,
          observationType: row.observationType,
          duration: duration ?? undefined,
          focusAreas: parseList(row.focusAreas),
          date: parsedDate,
        },
      })
      created.push(obs.id)
    }

    return NextResponse.json({ createdCount: created.length, errors })
  } catch (error) {
    console.error('Bulk observations upload failed:', error)
    return NextResponse.json({ error: 'Bulk upload failed' }, { status: 500 })
  }
}


