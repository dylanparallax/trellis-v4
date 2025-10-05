export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getClientIpFromHeaders } from '@/lib/rate-limit'
import { z } from 'zod'
// Import Prisma conditionally to avoid SSR errors when DATABASE_URL is not configured
import { getAuthContext } from '@/lib/auth/server'
import { AIEvaluationService } from '@/lib/ai/evaluation-service'

const requestSchema = z.object({
  teacherId: z.string().min(1, 'teacherId is required'),
  evaluationType: z.enum(['FORMATIVE', 'SUMMATIVE']),
  schoolYear: z.string().min(1, 'schoolYear is required'),
})

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIpFromHeaders(request.headers)
    const rl = checkRateLimit(ip, 'evaluations:GENERATE', 20, 60_000)
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } })
    }
    const json = await request.json()
    const { teacherId, evaluationType, schoolYear } = requestSchema.parse(json)
    // Remove demo mock data path: always use real DB

    // Auth only required when using real DB
    const auth = await getAuthContext()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (auth.role === 'TEACHER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Fetch core entities from DB (non-demo)
    const { prisma } = await import('@trellis/database')
    const teacherRecord = await prisma.teacher.findUnique({
      where: { id: teacherId },
    })
    if (!teacherRecord) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }
    // Scope validation
    if (teacherRecord.schoolId !== auth.schoolId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const teacher = {
      id: teacherRecord.id,
      name: teacherRecord.name,
      subject: teacherRecord.subject ?? undefined,
      gradeLevel: teacherRecord.gradeLevel ?? undefined,
      strengths: teacherRecord.strengths ?? [],
      growthAreas: teacherRecord.growthAreas ?? [],
    }

    const [obsRecords, evalRecords] = await Promise.all([
      prisma.observation.findMany({ where: { teacherId }, orderBy: { date: 'desc' }, take: 10 }),
      prisma.evaluation.findMany({ where: { teacherId }, orderBy: { createdAt: 'desc' }, take: 5 }),
    ])

    const previousObservations = obsRecords.map((o) => ({
      date: o.date,
      enhancedNotes: o.enhancedNotes ?? undefined,
      rawNotes: o.rawNotes,
    }))
    const previousEvaluations = evalRecords.map((e) => ({
      createdAt: e.createdAt,
      type: e.type,
      summary: e.summary ?? undefined,
      // Expose only APPROVED artifacts into prompts context
      artifacts: (() => {
        try {
          const c = e.content
          if (c && typeof c === 'object') {
            const meta = (c as { meta?: Record<string, unknown> }).meta || {}
            const list = (meta.artifacts as Array<Record<string, unknown>> | undefined) || []
            return list.filter(a => (a?.status as string) === 'APPROVED').map(a => ({
              fileName: String(a.fileName || ''),
              fileType: String(a.fileType || ''),
              fileUrl: String(a.fileUrl || ''),
            }))
          }
        } catch {}
        return []
      })(),
    }))

    const school = await prisma.school.findUnique({ where: { id: auth.schoolId } })
    const settings = (school?.settings as Record<string, unknown>) || {}
    const frameworkText = (school?.evaluationFramework as { text?: string })?.text || ''
    const promptGuidelines = (settings?.prompts as { guidelines?: string })?.guidelines || ''

    const evaluationService = new AIEvaluationService()
    const response = await evaluationService.generateInitialEvaluation({
      teacher,
      evaluationType,
      schoolYear,
      previousObservations,
      previousEvaluations,
      chatHistory: [],
      frameworkText,
      promptGuidelines,
    })

    return NextResponse.json(response)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }
    console.error('API route error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}