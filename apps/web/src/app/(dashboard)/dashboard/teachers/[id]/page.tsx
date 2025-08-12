import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Binoculars, Award, ArrowLeft, Paperclip } from 'lucide-react'
import { prisma } from '@trellis/database'
import { getAuthContext, assertSameSchool } from '@/lib/auth/server'

type PageParams = {
  params: { id: string }
}

export default async function TeacherDetailPage({ params }: PageParams) {
  const { id } = params
  const auth = await getAuthContext()
  if (!auth) return notFound()

  const teacher = await prisma.teacher.findUnique({
    where: { id },
    include: {
      observations: { orderBy: { date: 'desc' }, include: { artifacts: true } },
      evaluations: { orderBy: { createdAt: 'desc' } },
      school: true,
    },
  })
  if (!teacher) return notFound()
  assertSameSchool(teacher, auth.schoolId)

  const observations = teacher.observations || []
  const evaluations = teacher.evaluations || []

  const schoolYear = new Date().getFullYear()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/teachers" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Teachers
          </Link>
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{teacher.name}</h1>
          <p className="text-muted-foreground">
            {teacher.subject || 'Subject N/A'} • Grade {teacher.gradeLevel || 'N/A'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href={`/dashboard/observations/new?teacherId=${teacher.id}`} className="flex items-center gap-2">
              <Binoculars className="h-4 w-4" /> Add Observation
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/dashboard/evaluations/chat?teacher=${teacher.id}&type=SUMMATIVE&year=${schoolYear}-${schoolYear + 1}`} className="flex items-center gap-2">
              <Award className="h-4 w-4" /> Create Evaluation
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Observations</CardTitle>
            <CardDescription>Recent observation history</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {observations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No observations yet.</p>
            ) : (
              observations.map((obs) => (
                <div key={obs.id} className="flex items-center justify-between border rounded-md p-3">
                  <div className="space-y-1">
                    <div className="text-sm font-medium">{new Date(obs.date).toLocaleDateString()}</div>
                    <div className="text-xs text-muted-foreground">{obs.observationType}</div>
                    {obs.focusAreas?.length > 0 && (
                      <div className="text-xs text-muted-foreground">Focus: {obs.focusAreas.join(', ')}</div>
                    )}
                    {obs.artifacts?.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Paperclip className="h-3 w-3" /> {obs.artifacts.length} artifact{obs.artifacts.length > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/observations?teacherId=${teacher.id}`}>View</Link>
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Evaluations</CardTitle>
            <CardDescription>Latest evaluations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {evaluations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No evaluations yet.</p>
            ) : (
              evaluations.map((ev) => (
                <div key={ev.id} className="flex items-center justify-between border rounded-md p-3">
                  <div className="space-y-1">
                    <div className="text-sm font-medium">{ev.type}</div>
                    <div className="text-xs text-muted-foreground">{new Date(ev.createdAt).toLocaleDateString()} • {ev.status}</div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/evaluations/chat?teacher=${teacher.id}&type=${ev.type}&year=${schoolYear}-${schoolYear + 1}`}>Open</Link>
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Teacher details and metadata</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div>
            <div className="text-xs text-muted-foreground">Email</div>
            <div className="text-sm">{teacher.email || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Strengths</div>
            <div className="text-sm">{(teacher.strengths || []).join(', ') || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Growth Areas</div>
            <div className="text-sm">{(teacher.growthAreas || []).join(', ') || '—'}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


