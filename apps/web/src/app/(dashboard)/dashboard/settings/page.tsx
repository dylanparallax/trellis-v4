'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function SettingsPage() {
  const [framework, setFramework] = useState('')
  const [guidelines, setGuidelines] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [password, setPassword] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const run = async () => {
      // Load profile basics
      const me = await fetch('/api/me')
      if (me.ok) {
        const d = await me.json()
        setDisplayName(d.name || '')
        setEmail(d.email || '')
      }
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

  const saveProfile = async () => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: displayName, photoUrl: photoUrl || undefined })
      })
      if (!res.ok) throw new Error('Save failed')
    } finally {
      setIsSaving(false)
    }
  }

  const uploadPhoto = async (file: File) => {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: form })
    if (res.ok) {
      const data = await res.json()
      setPhotoUrl(data.url)
    }
  }

  if (!loaded) return <div className="p-6">Loading...</div>

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Display Name</label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" className="mt-1" disabled />
            </div>
            <div>
              <label className="text-sm font-medium">New Password</label>
              <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Photo</label>
              <div className="mt-1 flex items-center gap-3">
                {photoUrl ? (
                  <img src={photoUrl} alt="Profile" className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-muted" />
                )}
                <Input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={saveProfile} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Profile'}</Button>
          </div>
        </CardContent>
      </Card>

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
          <CardTitle>AI Tone & Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={guidelines}
            onChange={(e) => setGuidelines(e.target.value)}
            placeholder={`Examples:\n- Tone: warm, strengths-based, concise\n- Structure: bullets then summary paragraph\n- Preferences: avoid jargon; include 2 actionable next steps\n- Voice: first-person or neutral third-person`}
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


