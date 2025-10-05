import { headers } from 'next/headers'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MessageSquare, Binoculars, ArrowLeft } from 'lucide-react'
import InviteTeacherButton from '@/components/teachers/invite-teacher-button'

async function getBaseUrl(): Promise<string> {
  const env = process.env.NEXT_PUBLIC_BASE_URL
  if (env && env.trim().length > 0) return env.replace(/\/$/, '')
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'
  const proto = h.get('x-forwarded-proto') ?? 'http'
  return `${proto}://${host}`
}

async function getTeacherData(id: string) {
  const base = await getBaseUrl()
  const h = await headers()
  const cookie = h.get('cookie') ?? ''
  const res = await fetch(`${base}/api/teachers/${id}`, { cache: 'no-store', headers: { cookie } })
  if (!res.ok) return null
  return res.json()
}

type PageParams = { params: Promise<{ id: string }> }

const strengthColorClasses = [
  'bg-blue-100 text-blue-700 border-blue-200',
  'bg-emerald-100 text-emerald-700 border-emerald-200',
  'bg-amber-100 text-amber-800 border-amber-200',
  'bg-purple-100 text-purple-700 border-purple-200',
  'bg-rose-100 text-rose-700 border-rose-200',
  'bg-cyan-100 text-cyan-700 border-cyan-200',
  'bg-indigo-100 text-indigo-700 border-indigo-200',
  'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
  'bg-teal-100 text-teal-700 border-teal-200',
  'bg-sky-100 text-sky-700 border-sky-200',
]

function getStrengthClasses(label: string) {
  let hash = 0
  for (let i = 0; i < label.length; i++) hash = (hash * 31 + label.charCodeAt(i)) >>> 0
  const idx = hash % strengthColorClasses.length
  return strengthColorClasses[idx]
}

export default async function TeacherDashboardPage({ params }: PageParams) {
  const { id } = await params
  const teacher = await getTeacherData(id)
  if (!teacher) {
    return (
      <div className="p-6">
        <Button asChild variant="ghost">
          <Link href="/dashboard/teachers" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Teachers
          </Link>
        </Button>
        <p className="mt-4 text-muted-foreground">Teacher not found.</p>
      </div>
    )
  }

  const observations = Array.isArray(teacher.observations) ? teacher.observations : []
  const evaluations = Array.isArray(teacher.evaluations) ? teacher.evaluations : []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <Button asChild variant="ghost">
          <Link href="/dashboard/teachers" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Teachers
          </Link>
        </Button>
        <Button asChild>
          <Link href={`/dashboard/teachers/${id}/edit`}>Edit</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{teacher.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">{teacher.subject || '—'} • Grade {teacher.gradeLevel || '—'}</div>
          {teacher.email && <div className="text-sm">{teacher.email}</div>}
          {teacher.email ? (
            <div className="pt-2">
              <InviteTeacherButton email={teacher.email} teacherId={teacher.id} />
            </div>
          ) : null}
          {teacher.strengths?.length ? (
            <div>
              <h4 className="text-sm font-medium mb-1">Strengths</h4>
              <div className="flex flex-wrap gap-1">
                {teacher.strengths.map((s: string, i: number) => (
                  <Badge key={i} className={`text-xs border ${getStrengthClasses(s)}`}>{s}</Badge>
                ))}
              </div>
            </div>
          ) : null}
          {teacher.growthAreas?.length ? (
            <div>
              <h4 className="text-sm font-medium mb-1">Growth Areas</h4>
              <div className="flex flex-wrap gap-1">
                {teacher.growthAreas.map((g: string, i: number) => (
                  <Badge key={i} className={`text-xs border ${getStrengthClasses(g)}`}>{g}</Badge>
                ))}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Binoculars className="h-4 w-4" /> Observations</CardTitle>
          </CardHeader>
          <CardContent>
            {observations.length === 0 ? (
              <div className="text-sm text-muted-foreground">No observations.</div>
            ) : (
              <ul className="text-sm space-y-2">
                {observations.slice(0, 10).map((o: { id: string; date: string; type: string }) => (
                  <li key={o.id} className="flex items-center justify-between">
                    <span>{new Date(o.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <Link className="underline" href={`/dashboard/observations/${o.id}`}>View</Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><MessageSquare className="h-4 w-4" /> Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            {evaluations.length === 0 ? (
              <div className="text-sm text-muted-foreground">No feedback.</div>
            ) : (
              <ul className="text-sm space-y-2">
                {evaluations.slice(0, 10).map((e: { id: string; createdAt: string }) => (
                  <li key={e.id} className="flex items-center justify-between">
                    <span>{new Date(e.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <Link className="underline" href={`/dashboard/evaluations/${e.id}`}>View</Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
