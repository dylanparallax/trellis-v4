import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Apple, Users, Binoculars, Award, TrendingUp, Plus } from 'lucide-react'
import Link from 'next/link'
import { prisma } from '@trellis/database'
import { getAuthContext } from '@/lib/auth/server'

export default async function DashboardPage() {
  const auth = await getAuthContext()
  const school = auth?.schoolId ? await prisma.school.findUnique({ where: { id: auth.schoolId } }) : null
  const schoolName = school?.name || ''

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const [totalTeachers, observationsThisMonth, draftEvaluations, recentObservations] = await Promise.all([
    auth?.schoolId ? prisma.teacher.count({ where: { schoolId: auth.schoolId } }) : Promise.resolve(0),
    auth?.schoolId
      ? prisma.observation.count({ where: { schoolId: auth.schoolId, date: { gte: monthStart, lt: monthEnd } } })
      : Promise.resolve(0),
    auth?.schoolId ? prisma.evaluation.count({ where: { schoolId: auth.schoolId, status: 'DRAFT' } }) : Promise.resolve(0),
    auth?.schoolId
      ? prisma.observation.findMany({
          where: { schoolId: auth.schoolId },
          include: { teacher: { select: { name: true, subject: true, gradeLevel: true } } },
          orderBy: { date: 'desc' },
          take: 5,
        })
      : Promise.resolve([]),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            {schoolName ? `Welcome back! Here's what's happening at ${schoolName}.` : 'Welcome back!'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/dashboard/observations/new">
              <Plus className="mr-2 h-4 w-4" />
              New Observation
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
            <Apple className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTeachers}</div>
            <p className="text-xs text-muted-foreground">
              {/* Placeholder trend */}
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Observations This Month</CardTitle>
            <Binoculars className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{observationsThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              {/* Placeholder trend */}
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft Evaluations</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{draftEvaluations}</div>
            <p className="text-xs text-muted-foreground">
              {/* Placeholder */}
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">N/A</div>
            <p className="text-xs text-muted-foreground">
              {/* No data */}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Observations</CardTitle>
            <CardDescription>
              Latest teacher observations and feedback
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentObservations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent observations.</p>
              ) : (
                recentObservations.map((observation) => (
                  <div key={observation.id} className="flex items-center space-x-4">
                    <div className="w-8 h-8 rounded-full bg-white text-foreground flex items-center justify-center shadow-sm border">
                      <span className="text-sm font-medium">
                        {observation.teacher.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {observation.teacher.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {observation.teacher.subject || 'Subject N/A'} • {new Date(observation.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {observation.observationType}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}