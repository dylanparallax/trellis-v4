export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { ObservationForm } from '@/components/observations/observation-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { getAuthContext } from '@/lib/auth/server'
import { redirect } from 'next/navigation'

export default async function NewObservationPage() {
  const auth = await getAuthContext()
  if (auth?.role === 'TEACHER') redirect('/dashboard')
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          asChild
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <Link href="/dashboard/observations">
            <ArrowLeft className="h-4 w-4" />
            Back to Observations
          </Link>
        </Button>
      </div>
      
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Observation</h1>
        <p className="text-muted-foreground">
          Conduct a classroom observation and get AI-enhanced feedback to support teacher growth.
        </p>
      </div>

      <ObservationForm />
    </div>
  )
}