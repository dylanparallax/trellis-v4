'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Sparkles, User, Award, ArrowLeft } from 'lucide-react'

export default function NewEvaluationPage() {
  const router = useRouter()
  const [selectedTeacher, setSelectedTeacher] = useState('')
  const [evaluationType, setEvaluationType] = useState('FORMATIVE')
  const [schoolYear, setSchoolYear] = useState('2024-2025')
  const [searchQuery, setSearchQuery] = useState('')

  const handleGenerateEvaluation = () => {
    if (!selectedTeacher) return
    
    console.log('Generating evaluation for:', selectedTeacher, evaluationType, schoolYear)
    
    // Navigate to the evaluation chat page
    router.push(`/dashboard/evaluations/chat?teacher=${selectedTeacher}&type=${evaluationType}&year=${schoolYear}`)
  }

  const filteredTeachers = teachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (teacher.subject?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/evaluations')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Evaluations
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Teacher Evaluation</h1>
        <p className="text-muted-foreground">
          Select a teacher and evaluation type to generate a comprehensive AI-powered evaluation.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Teacher Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Select Teacher
            </CardTitle>
            <CardDescription>
              Choose the teacher you want to evaluate
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search teachers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredTeachers.map((teacher) => (
                <div
                  key={teacher.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedTeacher === teacher.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted'
                  }`}
                  onClick={() => setSelectedTeacher(teacher.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {teacher.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium">{teacher.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {teacher.subject || 'Not specified'} • Grade {teacher.gradeLevel || 'Not specified'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Evaluation Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Evaluation Settings
            </CardTitle>
            <CardDescription>
              Configure the evaluation parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Evaluation Type</label>
              <div className="mt-2 space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    value="FORMATIVE"
                    checked={evaluationType === 'FORMATIVE'}
                    onChange={(e) => setEvaluationType(e.target.value)}
                    className="text-primary"
                  />
                  <div>
                    <div className="font-medium">Formative</div>
                    <div className="text-sm text-muted-foreground">
                      Ongoing assessment for growth and development
                    </div>
                  </div>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    value="SUMMATIVE"
                    checked={evaluationType === 'SUMMATIVE'}
                    onChange={(e) => setEvaluationType(e.target.value)}
                    className="text-primary"
                  />
                  <div>
                    <div className="font-medium">Summative</div>
                    <div className="text-sm text-muted-foreground">
                      End-of-period comprehensive assessment
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">School Year</label>
              <select
                value={schoolYear}
                onChange={(e) => setSchoolYear(e.target.value)}
                className="w-full mt-1 p-2 pr-8 border rounded-md"
              >
                <option value="2024-2025">2024-2025</option>
                <option value="2023-2024">2023-2024</option>
                <option value="2022-2023">2022-2023</option>
              </select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generate Button */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold">Ready to Generate Evaluation</h3>
              <p className="text-sm text-muted-foreground">
                {selectedTeacher 
                  ? `Generate a ${evaluationType.toLowerCase()} evaluation for ${teachers.find(t => t.id === selectedTeacher)?.name || 'Selected Teacher'}`
                  : 'Select a teacher to continue'
                }
              </p>
            </div>
            <Button
              onClick={handleGenerateEvaluation}
              disabled={!selectedTeacher}
              variant="default"
              size="lg"
              className={`${selectedTeacher ? '' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
            >
              <Sparkles className="mr-2 h-5 w-5" />
              {selectedTeacher ? 'Generate Evaluation' : 'Select a Teacher First'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

import { mockTeachers } from '@/lib/data/mock-data'

const teachers = mockTeachers 