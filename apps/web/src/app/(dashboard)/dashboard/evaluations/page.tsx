'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Plus, FileText, MessageSquare, ArrowLeft } from 'lucide-react'
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
        <Button variant="outline" size="icon">
          <FileText className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4">
        {evaluations.map((evaluation) => (
          <Card key={evaluation.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {evaluation.teacherName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <CardTitle className="text-lg">{evaluation.teacherName}</CardTitle>
                    <CardDescription>{evaluation.subject} • Grade {evaluation.gradeLevel}</CardDescription>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{evaluation.type}</div>
                  <div className="text-xs text-muted-foreground">{evaluation.date}</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    {evaluation.schoolYear}
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    {evaluation.chatMessages} messages
                  </div>
                </div>
                
                <div className="text-sm">
                  <p className="line-clamp-3 text-muted-foreground">
                    {evaluation.summary}
                  </p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        evaluation.status === 'Draft' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {evaluation.status}
                    </span>
                  </div>
                  
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/evaluations/${evaluation.id}`}>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Continue Chat
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

const evaluations = [
  {
    id: '1',
    teacherName: 'Sarah Johnson',
    subject: 'Mathematics',
    gradeLevel: '5',
    type: 'Formative',
    date: 'Dec 15, 2024',
    schoolYear: '2024-2025',
    chatMessages: 12,
    summary: 'Comprehensive evaluation focusing on student engagement and differentiated instruction. Strong progress in classroom management and assessment strategies.',
    status: 'Draft'
  },
  {
    id: '2',
    teacherName: 'Michael Chen',
    subject: 'Science',
    gradeLevel: '4',
    type: 'Summative',
    date: 'Dec 10, 2024',
    schoolYear: '2024-2025',
    chatMessages: 8,
    summary: 'Excellent performance in inquiry-based learning and student collaboration. Demonstrated strong growth in technology integration.',
    status: 'Completed'
  },
  {
    id: '3',
    teacherName: 'Emily Rodriguez',
    subject: 'English Language Arts',
    gradeLevel: '3',
    type: 'Formative',
    date: 'Dec 8, 2024',
    schoolYear: '2024-2025',
    chatMessages: 15,
    summary: 'Outstanding progress in literacy instruction and student reading comprehension. Effective use of formative assessment.',
    status: 'Draft'
  }
] 