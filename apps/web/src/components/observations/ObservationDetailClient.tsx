'use client'

import { useState, useTransition, useEffect, type Dispatch, type SetStateAction } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Trash2, Edit3, X, Sparkles, Save as SaveIcon } from 'lucide-react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { formatMarkdownForSpacing } from '@/lib/utils'

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

  // Side-by-side layout replaces collapsible sections

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
        }
      }
    })
  }

  const hasEnhancedChange = (enhancedNotes || '').trim() !== (originalEnhancedNotes || '').trim()

  // Listen for header action events dispatched by header actions component
  useEffect(() => {
    const onEdit = () => setIsEditing(true)
    const onSave = () => handleSave()
    const onDelete = () => handleDelete()
    window.addEventListener('observation-edit', onEdit)
    window.addEventListener('observation-save', onSave)
    window.addEventListener('observation-delete', onDelete)
    return () => {
      window.removeEventListener('observation-edit', onEdit)
      window.removeEventListener('observation-save', onSave)
      window.removeEventListener('observation-delete', onDelete)
    }
  }, [])

  const handleDelete = () => {
    startTransition(async () => {
      const res = await fetch(`/api/observations/${observation.id}`, { method: 'DELETE' })
      if (res.ok) window.location.href = '/dashboard/observations'
    })
  }

  // Use shared markdown spacing formatter

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Raw Notes</CardTitle>
            <CardDescription>Edit on the left; enhance or format on the right</CardDescription>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Textarea value={rawNotes} onChange={(e) => setRawNotes(e.target.value)} className="min-h-[240px]" />
            ) : (
              <pre className="whitespace-pre-wrap text-sm bg-muted p-3 rounded-md">{rawNotes}</pre>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm">AI Enhanced Notes</CardTitle>
              <CardDescription>Readable, shareable summary</CardDescription>
            </div>
            {!enhancedNotes && !isEditing && (
              <Button size="sm" variant="ai" onClick={enhanceWithAI}>
                <Sparkles className="h-4 w-4 mr-1" /> Enhance
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Textarea value={enhancedNotes} onChange={(e) => setEnhancedNotes(e.target.value)} className="min-h-[240px]" />
            ) : enhancedNotes ? (
              <div className="prose prose-neutral dark:prose-invert max-w-none md:prose-base lg:prose-lg leading-relaxed [--tw-prose-body:theme(colors.foreground/0.9)] prose-headings:mt-6 prose-headings:mb-4 prose-headings:font-semibold prose-p:my-4 prose-li:my-1.5">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                  {formatMarkdownForSpacing(enhancedNotes || '')}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                No AI enhanced notes yet. Click Enhance to generate a summary from raw notes.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


