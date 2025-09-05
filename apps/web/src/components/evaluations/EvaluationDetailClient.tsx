'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronDown, ChevronUp, Save, Trash2, Edit3, X } from 'lucide-react'

type Evaluation = {
  id: string
  summary: string | null
  type: 'FORMATIVE' | 'SUMMATIVE' | 'MID_YEAR' | 'END_YEAR'
  status: 'DRAFT' | 'SUBMITTED' | 'ACKNOWLEDGED'
  content: unknown
  scores: unknown
  recommendations: string[]
  nextSteps: string[]
}

type Props = {
  evaluation: Evaluation
}

export default function EvaluationDetailClient({ evaluation }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, startTransition] = useTransition()

  const [summary, setSummary] = useState(evaluation.summary || '')
  const [type, setType] = useState<Evaluation['type']>(evaluation.type)
  const [status, setStatus] = useState<Evaluation['status']>(evaluation.status)
  const [recommendations, setRecommendations] = useState<string[]>(evaluation.recommendations || [])
  const [nextSteps, setNextSteps] = useState<string[]>(evaluation.nextSteps || [])
  const [showSummary, setShowSummary] = useState(false)

  const toggle = (setter: (v: boolean) => void) => setter(prev => !prev)

  const handleSave = () => {
    const payload = { summary, type, status, recommendations, nextSteps }
    startTransition(async () => {
      const res = await fetch(`/api/evaluations/${evaluation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) setIsEditing(false)
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      const res = await fetch(`/api/evaluations/${evaluation.id}`, { method: 'DELETE' })
      if (res.ok) window.location.href = '/dashboard/evaluations'
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
            <Button onClick={handleSave} disabled={isSubmitting}>
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
          <label className="text-sm font-medium">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as Evaluation['type'])}
            className="w-full mt-1 p-2 pr-8 border rounded-md bg-background"
            disabled={!isEditing}
          >
            <option value="FORMATIVE">Formative</option>
            <option value="SUMMATIVE">Summative</option>
            <option value="MID_YEAR">Mid-Year</option>
            <option value="END_YEAR">End-Year</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Evaluation['status'])}
            className="w-full mt-1 p-2 pr-8 border rounded-md bg-background"
            disabled={!isEditing}
          >
            <option value="DRAFT">Draft</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
          </select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <button
            type="button"
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/60"
            onClick={() => toggle(setShowSummary)}
          >
            <span className="text-sm font-medium">Summary</span>
            {showSummary ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {showSummary && (
            <div className="p-4 pt-0">
              {isEditing ? (
                <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} className="min-h-[180px]" />
              ) : (
                <pre className="whitespace-pre-wrap text-sm bg-muted p-3 rounded-md">{summary}</pre>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium mb-2">Recommendations</div>
            <div className="flex flex-wrap gap-2">
              {recommendations.map((rec, i) => (
                <span key={`${rec}-${i}`} className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">{rec}</span>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium mb-2">Next Steps</div>
            <div className="flex flex-wrap gap-2">
              {nextSteps.map((step, i) => (
                <span key={`${step}-${i}`} className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">{step}</span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


