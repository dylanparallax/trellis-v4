"use client"

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type Hit = {
  chunkId: string
  sourceType: 'OBSERVATION' | 'EVALUATION'
  sourceId: string
  score: number
  snippet: string
  metadata: Record<string, unknown>
}

export function RagSearch() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Hit[]>([])
  const [isLoading, setIsLoading] = useState(false)

  async function runSearch() {
    if (q.trim().length < 2) return
    setIsLoading(true)
    try {
      const res = await fetch('/api/rag/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: q, topK: 8 }) })
      if (!res.ok) {
        setResults([])
        return
      }
      const json = await res.json()
      setResults(json.results as Hit[])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>RAG Search</CardTitle>
        <CardDescription>Search observations and evaluations with AI-powered recall.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask about trends, feedback, observations..." onKeyDown={(e) => { if (e.key === 'Enter') runSearch() }} />
          <Button disabled={isLoading || q.trim().length < 2} onClick={runSearch}>Search</Button>
        </div>
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Searching...</div>
          ) : results.length === 0 ? (
            <div className="text-sm text-muted-foreground">No results yet.</div>
          ) : (
            results.map((h) => (
              <div key={h.chunkId} className="rounded-md border p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={h.sourceType === 'OBSERVATION' ? 'secondary' : 'default'}>{h.sourceType.toLowerCase()}</Badge>
                    <a className="text-sm underline" href={`/dashboard/${h.sourceType === 'OBSERVATION' ? 'observations' : 'evaluations'}/${h.sourceId}`}>Open</a>
                  </div>
                  <div className="text-xs text-muted-foreground">score: {h.score.toFixed(3)}</div>
                </div>
                <div className="mt-2 text-sm whitespace-pre-wrap line-clamp-6">{h.snippet}</div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
