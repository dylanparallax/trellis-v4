import { headers } from 'next/headers'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, ArrowLeft, Award } from 'lucide-react'
import EvaluationDetailClient from '@/components/evaluations/EvaluationDetailClient'
import TeacherEvaluationClient from '@/components/evaluations/TeacherEvaluationClient'
import ReactMarkdown, { type Components } from 'react-markdown'
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

export default async function EvaluationDetailPage({ params }: PageParams) {
  const { id } = await params
  const evaluation = await getEvaluation(id)
  const auth = await getAuthContext()
  if (!evaluation) {
    return (
      <div className="p-6">
        <Button asChild variant="ghost">
          <Link href="/dashboard/evaluations" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to all feedback
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

  function stripTopMetadataSection(input: string): string {
    const lines = input.split('\n')
    const keyRegex = /^(School Year|Teacher|Subject|Grade Level|Evaluation Period|Total Observations)\b/i
    const sectionStartRegex = /^(Executive Summary|Strengths|Areas for Growth|Recommendations|Next Steps)\b|^\s*#{1,6}\s+/i
    let cutoff = lines.findIndex((l) => sectionStartRegex.test(l.trim()))
    if (cutoff === -1) cutoff = Math.min(lines.length, 40)
    const filtered: string[] = []
    for (let i = 0; i < lines.length; i++) {
      const t = lines[i].trim()
      if (i < cutoff && keyRegex.test(t)) continue
      filtered.push(lines[i])
    }
    // Collapse multiple consecutive blank lines created by removals
    const collapsed: string[] = []
    for (let i = 0; i < filtered.length; i++) {
      const prev = collapsed[collapsed.length - 1] ?? ''
      const cur = filtered[i]
      if (!(prev.trim() === '' && cur.trim() === '')) collapsed.push(cur)
    }
    return collapsed.join('\n')
  }

  function formatMarkdownForSpacing(input: string): string {
    const lines = input.split('\n')
    const listItemRegex = /^(\s*[-*+]\s+|\s*\d+\.\s+)/
    const headingRegex = /^(\s*#{1,6}\s+)/
    const knownSections = new Set([
      'Executive Summary',
      'Summary',
      'Strengths',
      'Areas for Growth',
      'Recommendations',
      'Next Steps',
      'Instructional Clarity and Structure',
      'Student Engagement and Classroom Culture',
      'Content Knowledge and Artistic Expertise',
      'Assessment and Feedback Culture',
      'Differentiated Learning Opportunities',
      'Learning Objectives',
      'Teaching Strategies',
      'Key Evidence',
    ])
    const output: string[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const isEmpty = line.trim().length === 0
      const isList = listItemRegex.test(line)
      const isHeading = headingRegex.test(line)
      const trimmed = line.trim()
      const looksLikeHeading =
        !isHeading && !isList && !isEmpty &&
        (
          knownSections.has(trimmed.replace(/:$/, '')) ||
          /^(?:[A-Z][A-Za-z]+\s+){1,6}[A-Za-z]+:?$/.test(trimmed) && trimmed.length <= 80
        )

      if (looksLikeHeading) {
        const title = trimmed.replace(/:$/, '')
        // Ensure a blank line before a transformed heading for proper markdown parsing
        if (output.length > 0 && output[output.length - 1].trim().length > 0) output.push('')
        output.push(`## ${title}`)
        // add a blank line after the heading
        output.push('')
        continue
      } else {
        output.push(line)
      }

      // Insert a blank line after standalone non-list, non-heading lines to create paragraph spacing
      if (!isEmpty && !isList && !isHeading) {
        const next = lines[i + 1] ?? ''
        const nextIsEmpty = next.trim().length === 0
        const nextIsList = listItemRegex.test(next)
        const nextIsHeading = headingRegex.test(next)
        if (!nextIsEmpty && !nextIsList && !nextIsHeading) {
          output.push('')
        }
      }
    }

    return output.join('\n')
  }

  const mdComponents: Components = {
    h1: (props) => (
      <h1 className="font-plex-mono text-3xl md:text-4xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent" {...props} />
    ),
    h2: (props) => (
      <h2 className="font-plex-mono text-2xl md:text-3xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent" {...props} />
    ),
    h3: (props) => (
      <h3 className="font-plex-mono text-xl md:text-2xl font-semibold tracking-tight" {...props} />
    ),
    h4: (props) => (
      <h4 className="font-plex-mono text-lg md:text-xl font-semibold tracking-tight" {...props} />
    ),
    p: (props) => (
      <p className="my-4 leading-[1.85] text-foreground/90" {...props} />
    ),
    ul: (props) => (
      <ul className="my-4 list-disc pl-6 space-y-2" {...props} />
    ),
    ol: (props) => (
      <ol className="my-4 list-decimal pl-6 space-y-2" {...props} />
    ),
    li: (props) => (
      <li className="pl-1" {...props} />
    ),
    blockquote: (props) => (
      <blockquote className="my-6 border-l-2 pl-4 italic text-foreground/80 bg-muted/30 rounded-r" {...props} />
    ),
    hr: () => <hr className="my-8 border-t border-border" />,
    table: (props) => (
      <div className="my-6 overflow-x-auto rounded-md ring-1 ring-border/60">
        <table className="w-full text-sm" {...props} />
      </div>
    ),
    th: (props) => (
      <th className="bg-muted/60 px-3 py-2 text-left font-medium" {...props} />
    ),
    td: (props) => (
      <td className="px-3 py-2 align-top border-t border-border/60" {...props} />
    ),
    strong: (props) => (
      <strong className="text-foreground" {...props} />
    ),
    em: (props) => (
      <em className="text-foreground/90" {...props} />
    ),
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <Button asChild variant="ghost">
          <Link href="/dashboard/evaluations" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to all feedback
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
            <div className="flex items-center gap-2">
              {evaluation.status === 'DRAFT' && (
                <Badge className="bg-slate-100 text-slate-700 border-slate-200">Draft</Badge>
              )}
              {evaluation.status === 'SUBMITTED' && (
                <Badge className="bg-amber-100 text-amber-700 border-amber-200">Submitted</Badge>
              )}
              {evaluation.status === 'ACKNOWLEDGED' && (
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Acknowledged</Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Award className="h-4 w-4" /> Type: {evaluation.type}
            </div>
          </div>

          {/* Generated Feedback Content */}
          {markdown ? (
            <div className="prose prose-neutral dark:prose-invert max-w-none md:prose-lg lg:prose-xl leading-relaxed [--tw-prose-body:theme(colors.foreground/0.9)] prose-headings:mt-6 prose-headings:mb-4 prose-headings:font-semibold prose-p:my-4 prose-li:my-1.5">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                {formatMarkdownForSpacing(stripTopMetadataSection(markdown))}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No generated feedback content.</div>
          )}

          {/* Role-aware actions */}
          {auth?.role === 'TEACHER' ? (
            <TeacherEvaluationClient evaluation={{ id: evaluation.id, status: evaluation.status }} />
          ) : (
            <EvaluationDetailClient evaluation={evaluation} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}


