'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Mail } from 'lucide-react'

type Props = {
  email: string
  teacherId?: string
}

export default function InviteTeacherButton({ email, teacherId }: Props) {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string>('')
  const [variant, setVariant] = useState<'success' | 'error' | 'info'>('info')

  const handleInvite = () => {
    setMessage('')
    startTransition(async () => {
      try {
        const res = await fetch('/api/invites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, teacherId }),
        })
        const data = await res.json() as { ok?: boolean; invited?: boolean; message?: string; error?: string }
        if (!res.ok || data?.ok !== true) {
          setVariant('error')
          setMessage(data?.error || 'Failed to create invite')
          return
        }
        if (data.invited) {
          setVariant('success')
          setMessage('Invite sent.')
        } else {
          setVariant('info')
          setMessage(data.message || 'Invites disabled; would invite.')
        }
      } catch {
        setVariant('error')
        setMessage('Network error while inviting')
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      <Button onClick={handleInvite} disabled={isPending}>
        <Mail className="h-4 w-4 mr-2" />
        {isPending ? 'Inviting…' : 'Send Invite'}
      </Button>
      {message && (
        <Card className={variant === 'success' ? 'border-emerald-200 bg-emerald-50' : variant === 'error' ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-blue-50'}>
          <CardContent className="p-2 text-xs">
            {message}
          </CardContent>
        </Card>
      )}
    </div>
  )
}


