'use client'

import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

const goalItem = z.object({ goal: z.string(), progress: z.number().min(0).max(100).optional() })
const goalsSchema = z.array(goalItem)

type Goals = z.infer<typeof goalsSchema>

type Props = {
  className?: string
}

export default function TeacherGoalsClient({ className }: Props) {
  const [rawText, setRawText] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/teachers/me/goals', { cache: 'no-store' })
        if (!res.ok) throw new Error('Failed to load goals')
        const data = (await res.json()) as { goals?: Goals }
        const lines = (data.goals ?? []).map(g => `- ${g.goal}`).join('\n')
        if (!cancelled) setRawText(lines)
      } catch (e) {
        if (!cancelled) setErrorMessage('Failed to load goals.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const parsedGoals: Goals = useMemo(() => {
    const lines = rawText
      .split('\n')
      .map(l => l.replace(/^\s*[-*]\s*/, '').trim())
      .filter(Boolean)
    return lines.map(goal => ({ goal }))
  }, [rawText])

  async function handleSave() {
    setErrorMessage(null)
    setSuccessMessage(null)
    setIsSaving(true)
    try {
      const payload = { goals: parsedGoals }
      goalsSchema.parse(parsedGoals)
      const res = await fetch('/api/teachers/me/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        const message = typeof data?.error === 'string' ? data.error : 'Failed to save goals.'
        throw new Error(message)
      }
      setSuccessMessage('Goals saved.')
      setTimeout(() => setSuccessMessage(null), 2500)
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : 'Failed to save goals.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className={className}>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">My Goals</h3>
          <Button size="sm" onClick={handleSave} disabled={isLoading || isSaving}>
            {isSaving ? 'Saving…' : 'Save'}
          </Button>
        </div>
        <Textarea
          aria-label="Teacher goals"
          value={rawText}
          onChange={e => setRawText(e.target.value)}
          placeholder="- Improve student engagement with cold-calling
- Increase formative checks to 3 per lesson"
          className="min-h-[160px]"
          disabled={isLoading}
        />
        {errorMessage ? <p className="text-sm text-red-500">{errorMessage}</p> : null}
        {successMessage ? <p className="text-sm text-green-600">{successMessage}</p> : null}
        <p className="text-xs text-muted-foreground">
          Tip: one goal per line, starting with a dash. Progress tracking coming soon.
        </p>
      </div>
    </div>
  )
}


