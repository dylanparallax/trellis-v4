import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthContext } from '@/lib/auth/server'
import { checkRateLimit, getClientIpFromHeaders } from '@/lib/rate-limit'
import { parse } from 'csv-parse/sync'

const rowSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  subject: z.string().optional().or(z.literal('')),
  gradeLevel: z.string().optional().or(z.literal('')),
  strengths: z.string().optional().or(z.literal('')),
  growthAreas: z.string().optional().or(z.literal('')),
})

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIpFromHeaders(request.headers)
    const rl = checkRateLimit(ip, 'teachers:bulk', 10, 60_000)
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
      records = parse(buf, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }) as Array<Record<string, string>>
    } else {
      const text = await request.text()
      if (!text?.trim()) return NextResponse.json({ error: 'Empty CSV' }, { status: 400 })
      records = parse(text, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }) as Array<Record<string, string>>
    }

    // Validate row shape and normalize
    const rows: Array<z.infer<typeof rowSchema>> = []
    const errors: Array<{ row: number; error: string }> = []
    records.forEach((rec: Record<string, string>, idx) => {
      try {
        const normalized = rowSchema.parse({
          name: rec.name ?? rec.Name ?? '',
          email: rec.email ?? rec.Email ?? '',
          subject: rec.subject ?? rec.Subject ?? '',
          gradeLevel: rec.gradeLevel ?? rec.Grade ?? rec.GradeLevel ?? '',
          strengths: rec.strengths ?? rec.Strengths ?? '',
          growthAreas: rec.growthAreas ?? rec["Growth Areas"] ?? rec.GrowthAreas ?? '',
        })
        rows.push(normalized)
      } catch (e) {
        let message = 'Invalid row'
        if (e && typeof e === 'object' && 'issues' in (e as { issues?: Array<{ path: (string | number)[]; message: string }> })) {
          const issues = (e as { issues?: Array<{ path: (string | number)[]; message: string }> }).issues || []
          message = issues
            .map((i) => {
              const path = Array.isArray(i.path) && i.path.length > 0 ? i.path.join('.') : 'field'
              return `${path}: ${i.message}`
            })
            .join('; ')
        } else if (e instanceof Error) {
          message = e.message
        }
        errors.push({ row: idx + 2, error: message }) // +2 accounts for header and 1-index
      }
    })

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No valid rows found', details: errors }, { status: 400 })
    }

    const { prisma } = await import('@trellis/database')

    const created: string[] = []
    const updated: string[] = []

    const parseList = (val?: string) => {
      if (!val) return [] as string[]
      // Split on semicolons first; if none, fall back to commas
      const hasSemicolon = val.includes(';')
      const parts = (hasSemicolon ? val.split(';') : val.split(','))
        .map(s => s.trim())
        .filter(Boolean)
      return [...new Set(parts)]
    }

    for (const row of rows) {
      // Upsert by email if provided, otherwise create new by name
      if (row.email) {
        const existing = await prisma.teacher.findFirst({ where: { schoolId: auth.schoolId, email: row.email } })
        if (existing) {
          await prisma.teacher.update({
            where: { id: existing.id },
            data: {
              name: row.name,
              subject: row.subject || undefined,
              gradeLevel: row.gradeLevel || undefined,
              strengths: parseList(row.strengths),
              growthAreas: parseList(row.growthAreas),
            },
          })
          updated.push(row.email)
          continue
        }
      }

      const t = await prisma.teacher.create({
        data: {
          name: row.name,
          email: row.email || undefined,
          subject: row.subject || undefined,
          gradeLevel: row.gradeLevel || undefined,
          schoolId: auth.schoolId,
          performanceHistory: [],
          currentGoals: [],
          strengths: parseList(row.strengths),
          growthAreas: parseList(row.growthAreas),
        },
      })
      created.push(t.id)
    }

    return NextResponse.json({
      createdCount: created.length,
      updatedCount: updated.length,
      errors,
    })
  } catch (error) {
    console.error('Bulk upload failed:', error)
    return NextResponse.json({ error: 'Bulk upload failed' }, { status: 500 })
  }
}


