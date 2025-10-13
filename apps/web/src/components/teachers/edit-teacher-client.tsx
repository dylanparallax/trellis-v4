'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TagInput } from '@/components/ui/tag-input'

type Teacher = {
  id: string
  name: string
  email?: string | null
  subject?: string | null
  gradeLevel?: string | null
  tenureStatus?: 'TEMPORARY' | 'PROBATIONARY' | 'PERMANENT' | null
  departments?: string[]
  strengths?: string[]
  growthAreas?: string[]
}

type Props = {
  teacher: Teacher
}

export default function EditTeacherClient({ teacher }: Props) {
  const router = useRouter()
  const [isSaving, startTransition] = useTransition()
  const [name, setName] = useState(teacher.name || '')
  const [email, setEmail] = useState(teacher.email || '')
  const [subject, setSubject] = useState(teacher.subject || '')
  const [gradeLevel, setGradeLevel] = useState(teacher.gradeLevel || '')
  const [tenureStatus, setTenureStatus] = useState<Teacher['tenureStatus']>(teacher.tenureStatus || null)
  const [departments, setDepartments] = useState<string[]>((teacher.departments || []))
  const [strengths, setStrengths] = useState((teacher.strengths || []).join(', '))
  const [growthAreas, setGrowthAreas] = useState((teacher.growthAreas || []).join(', '))
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSave = () => {
    if (!name.trim()) {
      setSaveStatus('error')
      setErrorMessage('Teacher name is required')
      setTimeout(() => {
        setSaveStatus('idle')
        setErrorMessage(null)
      }, 4000)
      return
    }

    setSaveStatus('idle')
    setErrorMessage(null)
    
    startTransition(async () => {
      try {
        const body = {
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim(),
          gradeLevel: gradeLevel.trim(),
          // API expects empty string to clear tenure status
          tenureStatus: tenureStatus || '',
          departments,
          strengths: strengths.split(',').map((s) => s.trim()).filter(Boolean),
          growthAreas: growthAreas.split(',').map((s) => s.trim()).filter(Boolean),
        }
        
        const res = await fetch(`/api/teachers/${teacher.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => null)
          throw new Error(errorData?.error || 'Failed to save teacher')
        }
        
        setSaveStatus('success')
        setTimeout(() => {
          router.push(`/dashboard/teachers/${teacher.id}`)
        }, 1500)
        
      } catch (error) {
        console.error('Error saving teacher:', error)
        setSaveStatus('error')
        setErrorMessage(error instanceof Error ? error.message : 'Failed to save teacher')
        setTimeout(() => {
          setSaveStatus('idle')
          setErrorMessage(null)
        }, 4000)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Status Messages */}
      {saveStatus === 'success' && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="flex items-center gap-2 p-4">
            <div className="h-5 w-5 text-green-600">✓</div>
            <span className="text-green-800">Teacher saved successfully! Redirecting...</span>
          </CardContent>
        </Card>
      )}

      {saveStatus === 'error' && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-2 p-4">
            <div className="h-5 w-5 text-red-600">⚠</div>
            <span className="text-red-800">{errorMessage || 'Failed to save teacher. Please try again.'}</span>
          </CardContent>
        </Card>
      )}

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
          <div>
            <label className="text-sm font-medium">Tenure Status</label>
            <select className="w-full mt-1 p-2 border rounded-md bg-background" value={tenureStatus || ''} onChange={(e) => setTenureStatus((e.target.value || null) as Teacher['tenureStatus'])}>
              <option value="">—</option>
              <option value="TEMPORARY">Temporary</option>
              <option value="PROBATIONARY">Probationary</option>
              <option value="PERMANENT">Permanent</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Departments</label>
            <div className="mt-1">
              <TagInput value={departments} onChange={setDepartments} placeholder="Type department and press Enter…" />
            </div>
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


