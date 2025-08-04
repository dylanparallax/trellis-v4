'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  Mail, 
  BookOpen, 
  GraduationCap, 
  TrendingUp, 
  Target,
  Plus,
  Search,
  Filter,
  MoreHorizontal
} from 'lucide-react'

interface Teacher {
  id: string
  name: string
  email?: string
  subject?: string
  gradeLevel?: string
  strengths: string[]
  growthAreas: string[]
  currentGoals: Array<{ goal: string; progress: number }>
  observations: Array<{ id: string; date: string; type: string }>
  evaluations: Array<{ id: string; type: string; status: string }>
}

interface TeacherListProps {
  onTeacherSelect?: (teacher: Teacher) => void
  onAddTeacher?: () => void
}

export function TeacherList({ onTeacherSelect, onAddTeacher }: TeacherListProps) {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('all')
  const [selectedGrade, setSelectedGrade] = useState('all')

  // Fetch teachers from API
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const response = await fetch('/api/teachers?schoolId=demo-school-1')
        if (response.ok) {
          const data = await response.json()
          setTeachers(data)
          setFilteredTeachers(data)
        } else {
          console.error('Failed to fetch teachers')
        }
      } catch (error) {
        console.error('Error fetching teachers:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTeachers()
  }, [])

  // Filter teachers based on search and filters
  useEffect(() => {
    let filtered = teachers

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(teacher =>
        teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Subject filter
    if (selectedSubject !== 'all') {
      filtered = filtered.filter(teacher => teacher.subject === selectedSubject)
    }

    // Grade filter
    if (selectedGrade !== 'all') {
      filtered = filtered.filter(teacher => teacher.gradeLevel === selectedGrade)
    }

    setFilteredTeachers(filtered)
  }, [teachers, searchTerm, selectedSubject, selectedGrade])

  const getUniqueSubjects = () => {
    const subjects = teachers.map(t => t.subject).filter(Boolean) as string[]
    return [...new Set(subjects)]
  }

  const getUniqueGrades = () => {
    const grades = teachers.map(t => t.gradeLevel).filter(Boolean) as string[]
    return [...new Set(grades)].sort()
  }

  const getRecentObservations = (teacher: Teacher) => {
    return teacher.observations.slice(0, 3)
  }

  const getEvaluationStatus = (teacher: Teacher) => {
    const recentEvaluation = teacher.evaluations[0]
    if (!recentEvaluation) return 'No evaluations'
    
    switch (recentEvaluation.status) {
      case 'SUBMITTED':
        return 'Evaluation submitted'
      case 'DRAFT':
        return 'Draft evaluation'
      case 'ACKNOWLEDGED':
        return 'Evaluation acknowledged'
      default:
        return 'Evaluation pending'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading teachers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Teachers</h2>
          <p className="text-muted-foreground">
            {filteredTeachers.length} of {teachers.length} teachers
          </p>
        </div>
        <Button onClick={onAddTeacher} className="bg-gradient-to-r from-brand-blue to-brand-orange">
          <Plus className="mr-2 h-4 w-4" />
          Add Teacher
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search teachers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="all">All Subjects</option>
                {getUniqueSubjects().map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
              
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="all">All Grades</option>
                {getUniqueGrades().map(grade => (
                  <option key={grade} value={grade}>Grade {grade}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Teacher Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTeachers.map((teacher) => (
          <Card 
            key={teacher.id} 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onTeacherSelect?.(teacher)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-brand-blue to-brand-orange rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{teacher.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {teacher.subject} • Grade {teacher.gradeLevel}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Contact Info */}
              {teacher.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{teacher.email}</span>
                </div>
              )}

              {/* Strengths */}
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  Strengths
                </h4>
                <div className="flex flex-wrap gap-1">
                  {teacher.strengths.slice(0, 3).map((strength, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {strength}
                    </Badge>
                  ))}
                  {teacher.strengths.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{teacher.strengths.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>

              {/* Goals Progress */}
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  Current Goals
                </h4>
                {teacher.currentGoals.slice(0, 2).map((goal, index) => (
                  <div key={index} className="mb-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="truncate">{goal.goal}</span>
                      <span>{goal.progress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div 
                        className="bg-gradient-to-r from-brand-blue to-brand-orange h-1.5 rounded-full transition-all"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent Activity */}
              <div className="pt-2 border-t">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {teacher.observations.length} observations
                  </span>
                  <span>
                    {teacher.evaluations.length} evaluations
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {getEvaluationStatus(teacher)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTeachers.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No teachers found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search or filters to find what you're looking for.
            </p>
            <Button onClick={() => {
              setSearchTerm('')
              setSelectedSubject('all')
              setSelectedGrade('all')
            }}>
              Clear filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 