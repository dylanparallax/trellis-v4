import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Apple, Users, Binoculars, Award, TrendingUp, Plus } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <OnboardingBanner />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s what&apos;s happening at Lincoln Elementary.
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
            <div className="text-2xl font-bold">25</div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Observations This Month</CardTitle>
            <Binoculars className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">47</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Evaluations Due</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              3 overdue
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.2/5</div>
            <p className="text-xs text-muted-foreground">
              +0.3 from last quarter
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
              {recentObservations.map((observation) => (
                <div key={observation.id} className="flex items-center space-x-4">
            <div className="w-8 h-8 rounded-full bg-white text-foreground flex items-center justify-center shadow-sm border">
                    <span className="text-sm font-medium">
                      {observation.teacherName.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {observation.teacherName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {observation.subject} • {observation.date}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {observation.type}
                  </div>
                </div>
              ))}
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
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/dashboard/analytics">
                <TrendingUp className="mr-2 h-4 w-4" />
                View Analytics
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

const recentObservations = [
  {
    id: '1',
    teacherName: 'Sarah Johnson',
    subject: 'Mathematics',
    date: '2 hours ago',
    type: 'Formal'
  },
  {
    id: '2',
    teacherName: 'Michael Chen',
    subject: 'Science',
    date: '1 day ago',
    type: 'Informal'
  },
  {
    id: '3',
    teacherName: 'Emily Rodriguez',
    subject: 'English',
    date: '2 days ago',
    type: 'Walkthrough'
  },
  {
    id: '4',
    teacherName: 'David Thompson',
    subject: 'History',
    date: '3 days ago',
    type: 'Formal'
  }
] 

function OnboardingBanner() {
  async function createSchool(formData: FormData) {
    'use server'
    const schoolName = String(formData.get('schoolName') || '').trim()
    const district = String(formData.get('district') || '').trim()
    if (!schoolName) {
      return
    }
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/onboarding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schoolName, district }),
      cache: 'no-store'
    })
  }

  return (
    <form action={createSchool} className="rounded-lg border bg-card p-4 grid gap-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">First time here?</p>
          <p className="text-sm text-muted-foreground">Create your school to get started.</p>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <input name="schoolName" placeholder="School name" className="border rounded-md px-3 py-2" required />
        <input name="district" placeholder="District (optional)" className="border rounded-md px-3 py-2" />
        <Button type="submit" className="w-full md:w-auto">Create School</Button>
      </div>
    </form>
  )
}