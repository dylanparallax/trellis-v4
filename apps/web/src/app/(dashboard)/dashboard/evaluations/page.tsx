import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Plus, Award, MessageSquare, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function EvaluationsPage() {
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
        <Card className="text-center py-12">
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <Award className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">No evaluations yet</h3>
                <p className="text-sm text-muted-foreground">
                  Start by creating your first teacher evaluation
                </p>
              </div>
              <Button asChild>
                <Link href="/dashboard/evaluations/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Evaluation
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

 