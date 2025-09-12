import { headers } from 'next/headers'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, ArrowLeft, Award } from 'lucide-react'
import EvaluationDetailClient from '@/components/evaluations/EvaluationDetailClient'
import dynamic from 'next/dynamic'
import remarkGfm from 'remark-gfm'

const ReactMarkdown = dynamic(() => import('react-markdown'), { ssr: false })

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

export default async function EvaluationDetailPage({ params }: PageParams) {
  const { id } = await params
  const evaluation = await getEvaluation(id)
  if (!evaluation) {
    return (
      <div className="p-6">
        <Button asChild variant="ghost">
          <Link href="/dashboard/evaluations" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Feedback
          </Link>
        </Button>
        <p className="mt-4 text-muted-foreground">Evaluation not found.</p>
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
          <Link href="/dashboard/evaluations" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Evaluations
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

          {/* Generated Feedback Content */}
          {markdown ? (
            <div className="prose prose-sm md:prose-base lg:prose-lg max-w-none prose-p:leading-relaxed prose-p:mb-5 prose-ul:list-disc prose-ol:list-decimal prose-ul:pl-6 prose-ol:pl-6 prose-li:my-1">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No generated feedback content.</div>
          )}

          {/* Editable metadata (type/status/summary/recs/next) */}
          <EvaluationDetailClient evaluation={evaluation} />
        </CardContent>
      </Card>
    </div>
  )
}


