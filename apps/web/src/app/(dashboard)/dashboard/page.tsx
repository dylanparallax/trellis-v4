export const runtime = 'nodejs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
export const dynamic = 'force-dynamic'
import { Button } from '@/components/ui/button'
import { Users, Binoculars, Award, Plus } from 'lucide-react'
import Link from 'next/link'
import { prisma } from '@trellis/database'
import { getAuthContext } from '@/lib/auth/server'
import { startOfMonth, endOfMonth, format, subDays } from 'date-fns'
 

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
    try {
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
    } catch (error) {
      console.error('Dashboard teacher section error:', error)
      return (
        <div className="space-y-6">
          <Header showNewObservationButton={false} />
          <Card>
            <CardHeader>
              <CardTitle>My Feedback</CardTitle>
              <CardDescription>Unable to load your feedback right now.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">Please try again later.</div>
            </CardContent>
          </Card>
        </div>
      )
    }
  }

  if (!schoolId) {
    return (
      <div className="space-y-6">
        <Header />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard title="Total Teachers" value="—" icon={<Users className="h-4 w-4 text-muted-foreground" />} subtitle="No data" />
          <StatCard title="Observations This Month" value="—" icon={<Binoculars className="h-4 w-4 text-muted-foreground" />} subtitle="No data" />
          <StatCard title="Feedback Drafts" value="—" icon={<Award className="h-4 w-4 text-muted-foreground" />} subtitle="No data" />
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

  let totalTeachers = 0
  let observationsThisMonth = 0
  let evaluationsDue = 0
  let recentObservations: Array<{ id: string; teacherId: string; teacher?: { id: string; name: string | null } | null; date: Date }> = []
  let obsCurrent: Array<{ rawNotes?: string | null; enhancedNotes?: string | null; focusAreas?: string[]; teacherId: string }> = []

  try {
    const results = await Promise.all([
      prisma.teacher.count({ where: { schoolId } }),
      prisma.observation.count({ where: { schoolId, date: { gte: monthStart, lte: monthEnd } } }),
      prisma.evaluation.count({ where: { schoolId, status: 'DRAFT' } }),
      prisma.observation.findMany({
        where: { schoolId },
        orderBy: { date: 'desc' },
        take: 5,
        include: { teacher: { select: { id: true, name: true } } },
      }),
      prisma.observation.findMany({
        where: { schoolId, date: { gte: since } },
        select: { id: true, date: true, observationType: true, duration: true, focusAreas: true, teacherId: true, rawNotes: true, enhancedNotes: true },
      }),
    ])
    totalTeachers = results[0] as number
    observationsThisMonth = results[1] as number
    evaluationsDue = results[2] as number
    recentObservations = results[3] as typeof recentObservations
    obsCurrent = results[4] as typeof obsCurrent
  } catch (error) {
    console.error('Dashboard stats section error:', error)
    // Leave defaults and continue to render with placeholders
  }

  // Compute insights for the selected timeframe

  // Lightweight AI-like insights (rule-based for now). We can later swap to LLM.
  function extractInsights(observations: { rawNotes?: string | null; enhancedNotes?: string | null; focusAreas?: string[]; teacherId: string }[]) {
    const total = observations.length
    const percentByObservationPresence = (needle: RegExp) => {
      if (total === 0) return 0
      let numObservationsWithMatch = 0
      for (const o of observations) {
        const text = `${o.enhancedNotes || ''} ${o.rawNotes || ''}`.toLowerCase()
        // Use a non-global, case-insensitive regex to avoid stateful lastIndex issues
        const re = new RegExp(needle.source, 'i')
        if (re.test(text)) numObservationsWithMatch += 1
      }
      return Math.round((numObservationsWithMatch / total) * 100)
    }
    const devicePct = percentByObservationPresence(/(device|phone|tablet|laptop)/)
    const managementPct = percentByObservationPresence(/classroom management|behavior|routine|procedures?/)
    const engagementPct = percentByObservationPresence(/engagement|on-task|participation|active learning/)
    const aiPct = percentByObservationPresence(/ai\b|chatgpt|claude|copilot/)
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

  const aiInsights = extractInsights(obsCurrent as unknown as { rawNotes?: string | null; enhancedNotes?: string | null; focusAreas?: string[]; teacherId: string }[])

  return (
    <div className="space-y-6">
      <Header />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Total Teachers" value={String(totalTeachers)} icon={<Users className="h-4 w-4 text-muted-foreground" />} subtitle={totalTeachers === 0 ? 'No teachers yet' : undefined} />
        <StatCard title="Observations This Month" value={String(observationsThisMonth)} icon={<Binoculars className="h-4 w-4 text-muted-foreground" />} subtitle={observationsThisMonth === 0 ? 'No observations' : undefined} />
        <StatCard title="Feedback Drafts" value={String(evaluationsDue)} icon={<Award className="h-4 w-4 text-muted-foreground" />} subtitle={evaluationsDue === 0 ? 'All caught up' : undefined} />
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
      </CardContent>
    </Card>
  )
}

//