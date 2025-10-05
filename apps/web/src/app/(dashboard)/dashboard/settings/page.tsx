'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import LoadingAnimation from '@/components/ui/loading-animation'

export default function SettingsPage() {
  const [framework, setFramework] = useState('')
  const [guidelines, setGuidelines] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordStatus, setPasswordStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)

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
      // Notify other tabs/components (e.g., sidebar) to refresh user profile
      window.dispatchEvent(new Event('profile-updated'))
    } finally {
      setIsSaving(false)
    }
  }

  const changePassword = async () => {
    setPasswordStatus('idle')
    setPasswordMessage(null)

    if (!currentPassword.trim()) {
      setPasswordStatus('error')
      setPasswordMessage('Enter your current password.')
      return
    }
    if (newPassword.length < 8) {
      setPasswordStatus('error')
      setPasswordMessage('New password must be at least 8 characters long.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus('error')
      setPasswordMessage('New passwords do not match.')
      return
    }
    if (currentPassword === newPassword) {
      setPasswordStatus('error')
      setPasswordMessage('New password must be different from current password.')
      return
    }

    setIsChangingPassword(true)
    try {
      const res = await fetch('/api/me/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        const message = typeof data?.error === 'string' ? data.error : 'Failed to change password.'
        throw new Error(message)
      }
      setPasswordStatus('success')
      setPasswordMessage('Password updated successfully.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => {
        setPasswordStatus('idle')
        setPasswordMessage(null)
      }, 4000)
    } catch (error) {
      console.error('Password change failed:', error)
      setPasswordStatus('error')
      setPasswordMessage(error instanceof Error ? error.message : 'Failed to change password.')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const exportData = async () => {
    setExporting(true)
    try {
      const res = await fetch('/api/export', { method: 'GET' })
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'trellis-export.json'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (_) {
      // no-op UI message could be added
    } finally {
      setExporting(false)
    }
  }

  const uploadPhoto = async (file: File) => {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: form })
    if (res.ok) {
      const data = await res.json()
      setPhotoUrl(data.url)
      // Persist to profile right after upload for immediate sidebar reflection
      try {
        await fetch('/api/me', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photoUrl: data.url })
        })
        window.dispatchEvent(new Event('profile-updated'))
      } catch {}
    }
  }

  if (!loaded) return (
    <div className="p-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <LoadingAnimation label="Loading settings" size={24} />
        Loading...
      </div>
    </div>
  )

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
              <label className="text-sm font-medium">Current Password</label>
              <Input
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                type="password"
                placeholder="Enter current password"
                className="mt-1"
                autoComplete="current-password"
              />
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
            <div>
              <label className="text-sm font-medium">New Password</label>
              <Input
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                type="password"
                placeholder="Enter new password"
                className="mt-1"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Confirm New Password</label>
              <Input
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                type="password"
                placeholder="Confirm new password"
                className="mt-1"
                autoComplete="new-password"
              />
            </div>
          </div>
          {passwordMessage && (
            <div
              className={`text-sm ${
                passwordStatus === 'success' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {passwordMessage}
            </div>
          )}
          <div className="flex justify-end">
            <div className="flex gap-2 flex-wrap items-center">
              <Button variant="outline" onClick={exportData} disabled={exporting}>{exporting ? 'Exporting…' : 'Export data'}</Button>
              <Button onClick={changePassword} disabled={isChangingPassword}>
                {isChangingPassword ? 'Updating...' : 'Change Password'}
              </Button>
              <Button onClick={saveProfile} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Profile'}</Button>
            </div>
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

