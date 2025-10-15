import { headers } from 'next/headers'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import EditTeacherClient from '@/components/teachers/edit-teacher-client'

async function getBaseUrl(): Promise<string> {
  const env = process.env.NEXT_PUBLIC_BASE_URL
  if (env && env.trim().length > 0) return env.replace(/\/$/, '')
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'
  const proto = h.get('x-forwarded-proto') ?? 'http'
  return `${proto}://${host}`
}

async function getTeacher(id: string) {
  const base = await getBaseUrl()
  const h = await headers()
  const cookie = h.get('cookie') ?? ''
  const res = await fetch(`${base}/api/teachers/${id}`, { cache: 'no-store', headers: { cookie } })
  if (!res.ok) return null
  return res.json()
}

type PageParams = { params: Promise<{ id: string }> }

export default async function EditTeacherPage({ params }: PageParams) {
  const { id } = await params
  const teacher = await getTeacher(id)
  if (!teacher) {
    return (
      <div className="p-6">
        <Button asChild variant="ghost">
          <Link href={`/dashboard/teachers/${id}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Teacher
          </Link>
        </Button>
        <p className="mt-4 text-muted-foreground">Teacher not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <Button asChild variant="ghost">
          <Link href={`/dashboard/teachers/${id}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Teacher
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Edit Teacher</h1>
      </div>

      <EditTeacherClient teacher={{
        id,
        name: teacher.name || '',
        email: teacher.email || '',
        subject: teacher.subject || '',
        gradeLevel: teacher.gradeLevel || '',
        tenureStatus: teacher.tenureStatus || null,
        departments: teacher.departments || [],
        strengths: teacher.strengths || [],
        growthAreas: teacher.growthAreas || [],
        currentGoals: teacher.currentGoals || [],
      }} />
    </div>
  )
}


