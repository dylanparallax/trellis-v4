export const runtime = 'nodejs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
export const dynamic = 'force-dynamic'
import { Button } from '@/components/ui/button'
import { Users, Binoculars, Award, TrendingUp, Plus } from 'lucide-react'
import Link from 'next/link'
import { prisma } from '@trellis/database'
import { getAuthContext } from '@/lib/auth/server'
import { startOfMonth, endOfMonth, format, subDays } from 'date-fns'
import { ObservationsLineChart, type ObservationsSeriesPoint } from '@/components/analytics/observations-line-chart'
import { FocusPieChart } from '@/components/analytics/focus-pie-chart'

export default async function DashboardPage({ searchParams }: { searchParams?: Promise<{ timeframe?: string }> }) {
  const auth = await getAuthContext()
  const schoolId = auth?.schoolId

  // Teacher: show only their own feedback
  if (auth?.role === 'TEACHER') {
    if (!auth.email || !schoolId) {
      return (
        <div className="space-y-6">
          <Header />
          <Card>
            <CardHeader>
              <CardTitle>My Feedback</CardTitle>
              <CardDescription>Your submitted feedback</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">No data.</div>
            </CardContent>
          </Card>
        </div>
      )
    }
    // Resolve teacher by email within the same school
    const teacher = await prisma.teacher.findFirst({ where: { email: { equals: auth.email, mode: 'insensitive' }, schoolId }, select: { id: true, name: true, schoolId: true } })
    // If no Teacher found by email, we intentionally do not fallback to user linkage here
    // to avoid surfacing cross-school or mismatched accounts.
    let myEvals: Array<{ id: string; createdAt: Date; type: string; status: string }> = []
    if (teacher) {
      myEvals = await prisma.evaluation.findMany({
        where: { teacherId: teacher.id, schoolId, status: 'SUBMITTED' },
        select: { id: true, createdAt: true, type: true, status: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      })
    }
    return (
      <div className="space-y-6">
        <Header showNewObservationButton={false} />
        <Card>
          <CardHeader>
            <CardTitle>My Feedback</CardTitle>
            <CardDescription>{teacher?.name ? `Feedback for ${teacher.name}` : 'Your feedback'}</CardDescription>
          </CardHeader>
          <CardContent>
            {myEvals.length === 0 ? (
              <div className="text-sm text-muted-foreground">No feedback yet.</div>
            ) : (
              <ul className="space-y-2 text-sm">
                {myEvals.map((e) => (
                  <li key={e.id} className="flex items-center justify-between">
                    <span className="truncate">
                      {new Date(e.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {` • ${e.type}`} {` • ${e.status}`}
                    </span>
                    <a className="underline" href={`/dashboard/evaluations/${e.id}`}>View</a>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

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
  const sp = (await searchParams) || {}
  const timeframeDays = Math.max(7, Math.min(180, Number(sp.timeframe ?? 30)))
  const since = subDays(now, timeframeDays)
  const [totalTeachers, observationsThisMonth, evaluationsDue, recentObservations, evaluations, obsCurrent, obsAll, teachers] = await Promise.all([
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
    prisma.observation.findMany({
      where: { schoolId, date: { gte: since } },
      select: { id: true, date: true, observationType: true, duration: true, focusAreas: true, teacherId: true, rawNotes: true, enhancedNotes: true },
    }),
    prisma.observation.findMany({
      where: { schoolId },
      select: { id: true, date: true, observationType: true, duration: true, focusAreas: true, teacherId: true, rawNotes: true, enhancedNotes: true },
    }),
    prisma.teacher.findMany({ where: { schoolId }, select: { strengths: true, growthAreas: true } }),
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

  // Compute trends and insights for the selected timeframe
  type Counts = Record<string, number>
  const countMap = (items: string[]): Counts => items.reduce((acc, k) => { acc[k] = (acc[k] || 0) + 1; return acc }, {} as Counts)

  const currentFocus = countMap(obsCurrent.flatMap(o => Array.isArray(o.focusAreas) ? o.focusAreas : []))
  const currentByType = countMap(obsCurrent.map(o => o.observationType))

  // Top tags for strengths/growth shown in pies below

  const allStrengths = teachers.flatMap(t => Array.isArray(t.strengths) ? t.strengths : [])
  const allGrowth = teachers.flatMap(t => Array.isArray(t.growthAreas) ? t.growthAreas : [])
  const topStrengths = Object.entries(countMap(allStrengths)).sort((a, b) => b[1] - a[1]).slice(0, 6)
  const topGrowth = Object.entries(countMap(allGrowth)).sort((a, b) => b[1] - a[1]).slice(0, 6)

  // Build a simple time series by week for current window
  function groupByWeek(items: { date: Date }[]) {
    const map = new Map<string, number>()
    items.forEach((x) => {
      const d = new Date(x.date)
      const year = d.getUTCFullYear()
      const week = Math.floor(((d.getTime() - new Date(Date.UTC(year,0,1)).getTime()) / 86400000 + new Date(Date.UTC(year,0,1)).getUTCDay()+1) / 7)
      const key = `${year}-W${String(week).padStart(2,'0')}`
      map.set(key, (map.get(key) || 0) + 1)
    })
    return map
  }

  const currSeriesMap = groupByWeek(obsCurrent as unknown as { date: Date }[])
  const seriesKeys = Array.from(currSeriesMap.keys()).sort()
  const seriesData: ObservationsSeriesPoint[] = seriesKeys.map((k) => ({ label: k, current: currSeriesMap.get(k) || 0 }))

  // Lightweight AI-like insights (rule-based for now). We can later swap to LLM.
  function extractInsights(observations: { rawNotes?: string | null; enhancedNotes?: string | null; focusAreas?: string[]; teacherId: string }[]) {
    const text = observations
      .map(o => `${o.enhancedNotes || ''}\n${o.rawNotes || ''}`.toLowerCase())
      .join('\n')
    const total = observations.length || 1
    const containsPct = (needle: RegExp) => {
      const matches = text.match(needle)
      const count = matches ? matches.length : 0
      return Math.round((count / total) * 100)
    }
    const devicePct = containsPct(/(device|phone|tablet|laptop)/g)
    const managementPct = containsPct(/classroom management|behavior|routine|procedures?/g)
    const engagementPct = containsPct(/engagement|on-task|participation|active learning/g)
    const aiPct = containsPct(/ai\b|chatgpt|claude|copilot/g)
    const teachersWithMgmt = new Set(
      observations
        .filter(o => /classroom management|behavior|routine|procedures?/.test(`${o.enhancedNotes || ''} ${o.rawNotes || ''}`.toLowerCase()))
        .map(o => o.teacherId)
    ).size

    const insights: Array<{ label: string; detail?: string }> = []
    if (devicePct >= 10) insights.push({ label: `${devicePct}% of observations reference student device use.` })
    if (engagementPct >= 10) insights.push({ label: `${engagementPct}% mention student engagement (on-task/participation).` })
    if (managementPct >= 10) insights.push({ label: `${managementPct}% reference classroom management or routines.`, detail: `${teachersWithMgmt} teacher(s) mentioned it explicitly.` })
    if (aiPct >= 5) insights.push({ label: `${aiPct}% reference AI tools in instruction.` })
    if (insights.length === 0) insights.push({ label: 'No notable patterns detected this period.' })
    return insights.slice(0, 4)
  }

  const aiInsights = extractInsights(obsAll as unknown as { rawNotes?: string | null; enhancedNotes?: string | null; focusAreas?: string[]; teacherId: string }[])

  return (
    <div className="space-y-6">
      <Header />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Teachers" value={String(totalTeachers)} icon={<Users className="h-4 w-4 text-muted-foreground" />} subtitle={totalTeachers === 0 ? 'No teachers yet' : undefined} />
        <StatCard title="Observations This Month" value={String(observationsThisMonth)} icon={<Binoculars className="h-4 w-4 text-muted-foreground" />} subtitle={observationsThisMonth === 0 ? 'No observations' : undefined} />
        <StatCard title="Feedback Drafts" value={String(evaluationsDue)} icon={<Award className="h-4 w-4 text-muted-foreground" />} subtitle={evaluationsDue === 0 ? 'All caught up' : undefined} />
        <StatCard title="Performance Score" value={avgPerformance} icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />} subtitle={avgPerformance === '—' ? 'No feedback' : undefined} />
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

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <CardTitle>AI Insights</CardTitle>
              <CardDescription>Last {timeframeDays} days</CardDescription>
            </div>
            <div className="flex gap-2 text-sm">
              {[30, 60, 90].map((d) => (
                <Link key={d} href={`?timeframe=${d}`} className={`px-3 py-1.5 rounded-md border ${timeframeDays === d ? 'bg-primary text-primary-foreground' : 'bg-background'}`}>
                  {d}d
                </Link>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border p-4">
            <h4 className="text-sm font-medium mb-2">AI Insights</h4>
            <ul className="text-sm space-y-1">
              {aiInsights.map((ins, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>
                    {ins.label}
                    {ins.detail ? <span className="text-muted-foreground"> — {ins.detail}</span> : null}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Header({ showNewObservationButton = true }: { showNewObservationButton?: boolean }) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back!</p>
      </div>
      <div className="flex gap-2 w-full sm:w-auto">
        {showNewObservationButton && (
          <Button asChild>
            <Link href="/dashboard/observations/new">
              <Plus className="mr-2 h-4 w-4" />
              New Observation
            </Link>
          </Button>
        )}
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
            New Feedback
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

//