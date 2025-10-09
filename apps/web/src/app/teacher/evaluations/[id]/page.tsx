import { headers } from 'next/headers'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, ArrowLeft, Award } from 'lucide-react'
import TeacherEvaluationClient from '@/components/evaluations/TeacherEvaluationClient'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getAuthContext } from '@/lib/auth/server'

export const dynamic = 'force-dynamic'

async function getBaseUrl(): Promise<string> {
  const env = process.env.NEXT_PUBLIC_BASE_URL
  if (env && env.trim().length > 0) return env.replace(/\/$/, '')
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'
  const proto = h.get('x-forwarded-proto') ?? 'http'
  return `${proto}://${host}`
}

async function getEvaluation(id: string) {
  const baseUrl = await getBaseUrl()
  const h = await headers()
  const cookieHeader = h.get('cookie') ?? ''
  const res = await fetch(`${baseUrl}/api/evaluations/${id}`, { cache: 'no-store', headers: { cookie: cookieHeader } })
  if (!res.ok) return null
  return res.json()
}

type PageParams = { params: Promise<{ id: string }> }

export default async function TeacherEvaluationDetailPage({ params }: PageParams) {
  const auth = await getAuthContext()
  if (!auth || auth.role !== 'TEACHER') return null
  const { id } = await params
  const evaluation = await getEvaluation(id)
  if (!evaluation) {
    return (
      <div className="p-6">
        <Button asChild variant="ghost">
          <Link href="/teacher" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to My Feedback
          </Link>
        </Button>
        <p className="mt-4 text-muted-foreground">Feedback not found.</p>
      </div>
    )
  }

  const dateStr = new Date(evaluation.submittedAt || evaluation.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const markdown: string | null = evaluation?.content && typeof evaluation.content === 'object' && 'markdown' in evaluation.content
    ? (evaluation.content as { markdown?: string }).markdown ?? null
    : null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <Button asChild variant="ghost">
          <Link href="/teacher" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to My Feedback
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Feedback Details</CardTitle>
          <CardDescription>{evaluation.teacher.name} • {evaluation.teacher.subject} • Grade {evaluation.teacher.gradeLevel}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" /> {dateStr}
            </div>
            <div className="flex items-center gap-1">
              Status: {evaluation.status}
            </div>
            <div className="flex items-center gap-1">
              <Award className="h-4 w-4" /> Type: {evaluation.type}
            </div>
          </div>

          {markdown ? (
            <div className="prose prose-neutral dark:prose-invert max-w-none md:prose-lg lg:prose-xl leading-relaxed [--tw-prose-body:theme(colors.foreground/0.9)] prose-headings:mt-6 prose-headings:mb-4 prose-headings:font-semibold prose-p:my-4 prose-li:my-1.5">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {markdown}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No generated feedback content.</div>
          )}

          <TeacherEvaluationClient evaluation={{ id: evaluation.id, status: evaluation.status }} />
        </CardContent>
      </Card>
    </div>
  )
}


