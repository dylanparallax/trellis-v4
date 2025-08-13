'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

export default function SettingsPage() {
  const [framework, setFramework] = useState('')
  const [guidelines, setGuidelines] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const run = async () => {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const data = await res.json()
        setFramework(data.evaluationFrameworkText || '')
        setGuidelines(data.promptGuidelines || '')
      }
      setLoaded(true)
    }
    run()
  }, [])

  const save = async () => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evaluationFrameworkText: framework, promptGuidelines: guidelines })
      })
      if (!res.ok) throw new Error('Save failed')
    } finally {
      setIsSaving(false)
    }
  }

  if (!loaded) return <div className="p-6">Loading...</div>

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Evaluation Framework (text)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={framework}
            onChange={(e) => setFramework(e.target.value)}
            placeholder="Paste your rubric or framework text here..."
            className="min-h-[220px]"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prompt Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={guidelines}
            onChange={(e) => setGuidelines(e.target.value)}
            placeholder="Write instructions to guide AI tone, structure, and constraints..."
            className="min-h-[180px]"
          />
          <div className="flex justify-end">
            <Button onClick={save} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Settings'}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


