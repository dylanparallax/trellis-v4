import { TeacherList } from '@/components/teachers/teacher-list'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Apple, TrendingUp, Target } from 'lucide-react'
import Link from 'next/link'
import { prisma } from '@trellis/database'
import { getAuthContext } from '@/lib/auth/server'
import { startOfMonth, endOfMonth, subDays } from 'date-fns'

export default async function TeachersPage() {
  const auth = await getAuthContext()
  // Guard: if auth missing (should be handled by middleware), render empty shell
  if (!auth?.schoolId) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard title="Total Teachers" value="—" icon={<Apple className="h-4 w-4 text-muted-foreground" />} subtitle="No data" />
          <StatCard title="Active Teachers (30d)" value="—" icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />} subtitle="No data" />
          <StatCard title="Avg Performance" value="—" icon={<Target className="h-4 w-4 text-muted-foreground" />} subtitle="No evaluations" />
          <StatCard title="Observations (month)" value="—" icon={<Plus className="h-4 w-4 text-muted-foreground" />} subtitle="No data" />
        </div>
        <TeacherList />
        <div className="flex justify-end">
          <Link href="/dashboard/teachers/new" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
            <Plus className="h-4 w-4" />
            Add Teacher
          </Link>
        </div>
      </div>
    )
  }

  const schoolId = auth.schoolId
  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)
  const last30 = subDays(now, 30)

  const [totalTeachers, recentObservationTeachers, observationsThisMonth, evaluations] = await Promise.all([
    prisma.teacher.count({ where: { schoolId } }),
    prisma.observation.findMany({
      where: { schoolId, date: { gte: last30 } },
      select: { teacherId: true },
    }).then(rows => new Set(rows.map(r => r.teacherId)).size),
    prisma.observation.count({ where: { schoolId, date: { gte: monthStart, lte: monthEnd } } }),
    prisma.evaluation.findMany({ where: { schoolId } }),
  ])

  // Compute average performance from evaluation.scores.overall if present
  let avgPerformance: string = '—'
  if (evaluations.length > 0) {
    const numbers: number[] = []
    for (const e of evaluations) {
      const scores = e.scores as unknown as { overall?: number } | null
      const overall = scores && typeof scores === 'object' ? scores.overall : undefined
      if (typeof overall === 'number' && Number.isFinite(overall)) numbers.push(overall)
    }
    if (numbers.length > 0) {
      const avg = numbers.reduce((a, b) => a + b, 0) / numbers.length
      avgPerformance = avg.toFixed(1)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Total Teachers" value={String(totalTeachers)} icon={<Apple className="h-4 w-4 text-muted-foreground" />} subtitle={totalTeachers === 0 ? 'No teachers yet' : undefined} />
        <StatCard title="Active Teachers (30d)" value={String(recentObservationTeachers || 0)} icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />} subtitle={recentObservationTeachers === 0 ? 'No recent activity' : undefined} />
        <StatCard title="Avg Performance" value={avgPerformance} icon={<Target className="h-4 w-4 text-muted-foreground" />} subtitle={avgPerformance === '—' ? 'No evaluations yet' : undefined} />
        <StatCard title="Observations (month)" value={String(observationsThisMonth || 0)} icon={<Plus className="h-4 w-4 text-muted-foreground" />} subtitle={observationsThisMonth === 0 ? 'No observations this month' : undefined} />
      </div>

      <TeacherList />
    </div>
  )
}

function StatCard({ title, value, icon, subtitle }: { title: string; value: string; icon: React.ReactNode; subtitle?: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle ? (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}