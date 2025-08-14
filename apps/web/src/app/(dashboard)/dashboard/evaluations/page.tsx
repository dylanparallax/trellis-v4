import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Plus, Award, MessageSquare, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { prisma } from '@trellis/database'
import { getAuthContext } from '@/lib/auth/server'

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function currentSchoolYear() {
  const now = new Date()
  const startYear = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1
  return `${startYear}-${startYear + 1}`
}

export default async function EvaluationsPage() {
  const auth = await getAuthContext()
  const evaluations = auth?.schoolId
    ? await prisma.evaluation.findMany({
        where: { schoolId: auth.schoolId },
        include: { teacher: { select: { id: true, name: true, subject: true, gradeLevel: true } } },
        orderBy: { createdAt: 'desc' },
      })
    : []

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          asChild
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teacher Evaluations</h1>
          <p className="text-muted-foreground">
            Generate comprehensive AI-powered teacher evaluations with interactive chat.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/evaluations/new">
            <Plus className="mr-2 h-4 w-4" />
            New Evaluation
          </Link>
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search evaluations..."
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="icon" aria-label="Export evaluations">
          <Award className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4">
        {evaluations.length === 0 ? (
          <Card className="p-6 text-sm text-muted-foreground">No evaluations yet.</Card>
        ) : (
          evaluations.map((evaluation) => (
            <Card key={evaluation.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {evaluation.teacher.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <CardTitle className="text-lg">{evaluation.teacher.name}</CardTitle>
                      <CardDescription>{evaluation.teacher.subject || 'Subject N/A'} • Grade {evaluation.teacher.gradeLevel || 'N/A'}</CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{evaluation.type}</div>
                    <div className="text-xs text-muted-foreground">{formatDate(evaluation.createdAt)}</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        evaluation.status === 'DRAFT' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {evaluation.status}
                    </span>
                  </div>
                  
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/evaluations/chat?teacher=${evaluation.teacherId}&type=${evaluation.type}&year=${currentSchoolYear()}`}>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Open Chat
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
} 