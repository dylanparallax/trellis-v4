'use client'

import { useState, useTransition, useEffect, type Dispatch, type SetStateAction } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronDown, ChevronUp, Save, Trash2, Edit3, X, Send } from 'lucide-react'
import { useRouter } from 'next/navigation'

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
  const router = useRouter()

  const [summary, setSummary] = useState(evaluation.summary || '')
  const [type, setType] = useState<Evaluation['type']>(evaluation.type)
  const [status, setStatus] = useState<Evaluation['status']>(evaluation.status)
  const [recommendations, setRecommendations] = useState<string[]>(evaluation.recommendations || [])
  const [nextSteps, setNextSteps] = useState<string[]>(evaluation.nextSteps || [])
  const [showSummary, setShowSummary] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [deliverStatus, setDeliverStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const toggle = (setter: Dispatch<SetStateAction<boolean>>) => setter(prev => !prev)

  useEffect(() => {
    setSummary(evaluation.summary || '')
    setType(evaluation.type)
    setStatus(evaluation.status)
    setRecommendations(evaluation.recommendations || [])
    setNextSteps(evaluation.nextSteps || [])
  }, [evaluation])

  const resetForm = () => {
    setSummary(evaluation.summary || '')
    setType(evaluation.type)
    setStatus(evaluation.status)
    setRecommendations(evaluation.recommendations || [])
    setNextSteps(evaluation.nextSteps || [])
  }

  const handleSave = () => {
    if (!isEditing || isSubmitting) return
    const payload = { summary, type, status, recommendations, nextSteps }
    setSaveStatus('idle')
    setErrorMessage(null)
    startTransition(async () => {
      try {
        const res = await fetch(`/api/evaluations/${evaluation.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          throw new Error('Failed to save feedback changes')
        }
        const updated = await res.json() as Evaluation
        setSummary(updated.summary || '')
        setType(updated.type)
        setStatus(updated.status)
        setRecommendations(updated.recommendations || [])
        setNextSteps(updated.nextSteps || [])
        setIsEditing(false)
        setSaveStatus('success')
        router.refresh()
        setTimeout(() => setSaveStatus('idle'), 3000)
      } catch (error) {
        console.error(error)
        setSaveStatus('error')
        setErrorMessage(error instanceof Error ? error.message : 'Something went wrong while saving')
        setTimeout(() => setSaveStatus('idle'), 4000)
      }
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      const res = await fetch(`/api/evaluations/${evaluation.id}`, { method: 'DELETE' })
      if (res.ok) window.location.href = '/dashboard/evaluations'
    })
  }

  const handleDeliver = () => {
    if (deliverStatus === 'sending') return
    setDeliverStatus('sending')
    startTransition(async () => {
      try {
        const res = await fetch(`/api/evaluations/${evaluation.id}/deliver`, { method: 'POST' })
        if (!res.ok) throw new Error('Failed to send to teacher')
        setDeliverStatus('sent')
        router.refresh()
        setTimeout(() => setDeliverStatus('idle'), 2500)
      } catch (e) {
        setDeliverStatus('error')
        setTimeout(() => setDeliverStatus('idle'), 3000)
      }
    })
  }

  return (
    <div className="space-y-4">
      {deliverStatus === 'sent' && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-3 text-sm text-blue-800">Submitted to teacher.</CardContent>
        </Card>
      )}
      {saveStatus === 'success' && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-3 text-sm text-green-800">Feedback saved.</CardContent>
        </Card>
      )}
      {saveStatus === 'error' && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-3 text-sm text-red-700">{errorMessage ?? 'Failed to save feedback changes.'}</CardContent>
        </Card>
      )}
      <div className="flex gap-2 justify-end">
        {isEditing ? (
          <>
            <Button
              variant="outline"
              onClick={() => {
                resetForm()
                setIsEditing(false)
              }}
              disabled={isSubmitting}
            >
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
            {status !== 'SUBMITTED' && status !== 'ACKNOWLEDGED' ? (
              <Button onClick={handleDeliver} disabled={deliverStatus === 'sending'}>
                <Send className="h-4 w-4 mr-2" />
                {deliverStatus === 'sending' ? 'Submitting…' : 'Submit to Teacher'}
              </Button>
            ) : null}
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
            className="w-full mt-1 p-2 pr-10 border rounded-md bg-background appearance-none"
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
            className="w-full mt-1 p-2 pr-10 border rounded-md bg-background appearance-none"
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
