"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MessageSquare } from 'lucide-react'

export function RagChatWidget() {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [history, setHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string; hits?: any[] }>>([])

  async function send() {
    if (message.trim().length === 0) return
    const userMsg = message
    setHistory((h) => [...h, { role: 'user', content: userMsg }])
    setMessage('')
    try {
      const res = await fetch('/api/rag/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: userMsg, topK: 6 }) })
      if (!res.ok) return
      const data = await res.json()
      setHistory((h) => [...h, { role: 'assistant', content: data.message, hits: data.hits }])
    } catch {}
  }

  return (
    <div>
      <Button className="fixed bottom-4 right-4 shadow-lg" size="lg" onClick={() => setOpen(true)}>
        <MessageSquare className="mr-2 h-4 w-4" /> Ask RAG
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm">
          <div className="absolute right-0 top-0 h-full w-full sm:w-[480px] bg-card border-l flex flex-col">
            <div className="p-4 border-b font-semibold">RAG Assistant</div>
            <div className="flex-1 overflow-auto space-y-4 p-4">
              {history.length === 0 ? (
                <div className="text-sm text-muted-foreground">Ask about trends, strategies, or findings across observations and feedback.</div>
              ) : history.map((m, idx) => (
                <div key={idx} className="rounded-md border p-3">
                  <div className="text-xs uppercase text-muted-foreground mb-2">{m.role}</div>
                  <div className="whitespace-pre-wrap text-sm">{m.content}</div>
                  {m.hits && m.hits.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {m.hits.map((h: any) => (
                        <a key={h.chunkId} href={`/dashboard/${h.sourceType === 'OBSERVATION' ? 'observations' : 'evaluations'}/${h.sourceId}`} className="text-xs">
                          <Badge variant="outline">{h.sourceType.toLowerCase()}</Badge>
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
            <div className="border-t p-4 space-y-2">
              <textarea className="w-full h-24 rounded-md border px-3 py-2 text-sm" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type your question..." />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
                <Button onClick={send} disabled={message.trim().length === 0}>Send</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
