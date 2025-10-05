'use client'

import { useState, useTransition, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle2, Upload, SendHorizonal } from 'lucide-react'

type Evaluation = {
  id: string
  status: 'DRAFT' | 'SUBMITTED' | 'ACKNOWLEDGED'
}

type Props = {
  evaluation: Evaluation
}

export default function TeacherEvaluationClient({ evaluation }: Props) {
  const [isAcknowledging, startTransition] = useTransition()
  const [ackStatus, setAckStatus] = useState<'idle' | 'done' | 'error'>('idle')
  const [question, setQuestion] = useState('')
  const [aiReply, setAiReply] = useState<string>('')
  const [isAsking, setIsAsking] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const canAcknowledge = evaluation.status === 'SUBMITTED'

  const handleAcknowledge = () => {
    if (!canAcknowledge) return
    setAckStatus('idle')
    startTransition(async () => {
      try {
        const res = await fetch(`/api/evaluations/${evaluation.id}/acknowledge`, { method: 'POST' })
        if (!res.ok) throw new Error('Failed to acknowledge')
        setAckStatus('done')
        // Refresh page to reflect new status
        window.location.reload()
      } catch {
        setAckStatus('error')
        setTimeout(() => setAckStatus('idle'), 3000)
      }
    })
  }

  const handleAskAI = async () => {
    const q = question.trim()
    if (!q) return
    setIsAsking(true)
    setAiReply('')
    try {
      const res = await fetch(`/api/evaluations/${evaluation.id}/coach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userMessage: q })
      })
      if (!res.ok) throw new Error('Failed to ask')
      const data = await res.json() as { message?: string }
      setAiReply(data?.message || 'No response.')
    } catch {
      setAiReply('Sorry, I had trouble answering that. Please try again.')
    } finally {
      setIsAsking(false)
    }
  }

  const examplePrompts = [
    'Give me 3 practical strategies to improve classroom routines next week.',
    'What reflective question should I consider about student engagement?',
    'Suggest a low-lift way to differentiate during independent work.',
  ]

  const handleUpload = async (file: File) => {
    setUploading(true)
    setUploadMsg('')
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      const data = await res.json() as { path?: string; url?: string; error?: string }
      if (!res.ok || !data?.path || !data?.url) throw new Error(data?.error || 'Upload failed')
      const attach = await fetch(`/api/evaluations/${evaluation.id}/artifacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, fileUrl: data.path, fileType: file.type || 'application/octet-stream' })
      })
      if (!attach.ok) {
        let message = 'Failed to attach file'
        try {
          const err = await attach.json() as { error?: string }
          if (err?.error) message = err.error
        } catch {}
        throw new Error(message)
      }
      setUploadMsg('Uploaded successfully.')
      setTimeout(() => setUploadMsg(''), 2500)
    } catch (e) {
      setUploadMsg(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Acknowledge */}
      <div className="flex flex-wrap items-center gap-2 justify-end">
        <Button onClick={handleAcknowledge} disabled={!canAcknowledge || isAcknowledging}>
          <CheckCircle2 className="h-4 w-4 mr-2" />
          {canAcknowledge ? (isAcknowledging ? 'Acknowledging…' : 'Acknowledge') : 'Acknowledged'}
        </Button>
      </div>
      {ackStatus === 'error' && (
        <Card className="border-red-200 bg-red-50"><CardContent className="p-3 text-sm text-red-700">Failed to acknowledge. Please try again.</CardContent></Card>
      )}

      {/* Ask AI */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="text-sm font-medium">Ask AI about this feedback</div>
          <div className="flex flex-wrap gap-2">
            {examplePrompts.map((p) => (
              <Button
                key={p}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuestion(p)}
                disabled={isAsking}
              >
                {p}
              </Button>
            ))}
          </div>
          <Textarea
            placeholder="e.g., Can you clarify the recommendations about classroom routines?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <div className="flex justify-end">
            <Button onClick={handleAskAI} disabled={isAsking || !question.trim()}>
              <SendHorizonal className="h-4 w-4 mr-2" /> {isAsking ? 'Asking…' : 'Ask'}
            </Button>
          </div>
          {aiReply && (
            <div className="text-sm bg-muted/50 rounded-md p-3 whitespace-pre-wrap">{aiReply}</div>
          )}
        </CardContent>
      </Card>

      {/* Upload Artifacts */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="text-sm font-medium">Upload artifacts (lesson plans, student work, reflections)</div>
          <div
            className={`rounded-md border border-dashed ${isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/30'} p-4 text-sm text-muted-foreground flex flex-col items-center justify-center gap-2`}
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragOver(true)
            }}
            onDragLeave={(e) => {
              e.preventDefault()
              setIsDragOver(false)
            }}
            onDrop={(e) => {
              e.preventDefault()
              setIsDragOver(false)
              const f = e.dataTransfer.files?.[0]
              if (f) void handleUpload(f)
            }}
          >
            <div>Drag and drop a file here</div>
            <div className="text-xs">PDF, DOCX, images (max ~10MB)</div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void handleUpload(f)
              // reset input
              e.currentTarget.value = ''
            }}
          />
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" /> {uploading ? 'Uploading…' : 'Choose file'}
          </Button>
          {uploadMsg && (
            <div className="text-xs text-muted-foreground">{uploadMsg}</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


