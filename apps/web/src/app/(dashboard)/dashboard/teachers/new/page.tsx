'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'
import { User, Mail, BookOpen, GraduationCap, Image as ImageIcon, ArrowLeft } from 'lucide-react'

export default function NewTeacherPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [gradeLevel, setGradeLevel] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [strengths, setStrengths] = useState('')
  const [growthAreas, setGrowthAreas] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const parseCsv = (value: string) => value.split(',').map(s => s.trim()).filter(Boolean)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    try {
      const body = {
        name,
        email: email || undefined,
        subject: subject || undefined,
        gradeLevel: gradeLevel || undefined,
        strengths: parseCsv(strengths),
        growthAreas: parseCsv(growthAreas),
        currentGoals: [],
        photoUrl: photoUrl || undefined, // not in schema yet; safely ignored by server
      }
      const res = await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Failed to create teacher')
      router.push('/dashboard/teachers')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create teacher')
    } finally {
      setIsSubmitting(false)
    }
  }

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

      <h1 className="text-3xl font-bold tracking-tight">Add Teacher</h1>

      <Card>
        <CardHeader>
          <CardTitle>Teacher Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" /> Name
                </label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Sarah Johnson" required className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" /> Email
                </label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teacher@school.edu" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium flex items-center gap-2">
                  <BookOpen className="h-4 w-4" /> Subject
                </label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g., Mathematics" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" /> Grade Level
                </label>
                <Input value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} placeholder="e.g., 5" className="mt-1" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" /> Photo URL (optional)
                </label>
                <Input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://.../photo.jpg" className="mt-1" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Strengths (comma-separated)</label>
                <Textarea value={strengths} onChange={(e) => setStrengths(e.target.value)} placeholder="Classroom Management, Differentiation" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Growth Areas (comma-separated)</label>
                <Textarea value={growthAreas} onChange={(e) => setGrowthAreas(e.target.value)} placeholder="Technology Integration, Student-led Discussions" className="mt-1" />
              </div>
            </div>

            {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard/teachers">Cancel</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save Teacher'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}


