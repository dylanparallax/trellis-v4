'use client'

import { useState, useTransition, type Dispatch, type SetStateAction } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronDown, ChevronUp, Save, Trash2, Edit3, X } from 'lucide-react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

type Observation = {
  id: string
  rawNotes: string
  enhancedNotes?: string | null
  duration?: number | null
  observationType: 'FORMAL' | 'INFORMAL' | 'WALKTHROUGH'
  focusAreas: string[]
  date: string
}

type Props = {
  observation: Observation
}

export default function ObservationDetailClient({ observation }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, startTransition] = useTransition()

  const [rawNotes, setRawNotes] = useState(observation.rawNotes)
  const [enhancedNotes, setEnhancedNotes] = useState(observation.enhancedNotes || '')
  const [originalEnhancedNotes, setOriginalEnhancedNotes] = useState(observation.enhancedNotes || '')
  const [duration, setDuration] = useState(observation.duration?.toString() || '')
  const [date, setDate] = useState(observation.date.slice(0, 10))
  const [observationType, setObservationType] = useState<Observation['observationType']>(observation.observationType)
  const [focusAreas, setFocusAreas] = useState<string[]>(observation.focusAreas || [])

  const [showRaw, setShowRaw] = useState(false)
  const [showEnhanced, setShowEnhanced] = useState(false)

  const toggle = (setter: Dispatch<SetStateAction<boolean>>) => setter(prev => !prev)

  const handleSave = () => {
    const payload: Record<string, unknown> = {
      enhancedNotes: enhancedNotes || null,
      duration: duration ? parseInt(duration) : undefined,
      observationType,
      focusAreas,
      date,
    }
    if (rawNotes.trim().length > 0) payload.rawNotes = rawNotes

    startTransition(async () => {
      const res = await fetch(`/api/observations/${observation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        await res.json()
        setIsEditing(false)
        setOriginalEnhancedNotes(enhancedNotes)
      }
    })
  }

  const enhanceWithAI = () => {
    startTransition(async () => {
      const res = await fetch('/api/observations/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawNotes,
          observationType,
          focusAreas,
          // Leave teacherId undefined here; API can still enhance without it
        }),
      })
      if (res.ok) {
        const data = await res.json() as { enhancedNotes?: string }
        if (typeof data.enhancedNotes === 'string') {
          setEnhancedNotes(data.enhancedNotes)
          // auto-reveal enhanced panel if hidden
          setShowEnhanced(true)
        }
      }
    })
  }

  const hasEnhancedChange = (enhancedNotes || '').trim() !== (originalEnhancedNotes || '').trim()

  const handleDelete = () => {
    startTransition(async () => {
      const res = await fetch(`/api/observations/${observation.id}`, { method: 'DELETE' })
      if (res.ok) window.location.href = '/dashboard/observations'
    })
  }

  // Formatting helpers (mirrors evaluation page)
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
        if (output.length > 0 && output[output.length - 1].trim().length > 0) output.push('')
        output.push(`## ${title}`)
        output.push('')
        continue
      } else {
        output.push(line)
      }
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
    h1: (props) => (<h1 className="font-plex-mono text-3xl md:text-4xl font-semibold tracking-tight" {...props} />),
    h2: (props) => (<h2 className="font-plex-mono text-2xl md:text-3xl font-semibold tracking-tight" {...props} />),
    h3: (props) => (<h3 className="font-plex-mono text-xl md:text-2xl font-semibold tracking-tight" {...props} />),
    h4: (props) => (<h4 className="font-plex-mono text-lg md:text-xl font-semibold tracking-tight" {...props} />),
    p:  (props) => (<p className="my-4 leading-[1.85] text-foreground/90" {...props} />),
    ul: (props) => (<ul className="my-4 list-disc pl-6 space-y-2" {...props} />),
    ol: (props) => (<ol className="my-4 list-decimal pl-6 space-y-2" {...props} />),
    li: (props) => (<li className="pl-1" {...props} />),
    blockquote: (props) => (<blockquote className="my-6 border-l-2 pl-4 italic text-foreground/80 bg-muted/30 rounded-r" {...props} />),
    hr: () => <hr className="my-8 border-t border-border" />,
    table: (props) => (<div className="my-6 overflow-x-auto rounded-md ring-1 ring-border/60"><table className="w-full text-sm" {...props} /></div>),
    th: (props) => (<th className="bg-muted/60 px-3 py-2 text-left font-medium" {...props} />),
    td: (props) => (<td className="px-3 py-2 align-top border-t border-border/60" {...props} />),
    strong: (props) => (<strong className="text-foreground" {...props} />),
    em: (props) => (<em className="text-foreground/90" {...props} />),
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 justify-end">
        {isEditing ? (
          <>
            <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSubmitting}>
              <X className="h-4 w-4 mr-2" /> Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSubmitting || !rawNotes.trim()}>
              <Save className="h-4 w-4 mr-2" /> Save
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Edit3 className="h-4 w-4 mr-2" /> Edit
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </Button>
            <Button onClick={enhanceWithAI} disabled={isSubmitting} variant="ai">
              Enhance Notes with AI
            </Button>
            {hasEnhancedChange && (
              <Button onClick={handleSave} disabled={isSubmitting}>
                <Save className="h-4 w-4 mr-2" /> Save
              </Button>
            )}
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium">Observation Type</label>
          <select
            value={observationType}
            onChange={(e) => setObservationType(e.target.value as Observation['observationType'])}
            className="w-full mt-1 p-2 pr-8 border rounded-md bg-background"
            disabled={!isEditing}
          >
            <option value="FORMAL">Formal</option>
            <option value="INFORMAL">Informal</option>
            <option value="WALKTHROUGH">Walkthrough</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Duration (minutes)</label>
          <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="mt-1" disabled={!isEditing} />
        </div>

        <div>
          <label className="text-sm font-medium">Date</label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" disabled={!isEditing} />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Focus Areas</label>
        <div className="mt-1 grid grid-cols-2 gap-2">
          {['Student Engagement', 'Differentiation', 'Assessment', 'Classroom Management', 'Technology Integration', 'Student Collaboration'].map((area) => (
            <label key={area} className={`flex items-start gap-3 p-2 rounded-md ${isEditing ? 'hover:bg-muted/50 cursor-pointer' : ''}`}>
              <input
                type="checkbox"
                checked={focusAreas.includes(area)}
                onChange={(e) => {
                  if (!isEditing) return
                  if (e.target.checked) setFocusAreas(prev => [...prev, area])
                  else setFocusAreas(prev => prev.filter(a => a !== area))
                }}
                className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary focus:ring-2 focus:ring-offset-0"
                disabled={!isEditing}
              />
              <span className="text-sm leading-5 select-none">{area}</span>
            </label>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <button
            type="button"
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/60"
            onClick={() => toggle(setShowRaw)}
          >
            <span className="text-sm font-medium">Raw Notes</span>
            {showRaw ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {showRaw && (
            <div className="p-4 pt-0">
              {isEditing ? (
                <Textarea value={rawNotes} onChange={(e) => setRawNotes(e.target.value)} className="min-h-[180px]" />
              ) : (
                <pre className="whitespace-pre-wrap text-sm bg-muted p-3 rounded-md">{rawNotes}</pre>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <button
            type="button"
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/60"
            onClick={() => toggle(setShowEnhanced)}
          >
            <span className="text-sm font-medium">AI Enhanced Notes</span>
            {showEnhanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {showEnhanced && (
            <div className="p-4 pt-0">
              {isEditing ? (
                <Textarea value={enhancedNotes} onChange={(e) => setEnhancedNotes(e.target.value)} className="min-h-[160px]" />
              ) : (
                <div className="prose prose-neutral dark:prose-invert max-w-none md:prose-base lg:prose-lg leading-relaxed [--tw-prose-body:theme(colors.foreground/0.9)] prose-headings:mt-6 prose-headings:mb-4 prose-headings:font-semibold prose-p:my-4 prose-li:my-1.5">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                    {formatMarkdownForSpacing(enhancedNotes || '')}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


