import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Binoculars, Award, TrendingUp, Plus } from 'lucide-react'
import Link from 'next/link'
import { prisma } from '@trellis/database'
import { getAuthContext } from '@/lib/auth/server'
import { startOfMonth, endOfMonth, format } from 'date-fns'

export default async function DashboardPage() {
  const auth = await getAuthContext()
  const schoolId = auth?.schoolId

  if (!schoolId) {
    return (
      <div className="space-y-6">
        <Header />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Teachers" value="—" icon={<Users className="h-4 w-4 text-muted-foreground" />} subtitle="No data" />
          <StatCard title="Observations This Month" value="—" icon={<Binoculars className="h-4 w-4 text-muted-foreground" />} subtitle="No data" />
          <StatCard title="Evaluations Due" value="—" icon={<Award className="h-4 w-4 text-muted-foreground" />} subtitle="No data" />
          <StatCard title="Performance Score" value="—" icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />} subtitle="No evaluations" />
        </div>
        <QuickActions />
      </div>
    )
  }

  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const [totalTeachers, observationsThisMonth, evaluationsDue, recentObservations, evaluations] = await Promise.all([
    prisma.teacher.count({ where: { schoolId } }),
    prisma.observation.count({ where: { schoolId, date: { gte: monthStart, lte: monthEnd } } }),
    prisma.evaluation.count({ where: { schoolId, status: 'DRAFT' } }),
    prisma.observation.findMany({
      where: { schoolId },
      orderBy: { date: 'desc' },
      take: 5,
      include: { teacher: { select: { id: true, name: true } } },
    }),
    prisma.evaluation.findMany({ where: { schoolId } }),
  ])

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
      <Header />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Teachers" value={String(totalTeachers)} icon={<Users className="h-4 w-4 text-muted-foreground" />} subtitle={totalTeachers === 0 ? 'No teachers yet' : undefined} />
        <StatCard title="Observations This Month" value={String(observationsThisMonth)} icon={<Binoculars className="h-4 w-4 text-muted-foreground" />} subtitle={observationsThisMonth === 0 ? 'No observations' : undefined} />
        <StatCard title="Evaluations Due" value={String(evaluationsDue)} icon={<Award className="h-4 w-4 text-muted-foreground" />} subtitle={evaluationsDue === 0 ? 'All caught up' : undefined} />
        <StatCard title="Performance Score" value={avgPerformance} icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />} subtitle={avgPerformance === '—' ? 'No evaluations' : undefined} />
      </div>

      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Recent Observations</CardTitle>
            <CardDescription>Latest teacher observations</CardDescription>
          </CardHeader>
          <CardContent>
            {recentObservations.length === 0 ? (
              <div className="text-sm text-muted-foreground">No recent observations</div>
            ) : (
              <ul className="space-y-2 text-sm">
                {recentObservations.map((o) => (
                  <li key={o.id} className="flex items-center justify-between">
                    <span className="truncate">
                      <a href={`/dashboard/teachers/${o.teacherId}`} className="hover:underline">
                        {o.teacher?.name || 'Unknown Teacher'}
                      </a>
                    </span>
                    <span className="text-muted-foreground">{format(new Date(o.date), 'MMM d, yyyy')}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <QuickActions className="lg:col-span-3" />
      </div>
    </div>
  )
}

function Header() {
  return (
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back!</p>
      </div>
      <div className="flex gap-2 w-full sm:w-auto">
        <Button asChild>
          <Link href="/dashboard/observations/new">
            <Plus className="mr-2 h-4 w-4" />
            New Observation
          </Link>
        </Button>
      </div>
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

function QuickActions({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks and shortcuts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button variant="outline" className="w-full justify-start" asChild>
          <Link href="/dashboard/observations/new">
            <Binoculars className="mr-2 h-4 w-4" />
            Start Observation
          </Link>
        </Button>
        <Button variant="outline" className="w-full justify-start" asChild>
          <Link href="/dashboard/evaluations/new">
            <Award className="mr-2 h-4 w-4" />
            Create Evaluation
          </Link>
        </Button>
        <Button variant="outline" className="w-full justify-start" asChild>
          <Link href="/dashboard/teachers">
            <Users className="mr-2 h-4 w-4" />
            Manage Teachers
          </Link>
        </Button>
        <Button variant="outline" className="w-full justify-start" asChild>
          <Link href="/dashboard/analytics">
            <TrendingUp className="mr-2 h-4 w-4" />
            View Analytics
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}