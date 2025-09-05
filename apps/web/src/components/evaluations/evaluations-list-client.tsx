"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Calendar, Clock, Award, User, Edit, Trash2, MessageSquare } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export interface EvaluationItem {
  id: string
  teacher: {
    id: string
    name: string
    subject: string
    gradeLevel: string
  }
  evaluator: {
    id: string
    name: string
  }
  type: string
  status: string
  summary: string
  content: Record<string, unknown>
  recommendations: string[]
  nextSteps: string[]
  scores: Record<string, unknown>
  submittedAt: string
  createdAt: string
  updatedAt: string
}

interface Props {
  initial: EvaluationItem[]
}

export function EvaluationsListClient({ initial }: Props) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [evaluations, setEvaluations] = useState<EvaluationItem[]>(initial)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editSummary, setEditSummary] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  useEffect(() => {
    setEvaluations(initial)
  }, [initial])

  const filtered = useMemo(() => {
    let result = evaluations
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter((e) =>
        e.teacher.name.toLowerCase().includes(term) ||
        e.teacher.subject.toLowerCase().includes(term) ||
        e.summary.toLowerCase().includes(term)
      )
    }
    if (selectedType !== 'all') {
      result = result.filter((e) => e.type === selectedType)
    }
    if (selectedStatus !== 'all') {
      result = result.filter((e) => e.status === selectedStatus)
    }
    return result
  }, [evaluations, searchTerm, selectedType, selectedStatus])

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const getSummary = (e: EvaluationItem) => {
    return e.summary.slice(0, 150) + (e.summary.length > 150 ? '...' : '')
  }

  const handleEdit = (evaluation: EvaluationItem) => {
    setEditingId(evaluation.id)
    setEditSummary(evaluation.summary)
  }

  const handleSaveEdit = async (evaluationId: string) => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/evaluations/${evaluationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: editSummary,
        }),
      })

      if (response.ok) {
        setEvaluations(prev => 
          prev.map(item => 
            item.id === evaluationId 
              ? { ...item, summary: editSummary }
              : item
          )
        )
        setEditingId(null)
        setEditSummary('')
      } else {
        console.error('Failed to update evaluation')
      }
    } catch (error) {
      console.error('Error updating evaluation:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditSummary('')
  }

  const handleDelete = async (evaluationId: string) => {
    try {
      const response = await fetch(`/api/evaluations/${evaluationId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setEvaluations(prev => prev.filter(item => item.id !== evaluationId))
        setDeleteConfirmId(null)
      } else {
        console.error('Failed to delete evaluation')
      }
    } catch (error) {
      console.error('Error deleting evaluation:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teacher Evaluations</h1>
          <p className="text-muted-foreground">View and manage AI-powered teacher evaluations.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/evaluations/new">New Evaluation</Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Input placeholder="Search evaluations..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                <Award className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="px-3 py-2 border rounded-md bg-background">
                <option value="all">All Types</option>
                <option value="FORMATIVE">Formative</option>
                <option value="SUMMATIVE">Summative</option>
                <option value="MID_YEAR">Mid-Year</option>
                <option value="END_YEAR">End-Year</option>
              </select>
              <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="px-3 py-2 border rounded-md bg-background">
                <option value="all">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="ACKNOWLEDGED">Acknowledged</option>
              </select>
              <div className="flex rounded-md overflow-hidden border">
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
            </div>
          </div>
        </CardContent>
      </Card>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((evaluation) => (
            <Card key={evaluation.id} className="h-full">
              <div className="flex h-full flex-col">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
                        {evaluation.teacher.name.charAt(0)}
                      </div>
                      <div>
                        <CardTitle className="text-base leading-tight">{evaluation.teacher.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {evaluation.teacher.subject} • Grade {evaluation.teacher.gradeLevel}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div>
                        {evaluation.type === 'FORMATIVE' && (
                          <Badge className="bg-blue-100 text-blue-700 border-blue-200">Formative</Badge>
                        )}
                        {evaluation.type === 'SUMMATIVE' && (
                          <Badge className="bg-purple-100 text-purple-700 border-purple-200">Summative</Badge>
                        )}
                        {evaluation.type === 'MID_YEAR' && (
                          <Badge className="bg-amber-100 text-amber-700 border-amber-200">Mid-Year</Badge>
                        )}
                        {evaluation.type === 'END_YEAR' && (
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">End-Year</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{formatDate(evaluation.submittedAt || evaluation.createdAt)}</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(evaluation.submittedAt || evaluation.createdAt)}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      {evaluation.evaluator.name}
                    </div>
                    <div className="flex items-center gap-2">
                      {evaluation.status === 'DRAFT' && (
                        <Badge className="bg-slate-100 text-slate-700 border-slate-200">Draft</Badge>
                      )}
                      {evaluation.status === 'SUBMITTED' && (
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200">Submitted</Badge>
                      )}
                      {evaluation.status === 'ACKNOWLEDGED' && (
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Acknowledged</Badge>
                      )}
                    </div>
                  </div>
                  {editingId === evaluation.id ? (
                    <div className="space-y-3">
                      <Textarea
                        value={editSummary}
                        onChange={(e) => setEditSummary(e.target.value)}
                        placeholder="Edit evaluation summary..."
                        className="min-h-[100px]"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleSaveEdit(evaluation.id)} disabled={isSaving}>
                          {isSaving ? 'Saving...' : 'Save'}
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancelEdit} disabled={isSaving}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="text-sm mb-3">
                        <p className="line-clamp-3 text-muted-foreground">{getSummary(evaluation)}</p>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {evaluation.recommendations.slice(0, 3).map((rec) => (
                          <span key={rec} className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                            {rec}
                          </span>
                        ))}
                        {evaluation.recommendations.length > 3 && (
                          <span className="px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded-full">
                            +{evaluation.recommendations.length - 3} more
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
                <div className="mt-auto flex items-center justify-between px-6 pb-5">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/evaluations/chat?teacherId=${evaluation.teacher.id}&evaluationType=${evaluation.type}`}>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      View Chat
                    </Link>
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(evaluation)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive" onClick={() => setDeleteConfirmId(evaluation.id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-3 py-2">Teacher</th>
                <th className="text-left px-3 py-2">Type</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-left px-3 py-2">Date</th>
                <th className="text-left px-3 py-2">Evaluator</th>
                <th className="text-left px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((evaluation) => (
                <tr key={evaluation.id} className="border-t">
                  <td className="px-3 py-2">
                    <div className="font-medium">{evaluation.teacher.name}</div>
                    <div className="text-muted-foreground">{evaluation.teacher.subject} • Grade {evaluation.teacher.gradeLevel}</div>
                  </td>
                  <td className="px-3 py-2">
                    {evaluation.type === 'FORMATIVE' && (
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200">Formative</Badge>
                    )}
                    {evaluation.type === 'SUMMATIVE' && (
                      <Badge className="bg-purple-100 text-purple-700 border-purple-200">Summative</Badge>
                    )}
                    {evaluation.type === 'MID_YEAR' && (
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200">Mid-Year</Badge>
                    )}
                    {evaluation.type === 'END_YEAR' && (
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">End-Year</Badge>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {evaluation.status === 'DRAFT' && (
                      <Badge className="bg-slate-100 text-slate-700 border-slate-200">Draft</Badge>
                    )}
                    {evaluation.status === 'SUBMITTED' && (
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200">Submitted</Badge>
                    )}
                    {evaluation.status === 'ACKNOWLEDGED' && (
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Acknowledged</Badge>
                    )}
                  </td>
                  <td className="px-3 py-2">{formatDate(evaluation.submittedAt || evaluation.createdAt)}</td>
                  <td className="px-3 py-2">{evaluation.evaluator.name}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/evaluations/chat?teacherId=${evaluation.teacher.id}&evaluationType=${evaluation.type}`}>View</Link>
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(evaluation)}>Edit</Button>
                      <Button variant="outline" size="sm" className="text-destructive" onClick={() => setDeleteConfirmId(evaluation.id)}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
              <Award className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No evaluations found</h3>
            <p className="text-muted-foreground mb-4">Try adjusting your search or filters.</p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => { setSearchTerm(''); setSelectedType('all'); setSelectedStatus('all') }}>Clear filters</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-destructive">Delete Evaluation</CardTitle>
              <CardDescription>
                Are you sure you want to delete this evaluation? This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setDeleteConfirmId(null)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => handleDelete(deleteConfirmId)}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
