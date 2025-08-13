export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@trellis/database'
import { getAuthContext } from '@/lib/auth/server'
import { AIEvaluationService } from '@/lib/ai/evaluation-service'
import { getTeacherById, getObservationsByTeacherId, getEvaluationsByTeacherId } from '@/lib/data/mock-data'

const requestSchema = z.object({
  teacherId: z.string().min(1, 'teacherId is required'),
  evaluationType: z.enum(['FORMATIVE', 'SUMMATIVE']),
  schoolYear: z.string().min(1, 'schoolYear is required'),
})

export async function POST(request: NextRequest) {
  try {
    const json = await request.json()
    const { teacherId, evaluationType, schoolYear } = requestSchema.parse(json)
    const isDemo = process.env.DEMO_MODE === 'true' || process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

    // Demo-mode fallback only when explicitly enabled
    if (isDemo) {
      const mock = getTeacherById(teacherId)
      if (!mock) {
        return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
      }

      const teacher = {
        id: mock.id,
        name: mock.name,
        subject: mock.subject ?? undefined,
        gradeLevel: mock.gradeLevel ?? undefined,
        strengths: mock.strengths ?? [],
        growthAreas: mock.growthAreas ?? [],
      }

      const previousObservations = getObservationsByTeacherId(teacherId).map((o) => ({
        date: o.date as Date,
        enhancedNotes: (o as { enhancedNotes?: string }).enhancedNotes ?? undefined,
        rawNotes: (o as { rawNotes: string }).rawNotes,
      }))
      const previousEvaluations = getEvaluationsByTeacherId(teacherId).map((e) => ({
        createdAt: e.createdAt as Date,
        type: e.type as 'FORMATIVE' | 'SUMMATIVE' | 'MID_YEAR' | 'END_YEAR',
        summary: e.summary ?? undefined,
      }))

      const evaluationService = new AIEvaluationService()
      const response = await evaluationService.generateInitialEvaluation({
        teacher,
        evaluationType,
        schoolYear,
        previousObservations,
        previousEvaluations,
        chatHistory: [],
      })

      return NextResponse.json(response)
    }

    // Auth only required when using real DB
    const auth = await getAuthContext()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Fetch core entities from DB (non-demo)
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