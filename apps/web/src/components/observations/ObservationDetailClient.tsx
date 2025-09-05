'use client'

import { useState, useTransition, type Dispatch, type SetStateAction } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronDown, ChevronUp, Save, Trash2, Edit3, X } from 'lucide-react'

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
  const [duration, setDuration] = useState(observation.duration?.toString() || '')
  const [date, setDate] = useState(observation.date.slice(0, 10))
  const [observationType, setObservationType] = useState<Observation['observationType']>(observation.observationType)
  const [focusAreas, setFocusAreas] = useState<string[]>(observation.focusAreas || [])

  const [showRaw, setShowRaw] = useState(false)
  const [showEnhanced, setShowEnhanced] = useState(false)

  const toggle = (setter: Dispatch<SetStateAction<boolean>>) => setter(prev => !prev)

  const handleSave = () => {
    const payload = {
      rawNotes,
      enhancedNotes: enhancedNotes || null,
      duration: duration ? parseInt(duration) : undefined,
      observationType,
      focusAreas,
      date,
    }

    startTransition(async () => {
      const res = await fetch(`/api/observations/${observation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        await res.json()
        setIsEditing(false)
      }
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      const res = await fetch(`/api/observations/${observation.id}`, { method: 'DELETE' })
      if (res.ok) window.location.href = '/dashboard/observations'
    })
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
                <pre className="whitespace-pre-wrap text-sm bg-muted p-3 rounded-md">{enhancedNotes || ''}</pre>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


