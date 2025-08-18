import { headers } from 'next/headers'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

async function getBaseUrl(): Promise<string> {
  const env = process.env.NEXT_PUBLIC_BASE_URL
  if (env && env.trim().length > 0) return env.replace(/\/$/, '')
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'
  const proto = h.get('x-forwarded-proto') ?? 'http'
  return `${proto}://${host}`
}

async function getObservation(id: string) {
  const baseUrl = await getBaseUrl()
  const h = await headers()
  const cookieHeader = h.get('cookie') ?? ''
  const res = await fetch(`${baseUrl}/api/observations/${id}`, { cache: 'no-store', headers: { cookie: cookieHeader } })
  if (!res.ok) return null
  return res.json()
}

type PageParams = { params: Promise<{ id: string }> }

export default async function ObservationDetailPage({ params }: PageParams) {
  const { id } = await params
  const observation = await getObservation(id)
  if (!observation) {
    return (
      <div className="p-6">
        <Button asChild variant="ghost">
          <Link href="/dashboard/observations" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Observations
          </Link>
        </Button>
        <p className="mt-4 text-muted-foreground">Observation not found.</p>
      </div>
    )
  }

  const dateStr = new Date(observation.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost">
          <Link href="/dashboard/observations" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Observations
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Observation Details</CardTitle>
          <CardDescription>{observation.teacher.name} • {observation.teacher.subject} • Grade {observation.teacher.gradeLevel}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" /> {dateStr}
            </div>
            {observation.duration ? (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" /> {observation.duration} minutes
              </div>
            ) : null}
            <div className="flex items-center gap-1">
              Observer: {observation.observer.name}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-1">Raw Notes</h3>
            <pre className="whitespace-pre-wrap text-sm bg-muted p-3 rounded-md">{observation.rawNotes}</pre>
          </div>

          {observation.enhancedNotes ? (
            <div>
              <h3 className="text-sm font-medium mb-1">AI Enhanced Notes</h3>
              <pre className="whitespace-pre-wrap text-sm bg-muted p-3 rounded-md">{observation.enhancedNotes}</pre>
            </div>
          ) : null}

          {observation.focusAreas?.length ? (
            <div>
              <h3 className="text-sm font-medium mb-1">Focus Areas</h3>
              <div className="flex flex-wrap gap-2">
                {observation.focusAreas.map((a: string) => (
                  <span key={a} className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">{a}</span>
                ))}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}


