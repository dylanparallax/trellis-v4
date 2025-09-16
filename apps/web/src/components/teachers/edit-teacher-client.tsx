'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Teacher = {
  id: string
  name: string
  email?: string | null
  subject?: string | null
  gradeLevel?: string | null
  strengths?: string[]
  growthAreas?: string[]
}

type Props = {
  teacher: Teacher
}

export default function EditTeacherClient({ teacher }: Props) {
  const [isSaving, startTransition] = useTransition()
  const [name, setName] = useState(teacher.name || '')
  const [email, setEmail] = useState(teacher.email || '')
  const [subject, setSubject] = useState(teacher.subject || '')
  const [gradeLevel, setGradeLevel] = useState(teacher.gradeLevel || '')
  const [strengths, setStrengths] = useState((teacher.strengths || []).join(', '))
  const [growthAreas, setGrowthAreas] = useState((teacher.growthAreas || []).join(', '))

  const handleSave = () => {
    startTransition(async () => {
      const body = {
        name,
        email,
        subject,
        gradeLevel,
        strengths: strengths.split(',').map((s) => s.trim()).filter(Boolean),
        growthAreas: growthAreas.split(',').map((s) => s.trim()).filter(Boolean),
      }
      const res = await fetch(`/api/teachers/${teacher.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        window.location.href = `/dashboard/teachers/${teacher.id}`
      }
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Subject</label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Grade Level</label>
            <Input value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Strengths & Growth Areas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Strengths (comma separated)</label>
            <Input value={strengths} onChange={(e) => setStrengths(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Growth Areas (comma separated)</label>
            <Input value={growthAreas} onChange={(e) => setGrowthAreas(e.target.value)} />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


