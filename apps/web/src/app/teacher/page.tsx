import { prisma } from '@trellis/database'
import { getAuthContext } from '@/lib/auth/server'
import TeacherFeedbackList from '@/components/teachers/teacher-feedback-list'
import dynamic from 'next/dynamic'

const TeacherGoalsClient = dynamic(() => import('@/components/teachers/teacher-goals-client'), { ssr: false })

export default async function TeacherHomePage() {
  const auth = await getAuthContext()
  if (!auth || auth.role !== 'TEACHER') return null
  const teacher = await prisma.teacher.findFirst({ where: { email: { equals: auth.email, mode: 'insensitive' }, schoolId: auth.schoolId }, select: { id: true, name: true } })
  const myEvals = teacher
    ? await prisma.evaluation.findMany({
        where: { teacherId: teacher.id, schoolId: auth.schoolId, status: { in: ['SUBMITTED', 'ACKNOWLEDGED'] } },
        select: { id: true, createdAt: true, submittedAt: true, type: true, status: true, evaluator: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20
      })
    : []
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Feedback</h1>
        <p className="text-muted-foreground">{teacher?.name ? `Feedback for ${teacher.name}` : 'Your feedback'}</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <div className="rounded-lg border bg-card p-4">
            <TeacherGoalsClient />
          </div>
        </div>
      </div>
      <TeacherFeedbackList
        items={myEvals.map(e => ({
          id: e.id,
          createdAt: e.createdAt.toISOString(),
          submittedAt: e.submittedAt ? e.submittedAt.toISOString() : null,
          type: e.type as 'FORMATIVE' | 'SUMMATIVE' | 'MID_YEAR' | 'END_YEAR',
          status: e.status as 'DRAFT' | 'SUBMITTED' | 'ACKNOWLEDGED',
          evaluatorName: e.evaluator?.name || null,
        }))}
      />
    </div>
  )
}
