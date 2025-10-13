import type { Observation, Evaluation, Teacher, User, School } from '@trellis/database'

export type NormalizedChunk = {
  content: string
  tokenCount: number
  metadata: Record<string, unknown>
}

export function normalizeObservation(
  observation: Observation & { teacher?: Pick<Teacher, 'id' | 'name' | 'subject' | 'gradeLevel'> | null; observer?: Pick<User, 'id' | 'name'> | null; school?: Pick<School, 'id' | 'name' | 'district'> | null }
): { header: string; body: string; metadata: Record<string, unknown> } {
  const teacherName = observation.teacher?.name || 'Unknown Teacher'
  const observerName = observation.observer?.name || 'Unknown Observer'
  const schoolName = observation.school?.name || 'Unknown School'
  const dateStr = new Date(observation.date).toISOString().split('T')[0]
  const focus = (observation.focusAreas || []).join(', ')

  const header = [
    `[Type]: Observation`,
    `[Date]: ${dateStr}`,
    `[School]: ${schoolName}`,
    `[Teacher]: ${teacherName}`,
    `[Observer]: ${observerName}`,
    `[Subject]: ${observation.subject || '—'}`,
    `[Focus Areas]: ${focus || '—'}`,
    `[Observation Type]: ${observation.observationType}`,
  ].join('\n')

  const body = [
    `Strengths/Evidence:`,
    observation.enhancedNotes || observation.rawNotes || '',
  ].join('\n\n')

  const metadata = {
    type: 'observation',
    id: observation.id,
    teacherId: observation.teacherId,
    observerId: observation.observerId,
    schoolId: observation.schoolId,
    subject: observation.subject,
    focusAreas: observation.focusAreas || [],
    date: observation.date,
  }

  return { header, body, metadata }
}

export function normalizeEvaluation(
  evaluation: Evaluation & { teacher?: Pick<Teacher, 'id' | 'name' | 'subject' | 'gradeLevel'> | null; evaluator?: Pick<User, 'id' | 'name'> | null; school?: Pick<School, 'id' | 'name' | 'district'> | null }
): { header: string; body: string; metadata: Record<string, unknown> } {
  const teacherName = evaluation.teacher?.name || 'Unknown Teacher'
  const evaluatorName = evaluation.evaluator?.name || 'Unknown Evaluator'
  const schoolName = evaluation.school?.name || 'Unknown School'
  const dateStr = new Date(evaluation.createdAt).toISOString().split('T')[0]

  const header = [
    `[Type]: Evaluation`,
    `[Date]: ${dateStr}`,
    `[School]: ${schoolName}`,
    `[Teacher]: ${teacherName}`,
    `[Evaluator]: ${evaluatorName}`,
    `[Eval Type]: ${evaluation.type}`,
    `[Status]: ${evaluation.status}`,
  ].join('\n')

  const content = typeof evaluation.content === 'string' ? evaluation.content : (evaluation.content && (evaluation.content as any).markdown) || ''

  const body = [
    evaluation.summary ? `Summary:\n${evaluation.summary}` : '',
    `Content:\n${content}`,
    evaluation.recommendations?.length ? `Recommendations:\n- ${evaluation.recommendations.join('\n- ')}` : '',
    evaluation.nextSteps?.length ? `Next Steps:\n- ${evaluation.nextSteps.join('\n- ')}` : '',
  ]
    .filter(Boolean)
    .join('\n\n')

  const metadata = {
    type: 'evaluation',
    id: evaluation.id,
    teacherId: evaluation.teacherId,
    evaluatorId: evaluation.evaluatorId,
    schoolId: evaluation.schoolId,
    status: evaluation.status,
    createdAt: evaluation.createdAt,
  }

  return { header, body, metadata }
}
