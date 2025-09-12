'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  Mail, 
  Plus,
  Search,
  MoreHorizontal,
  Upload
} from 'lucide-react'
import Link from 'next/link'

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
  onAddTeacher?: () => void
}

export function TeacherList({ onAddTeacher }: TeacherListProps) {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('all')
  const [selectedGrade, setSelectedGrade] = useState('all')
  const [selectedTag, setSelectedTag] = useState<string>('')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<null | { createdCount: number; updatedCount: number; errors?: Array<{ row: number; error: string }> }>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [selectedFileName, setSelectedFileName] = useState<string>('')

  // Fetch teachers from API
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const response = await fetch('/api/teachers')
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

    // Tag filter (strengths or growth areas)
    if (selectedTag) {
      filtered = filtered.filter(teacher =>
        (teacher.strengths || []).includes(selectedTag) ||
        (teacher.growthAreas || []).includes(selectedTag)
      )
    }

    setFilteredTeachers(filtered)
  }, [teachers, searchTerm, selectedSubject, selectedGrade, selectedTag])

  // Enforce grid view on mobile and hide toggle
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mql = window.matchMedia('(max-width: 767px)')
    const enforce = (matches: boolean) => { if (matches) setViewMode('grid') }
    enforce(mql.matches)
    const listener = (e: MediaQueryListEvent) => enforce(e.matches)
    mql.addEventListener('change', listener)
    return () => mql.removeEventListener('change', listener)
  }, [])

  const getUniqueSubjects = () => {
    const subjects = teachers.map(t => t.subject).filter(Boolean) as string[]
    return [...new Set(subjects)]
  }

  const getUniqueGrades = () => {
    const grades = teachers.map(t => t.gradeLevel).filter(Boolean) as string[]
    return [...new Set(grades)].sort()
  }

  // neutral tag appearance for a cleaner look; clickable to filter

  const strengthColorClasses = [
    'bg-blue-100 text-blue-700 border-blue-200',
    'bg-emerald-100 text-emerald-700 border-emerald-200',
    'bg-amber-100 text-amber-800 border-amber-200',
    'bg-purple-100 text-purple-700 border-purple-200',
    'bg-rose-100 text-rose-700 border-rose-200',
    'bg-cyan-100 text-cyan-700 border-cyan-200',
    'bg-indigo-100 text-indigo-700 border-indigo-200',
    'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
    'bg-teal-100 text-teal-700 border-teal-200',
    'bg-sky-100 text-sky-700 border-sky-200',
  ] as const

  const getStrengthClasses = (label: string) => {
    let hash = 0
    for (let i = 0; i < label.length; i++) hash = (hash * 31 + label.charCodeAt(i)) >>> 0
    const idx = hash % strengthColorClasses.length
    return strengthColorClasses[idx]
  }

  const getEvaluationStatus = (teacher: Teacher) => {
    const recentEvaluation = teacher.evaluations[0]
    if (!recentEvaluation) return 'No feedback'
    
    switch (recentEvaluation.status) {
      case 'SUBMITTED':
        return 'Feedback submitted'
      case 'DRAFT':
        return 'Draft feedback'
      case 'ACKNOWLEDGED':
        return 'Feedback acknowledged'
      default:
        return 'Feedback pending'
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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold">Teachers</h2>
          <p className="text-muted-foreground">
            {filteredTeachers.length} of {teachers.length} teachers
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onAddTeacher ? (
            <Button onClick={onAddTeacher}>
              <Plus className="mr-2 h-4 w-4" />
              Add Teacher
            </Button>
          ) : (
            <Button asChild>
              <Link href="/dashboard/teachers/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Teacher
              </Link>
            </Button>
          )}
          <Button variant="outline" onClick={() => setIsImporting(true)} disabled={isImporting}>
            Import CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 min-w-0">
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
            
            <div className="flex flex-wrap gap-2 items-center">
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
              <div className="hidden md:flex rounded-md overflow-hidden border ml-auto">
                <button
                  type="button"
                  className={`px-3 py-2 text-sm ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
                  onClick={() => setViewMode('grid')}
                >
                  Grid
                </button>
                <button
                  type="button"
                  className={`px-3 py-2 text-sm ${viewMode === 'table' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
                  onClick={() => setViewMode('table')}
                >
                  Table
                </button>
              </div>
              {selectedTag && (
                <div className="flex items-center gap-2 ml-2 text-sm">
                  <Badge variant="secondary" className="text-xs">{selectedTag}</Badge>
                  <button
                    type="button"
                    className="underline text-muted-foreground"
                    onClick={() => setSelectedTag('')}
                  >
                    Clear tag
                  </button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {viewMode === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTeachers.map((teacher) => (
            <a href={`/dashboard/teachers/${teacher.id}`} key={teacher.id} className="block">
              <Card 
                className="hover:shadow-lg hover:bg-blue-100/10 transition-shadow cursor-pointer"
              >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100/50 rounded-full border-indigo-500 flex items-center justify-center border">
                      <User className="h-4 w-4 text-indigo-500" />
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
              
              <CardContent className="space-y-8">
                {teacher.email && (
                  <div className="flex items-center gap-2 text-sm text-blue-500">
                    <Mail className="h-3 w-3" />
                    <span>{teacher.email}</span>
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-1">Strengths</h4>
                  <div className="flex flex-wrap gap-1">
                    {teacher.strengths.slice(0, 3).map((strength, index) => (
                      <Badge
                        key={index}
                        className={`text-xs cursor-pointer border ${getStrengthClasses(strength)}`}
                        onClick={(e) => {
                          e.preventDefault()
                          setSelectedTag(strength)
                        }}
                      >
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
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-1">Growth Areas</h4>
                  <div className="flex flex-wrap gap-1">
                    {teacher.growthAreas.slice(0, 3).map((area, index) => (
                      <Badge
                        key={index}
                        className={`text-xs cursor-pointer border ${getStrengthClasses(area)}`}
                        onClick={(e) => {
                          e.preventDefault()
                          setSelectedTag(area)
                        }}
                      >
                        {area}
                      </Badge>
                    ))}
                    {teacher.growthAreas.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{teacher.growthAreas.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-1">Current Goals</h4>
                  {teacher.currentGoals.slice(0, 2).map((goal, index) => {
                    const barClass = goal.progress >= 80
                      ? 'bg-emerald-400'
                      : goal.progress >= 50
                        ? 'bg-amber-400'
                        : 'bg-rose-400'
                    const statusBadge = goal.progress >= 80
                      ? 'On track'
                      : goal.progress >= 50
                        ? 'Progressing'
                        : 'Needs attention'
                    const statusClass = goal.progress >= 80
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                      : goal.progress >= 50
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : 'bg-rose-100 text-rose-700 border-rose-200'
                    return (
                      <div key={index} className="mb-3">
                        <div className="flex items-center justify-between text-xs mb-1 gap-2">
                          <span className="truncate">{goal.goal}</span>
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <Badge className={`border ${statusClass}`}>{statusBadge}</Badge>
                            <span>{goal.progress}%</span>
                          </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className={`${barClass} h-2 rounded-full transition-all`}
                            style={{ width: `${goal.progress}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
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
            </a>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-3 py-2">Teacher</th>
                <th className="text-left px-3 py-2">Subject/Grade</th>
                <th className="text-left px-3 py-2">Email</th>
                <th className="text-left px-3 py-2">Strengths</th>
                <th className="text-left px-3 py-2">Growth Areas</th>
                <th className="text-left px-3 py-2">Activity</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.map((teacher) => (
                <tr key={teacher.id} className="border-t">
                  <td className="px-3 py-2">
                    <a href={`/dashboard/teachers/${teacher.id}`} className="hover:underline font-medium">{teacher.name}</a>
                  </td>
                  <td className="px-3 py-2">{teacher.subject || '—'} • Grade {teacher.gradeLevel || '—'}</td>
                  <td className="px-3 py-2">{teacher.email || '—'}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1 max-h-6 overflow-hidden">
                      {teacher.strengths.slice(0, 3).map((s, i) => (
                        <Badge key={`str-${i}`} className={`text-xs border ${getStrengthClasses(s)}`}>{s}</Badge>
                      ))}
                      {teacher.strengths.length > 3 && (
                        <Badge variant="outline" className="text-xs">+{teacher.strengths.length - 3} more</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1 max-h-6 overflow-hidden">
                      {teacher.growthAreas.slice(0, 3).map((g, i) => (
                        <Badge key={`gro-${i}`} className={`text-xs border ${getStrengthClasses(g)}`}>{g}</Badge>
                      ))}
                      {teacher.growthAreas.length > 3 && (
                        <Badge variant="outline" className="text-xs">+{teacher.growthAreas.length - 3} more</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {teacher.observations.length} obs • {teacher.evaluations.length} evals
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Import modal (simple inline) */}
      {isImporting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-lg border bg-background p-4 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Import Teachers from CSV</h3>
              <button className="text-sm underline" onClick={() => { setIsImporting(false); setImportResult(null) }}>Close</button>
            </div>
            <p className="text-sm text-muted-foreground mb-3">Columns: name, email, subject, gradeLevel, strengths, growthAreas. Header row required. Use semicolons for multiple values, e.g., &quot;Classroom Management;Technology&quot;.</p>
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  setSelectedFileName(file.name)
                  const form = new FormData()
                  form.append('file', file)
                  setImportResult(null)
                  try {
                    const res = await fetch('/api/teachers/bulk', { method: 'POST', body: form })
                    const data = await res.json()
                    if (!res.ok) {
                      setImportResult({ createdCount: 0, updatedCount: 0, errors: [{ row: 0, error: data?.error || 'Import failed' }] })
                      return
                    }
                    setImportResult(data)
                    // Refresh list
                    const refreshed = await fetch('/api/teachers')
                    if (refreshed.ok) {
                      const json = await refreshed.json()
                      setTeachers(json)
                      setFilteredTeachers(json)
                    }
                  } catch {
                    setImportResult({ createdCount: 0, updatedCount: 0, errors: [{ row: 0, error: 'Network error' }] })
                  }
                }}
              />
              <Button variant="ghost" type="button" onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Choose CSV
              </Button>
              {selectedFileName && (
                <span className="text-sm text-muted-foreground truncate max-w-[220px]" title={selectedFileName}>
                  {selectedFileName}
                </span>
              )}
              <a
                href={`data:text/csv;charset=utf-8,${encodeURIComponent('name,email,subject,gradeLevel,strengths,growthAreas\nJane Doe,jane@example.com,Math,6,Classroom Management;Differentiation,Technology;Assessment\nJohn Smith,john@example.com,Science,7,Collaboration,Behavior Management;SEL')}`}
                download="teachers-template.csv"
                className="text-sm underline"
              >
                Download template
              </a>
            </div>
            {importResult && (
              <div className="mt-3 text-sm">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">Created: {importResult.createdCount}</span>
                  <span className="px-2 py-1 rounded bg-amber-100 text-amber-800 border border-amber-200">Updated: {importResult.updatedCount}</span>
                  {importResult.errors && importResult.errors.length > 0 && (
                    <span className="px-2 py-1 rounded bg-amber-50 text-amber-900 border border-amber-200">
                      {importResult.errors.length} row(s) had issues
                    </span>
                  )}
                </div>
                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="mt-2 max-h-40 overflow-auto rounded border p-2 bg-amber-50/60 border-amber-200">
                    {importResult.errors.slice(0, 50).map((e, i) => (
                      <div key={i} className="text-amber-900">Row {e.row}: {e.error}</div>
                    ))}
                    {importResult.errors.length > 50 && (
                      <div className="text-muted-foreground">…and {importResult.errors.length - 50} more</div>
                    )}
                  </div>
                )}
                {importResult.createdCount === 0 && importResult.updatedCount === 0 && importResult.errors && importResult.errors.length > 0 && (
                  <div className="mt-2 text-rose-700">No rows were imported due to errors.</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {filteredTeachers.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No teachers found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search or filters to find what you&apos;re looking for.
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