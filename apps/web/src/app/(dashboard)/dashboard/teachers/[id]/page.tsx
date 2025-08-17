'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'
import { ArrowLeft, Upload as UploadIcon } from 'lucide-react'

type Teacher = {
  id: string
  name: string
  email?: string | null
  subject?: string | null
  gradeLevel?: string | null
  strengths: string[]
  growthAreas: string[]
  currentGoals: Array<{ goal: string; progress: number }>
  photoUrl?: string | null
}

export default function EditTeacherPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const teacherId = params.id
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/teachers/${teacherId}`, { cache: 'no-store' })
        if (!res.ok) throw new Error('Failed to load teacher')
        const t = await res.json()
        setTeacher(t)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load teacher')
      } finally {
        setIsLoading(false)
      }
    }
    if (teacherId) void load()
  }, [teacherId])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    let photoUrl: string | undefined
    if (photoFile) {
      try {
        const form = new FormData()
        form.append('file', photoFile)
        const up = await fetch('/api/upload', { method: 'POST', body: form })
        if (up.ok) {
          const data = await up.json()
          photoUrl = data.url
        }
      } catch {}
    }
    try {
      const res = await fetch(`/api/teachers/${teacherId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: teacher?.name,
          email: teacher?.email || '',
          subject: teacher?.subject || '',
          gradeLevel: teacher?.gradeLevel || '',
          strengths: teacher?.strengths,
          growthAreas: teacher?.growthAreas,
          currentGoals: teacher?.currentGoals,
          photoUrl,
        }),
      })
      if (!res.ok) throw new Error('Failed to save teacher')
      router.push('/dashboard/teachers')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save teacher')
    }
  }

  if (isLoading) return <div className="p-6">Loading…</div>
  if (!teacher) return <div className="p-6">{error || 'Not found'}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/teachers" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Teachers
          </Link>
        </Button>
      </div>

      <h1 className="text-3xl font-bold tracking-tight">Edit Teacher</h1>

      <Card>
        <CardHeader>
          <CardTitle>Teacher Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input value={teacher.name} onChange={(e) => setTeacher({ ...teacher, name: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input type="email" value={teacher.email ?? ''} onChange={(e) => setTeacher({ ...teacher, email: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Subject</label>
                <Input value={teacher.subject ?? ''} onChange={(e) => setTeacher({ ...teacher, subject: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Grade Level</label>
                <Input value={teacher.gradeLevel ?? ''} onChange={(e) => setTeacher({ ...teacher, gradeLevel: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <UploadIcon className="h-4 w-4" /> New Photo (optional)
                </label>
                <input type="file" accept="image/*" className="mt-1" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
                {teacher.photoUrl ? (
                  <p className="text-xs text-muted-foreground mt-1 truncate">Current: {teacher.photoUrl}</p>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Strengths (comma-separated)</label>
                <Textarea value={teacher.strengths.join(', ')} onChange={(e) => setTeacher({ ...teacher, strengths: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} />
              </div>
              <div>
                <label className="text-sm font-medium">Growth Areas (comma-separated)</label>
                <Textarea value={teacher.growthAreas.join(', ')} onChange={(e) => setTeacher({ ...teacher, growthAreas: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} />
              </div>
            </div>

            {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard/teachers">Cancel</Link>
              </Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
