"use client"

import { useEffect, useMemo, useState, useRef } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Calendar, Clock, Binoculars, User, Edit, Trash2, Upload } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export interface ObservationItem {
  id: string
  teacher: {
    id: string
    name: string
    subject: string
    gradeLevel: string
  }
  observer: {
    id: string
    name: string
  }
  date: string
  duration: number | null
  observationType: string
  focusAreas: string[]
  rawNotes: string
  enhancedNotes?: string | null
  // Local-only flag used to mark drafts saved on this device
  isDraft?: boolean
}

type LocalDraft = {
  id: string | number
  teacherId?: string
  teacher?: {
    id: string
    name: string
    subject: string
    gradeLevel: string
  }
  observer?: { id: string; name: string }
  date?: string
  duration?: number
  observationType?: string
  focusAreas?: string[]
  rawNotes?: string
  enhancedNotes?: string | null
}

interface Props {
  initial: ObservationItem[]
}

export function ObservationsListClient({ initial }: Props) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedObserver, setSelectedObserver] = useState('all')
  const [selectedTeacher, setSelectedTeacher] = useState('all')
  const [observations, setObservations] = useState<ObservationItem[]>(initial)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editNotes, setEditNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveToast, setSaveToast] = useState<'idle' | 'ok' | 'error'>('idle')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<null | { createdCount: number; errors?: Array<{ row: number; error: string }> }>(null)
  const [selectedFileName, setSelectedFileName] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    // Merge server observations with local drafts from localStorage
    try {
      const draftsRaw = typeof window !== 'undefined' ? localStorage.getItem('observationDrafts') : null
      const parsed = draftsRaw ? JSON.parse(draftsRaw) as unknown : undefined
      const drafts: LocalDraft[] = Array.isArray(parsed) ? (parsed as LocalDraft[]) : []
      const normalizedDrafts: ObservationItem[] = drafts.map((d: LocalDraft) => {
        const teacherId = typeof d.teacher?.id === 'string' && d.teacher.id.length > 0
          ? d.teacher.id
          : (typeof d.teacherId === 'string' && d.teacherId.length > 0
            ? d.teacherId
            : `draft-teacher-${d.id}`)
        const teacherName = typeof d.teacher?.name === 'string' && d.teacher.name.length > 0
          ? d.teacher.name
          : 'Unknown Teacher'
        const teacherSubject = typeof d.teacher?.subject === 'string' ? d.teacher.subject : ''
        const teacherGrade = typeof d.teacher?.gradeLevel === 'string' ? d.teacher.gradeLevel : ''

        return {
          id: `draft-${d.id}`,
          teacher: { id: teacherId, name: teacherName, subject: teacherSubject, gradeLevel: teacherGrade },
          observer: d.observer ?? { id: 'me', name: 'You' },
          date: typeof d.date === 'string' ? d.date : new Date().toISOString(),
          duration: typeof d.duration === 'number' ? d.duration : null,
          observationType: d.observationType ?? 'INFORMAL',
          focusAreas: Array.isArray(d.focusAreas) ? d.focusAreas : [],
          rawNotes: d.rawNotes ?? '',
          enhancedNotes: d.enhancedNotes ?? null,
          isDraft: true,
        }
      })
      const merged = [...normalizedDrafts, ...initial]
      // Sort by date desc, drafts first when same date
      merged.sort((a, b) => {
        const da = new Date(a.date).getTime()
        const db = new Date(b.date).getTime()
        if (db !== da) return db - da
        if ((a.isDraft ? 1 : 0) !== (b.isDraft ? 1 : 0)) return (b.isDraft ? 1 : 0) - (a.isDraft ? 1 : 0)
        return 0
      })
      setObservations(merged)
    } catch {
      setObservations(initial)
    }
  }, [initial])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mql = window.matchMedia('(max-width: 767px)')
    const enforce = (matches: boolean) => { if (matches) setViewMode('grid') }
    enforce(mql.matches)
    const listener = (e: MediaQueryListEvent) => enforce(e.matches)
    mql.addEventListener('change', listener)
    return () => mql.removeEventListener('change', listener)
  }, [])

  const filtered = useMemo(() => {
    let result = observations
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter((o) => {
        const teacherName = (o.teacher?.name ?? '').toLowerCase()
        const teacherSubject = (o.teacher?.subject ?? '').toLowerCase()
        const notes = (o.rawNotes ?? '').toLowerCase()
        const enhanced = (o.enhancedNotes ?? '').toLowerCase()
        const observerName = (o.observer?.name ?? '').toLowerCase()
        return (
          teacherName.includes(term) ||
          teacherSubject.includes(term) ||
          observerName.includes(term) ||
          notes.includes(term) ||
          enhanced.includes(term)
        )
      })
    }
    if (selectedType !== 'all') {
      result = result.filter((o) => o.observationType === selectedType)
    }
    if (selectedObserver !== 'all') {
      result = result.filter((o) => o.observer.id === selectedObserver)
    }
    if (selectedTeacher !== 'all') {
      result = result.filter((o) => o.teacher?.id === selectedTeacher)
    }
    return result
  }, [observations, searchTerm, selectedType, selectedObserver, selectedTeacher])

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  // Removed text preview in grid view; keep only focus area chips

  const handleEdit = (observation: ObservationItem) => {
    setEditingId(observation.id)
    setEditNotes(observation.rawNotes)
  }

  const handleSaveEdit = async (observationId: string) => {
    setIsSaving(true)
    try {
      // Edit local draft without hitting API
      if (observationId.startsWith('draft-')) {
        const id = observationId.replace('draft-', '')
        try {
          const draftsRaw = localStorage.getItem('observationDrafts')
          const parsed = draftsRaw ? JSON.parse(draftsRaw) as unknown : undefined
          const drafts: LocalDraft[] = Array.isArray(parsed) ? (parsed as LocalDraft[]) : []
          const nextDrafts = drafts.map((d: LocalDraft) => String(d.id) === id ? { ...d, rawNotes: editNotes } : d)
          localStorage.setItem('observationDrafts', JSON.stringify(nextDrafts))
        } catch {}
        setObservations(prev => prev.map(obs => obs.id === observationId ? { ...obs, rawNotes: editNotes } : obs))
        setEditingId(null)
        setEditNotes('')
        return
      }

      const response = await fetch(`/api/observations/${observationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rawNotes: editNotes,
        }),
      })

      if (response.ok) {
        setObservations(prev => 
          prev.map(obs => 
            obs.id === observationId 
              ? { ...obs, rawNotes: editNotes }
              : obs
          )
        )
        setEditingId(null)
        setEditNotes('')
        setSaveToast('ok')
        setTimeout(() => setSaveToast('idle'), 2000)
      } else {
        console.error('Failed to update observation')
        setSaveToast('error')
        setTimeout(() => setSaveToast('idle'), 2500)
      }
    } catch (error) {
      console.error('Error updating observation:', error)
      setSaveToast('error')
      setTimeout(() => setSaveToast('idle'), 2500)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditNotes('')
  }

  const handleDelete = async (observationId: string) => {
    // Handle local drafts vs server observations
    if (observationId.startsWith('draft-')) {
      try {
        const draftsRaw = localStorage.getItem('observationDrafts')
        const parsed = draftsRaw ? JSON.parse(draftsRaw) as unknown : undefined
        const drafts: LocalDraft[] = Array.isArray(parsed) ? (parsed as LocalDraft[]) : []
        const id = observationId.replace('draft-', '')
        const nextDrafts = drafts.filter((d: LocalDraft) => String(d.id) !== id)
        localStorage.setItem('observationDrafts', JSON.stringify(nextDrafts))
        setObservations(prev => prev.filter(obs => obs.id !== observationId))
        setDeleteConfirmId(null)
      } catch (e) {
        console.error('Failed to delete local draft', e)
      }
      return
    }

    try {
      const response = await fetch(`/api/observations/${observationId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setObservations(prev => prev.filter(obs => obs.id !== observationId))
        setDeleteConfirmId(null)
      } else {
        console.error('Failed to delete observation')
      }
    } catch (error) {
      console.error('Error deleting observation:', error)
    }
  }

  return (
    <div className="space-y-6">
      {saveToast === 'ok' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="px-4 py-2 rounded-md bg-emerald-600 text-white shadow">Saved</div>
        </div>
      )}
      {saveToast === 'error' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="px-4 py-2 rounded-md bg-rose-600 text-white shadow">Save failed</div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Observations</h1>
          <p className="text-muted-foreground">View and manage classroom observations with AI-enhanced feedback.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsImporting(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          <Button asChild>
            <Link href="/dashboard/observations/new">New Observation</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Input placeholder="Search observations..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="flex gap-2 items-center flex-wrap">
              <div className="relative inline-flex items-center">
                <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="px-3 py-2 pr-10 border rounded-md bg-background appearance-none">
                  <option value="all">All Types</option>
                  <option value="FORMAL">Formal</option>
                  <option value="INFORMAL">Informal</option>
                  <option value="WALKTHROUGH">Walkthrough</option>
                  <option value="OTHER">Other</option>
                </select>
                <span className="pointer-events-none absolute right-3 text-muted-foreground">
                  {/* simple chevron svg to avoid importing */}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </span>
              </div>
              <div className="relative inline-flex items-center">
                <select value={selectedTeacher} onChange={(e) => setSelectedTeacher(e.target.value)} className="px-3 py-2 pr-10 border rounded-md bg-background appearance-none">
                  <option value="all">All Teachers</option>
                  {[...new Map(observations.map(o => [o.teacher.id, o.teacher])).values()]
                    .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                    .map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                </select>
                <span className="pointer-events-none absolute right-3 text-muted-foreground">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </span>
              </div>
              <div className="relative inline-flex items-center">
                <select value={selectedObserver} onChange={(e) => setSelectedObserver(e.target.value)} className="px-3 py-2 pr-10 border rounded-md bg-background appearance-none">
                  <option value="all">All Observers</option>
                  {[...new Map(observations.map(o => [o.observer.id, o.observer])).values()].map((obs) => (
                    <option key={obs.id} value={obs.id}>{obs.name}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 text-muted-foreground">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </span>
              </div>
              <div className="hidden md:flex rounded-md overflow-hidden border">
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
          {filtered.map((observation) => (
            <Card key={observation.id} className="h-full">
              <div className="flex h-full flex-col">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
                        {observation.teacher.name.charAt(0)}
                      </div>
                      <div>
                        <CardTitle className="text-base leading-tight">{observation.teacher.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {observation.teacher.subject} • Grade {observation.teacher.gradeLevel}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div>
                        {observation.isDraft && (
                          <Badge className="bg-slate-100 text-slate-700 border-slate-200 mr-1">Saved</Badge>
                        )}
                        {observation.observationType === 'FORMAL' && (
                          <Badge className="bg-blue-100 text-blue-700 border-blue-200">Formal</Badge>
                        )}
                        {observation.observationType === 'INFORMAL' && (
                          <Badge className="bg-amber-100 text-amber-700 border-amber-200">Informal</Badge>
                        )}
                        {observation.observationType === 'WALKTHROUGH' && (
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Walkthrough</Badge>
                        )}
                        {observation.observationType === 'OTHER' && (
                          <Badge className="bg-slate-100 text-slate-700 border-slate-200">Other</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{formatDate(observation.date)}</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(observation.date)}
                    </div>
                    {observation.duration ? (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {observation.duration} minutes
                      </div>
                    ) : null}
                    {/* Support legacy observations that may have subject at root */}
                    {typeof (observation as unknown as { subject?: string }).subject === 'string' && (observation as unknown as { subject?: string }).subject ? (
                      <div className="flex items-center gap-1">
                        {(/* subject icon inline to avoid new import */
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5"><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22h11a2.5 2.5 0 0 0 2.5-2.5V7.75A2.75 2.75 0 0 0 17.25 5H7A3 3 0 0 0 4 8v11.5Zm3.5-14h9.75c.69 0 1.25.56 1.25 1.25V19.5c0 .69-.56 1.25-1.25 1.25h-11A1.25 1.25 0 0 1 5 19.5V8c0-1.1.9-2 2-2Zm.75 4.25c0-.41.34-.75.75-.75h6a.75.75 0 1 1 0 1.5h-6a.75.75 0 0 1-.75-.75Zm0 3c0-.41.34-.75.75-.75h6a.75.75 0 1 1 0 1.5h-6a.75.75 0 0 1-.75-.75Z"/></svg>
                        )}
                        {(observation as unknown as { subject?: string }).subject}
                      </div>
                    ) : null}
                    <div className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      {observation.observer.name}
                    </div>
                  </div>
                  {editingId === observation.id ? (
                    <div className="space-y-3">
                      <Textarea
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        placeholder="Edit observation notes..."
                        className="min-h-[100px]"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleSaveEdit(observation.id)} disabled={isSaving}>
                          {isSaving ? 'Saving...' : 'Save'}
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancelEdit} disabled={isSaving}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    (Array.isArray(observation.focusAreas) && observation.focusAreas.filter(a => typeof a === 'string' && a.trim() && a.trim() !== '[]').length > 0) ? (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {observation.focusAreas
                          .filter((area) => typeof area === 'string' && area.trim() && area.trim() !== '[]')
                          .map((area) => (
                          <span key={area} className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                            {area}
                          </span>
                        ))}
                      </div>
                    ) : null
                  )}
                </CardContent>
                <div className="mt-auto flex items-center justify-between px-6 pb-5">
                  <Button variant="ghost" size="icon" asChild aria-label="View details" title="View details">
                    <Link href={`/dashboard/observations/${observation.id}`}>
                      <Binoculars className="h-4 w-4" />
                    </Link>
                  </Button>
                  <div className="flex gap-1.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(observation)}
                      aria-label="Edit observation"
                      title="Edit observation"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => setDeleteConfirmId(observation.id)}
                      aria-label="Delete observation"
                      title="Delete observation"
                    >
                      <Trash2 className="h-4 w-4" />
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
                <th className="text-left px-3 py-2">Date</th>
                <th className="text-left px-3 py-2">Duration</th>
                <th className="text-left px-3 py-2">Observer</th>
                <th className="text-left px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((observation) => (
                <tr key={observation.id} className="border-t">
                  <td className="px-3 py-2">
                    <div className="font-medium">{observation.teacher.name}</div>
                    <div className="text-muted-foreground">{observation.teacher.subject} • Grade {observation.teacher.gradeLevel}</div>
                  </td>
                  <td className="px-3 py-2">
                    {observation.isDraft && (
                      <Badge className="bg-slate-100 text-slate-700 border-slate-200 mr-1">Saved</Badge>
                    )}
                    {observation.observationType === 'FORMAL' && (
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200">Formal</Badge>
                    )}
                    {observation.observationType === 'INFORMAL' && (
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200">Informal</Badge>
                    )}
                    {observation.observationType === 'WALKTHROUGH' && (
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Walkthrough</Badge>
                    )}
                    {observation.observationType === 'OTHER' && (
                      <Badge className="bg-slate-100 text-slate-700 border-slate-200">Other</Badge>
                    )}
                  </td>
                  <td className="px-3 py-2">{formatDate(observation.date)}</td>
                  <td className="px-3 py-2">{observation.duration ?? '—'}</td>
                  <td className="px-3 py-2">{observation.observer.name}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/observations/${observation.id}`}>View</Link>
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(observation)}>Edit</Button>
                      <Button variant="outline" size="sm" className="text-destructive" onClick={() => setDeleteConfirmId(observation.id)}>Delete</Button>
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
              <Binoculars className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No observations found</h3>
            <p className="text-muted-foreground mb-4">Try adjusting your search or filters.</p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => { setSearchTerm(''); setSelectedType('all'); setSelectedObserver('all'); setSelectedTeacher('all') }}>Clear filters</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Modal */}
      {isImporting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Import Observations from CSV</CardTitle>
                  <CardDescription>Columns: teacherEmail (or teacherName), date, observationType, duration, focusAreas, rawNotes. Use semicolons for multiple focus areas.</CardDescription>
                </div>
                <button className="text-sm underline" onClick={() => { setIsImporting(false); setImportResult(null); setSelectedFileName('') }}>Close</button>
              </div>
            </CardHeader>
            <CardContent>
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
                      const res = await fetch('/api/observations/bulk', { method: 'POST', body: form })
                      const data = await res.json()
                      if (!res.ok) {
                        setImportResult({ createdCount: 0, errors: [{ row: 0, error: data?.error || 'Import failed' }] })
                        return
                      }
                      setImportResult(data)
                      // Refresh list
                      const refreshed = await fetch('/api/observations', { cache: 'no-store' })
                      if (refreshed.ok) {
                        const json = await refreshed.json() as Array<ObservationItem>
                        setObservations(json.map((o) => ({ ...o, date: typeof o.date === 'string' ? o.date : new Date(String((o as unknown as { date: string | number | Date }).date)).toISOString() })))
                      }
                    } catch {
                      setImportResult({ createdCount: 0, errors: [{ row: 0, error: 'Network error' }] })
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
                  href={`data:text/csv;charset=utf-8,${encodeURIComponent('teacherEmail,teacherName,date,observationType,duration,focusAreas,rawNotes\njane@example.com,Jane Doe,2025-09-01,FORMAL,45,Classroom Management;SEL,Observed whole-group lesson with strong routines.\n,,2025-09-05,INFORMAL,20,Technology,Informal check-in during centers; noted effective tablet use.')}`}
                  download="observations-template.csv"
                  className="text-sm underline"
                >
                  Download template
                </a>
              </div>
              {importResult && (
                <div className="mt-3 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">Created: {importResult.createdCount}</span>
                    {importResult.errors && importResult.errors.length > 0 && (
                      <span className="px-2 py-1 rounded bg-amber-50 text-amber-900 border border-amber-200">{importResult.errors.length} row(s) had issues</span>
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
                  {importResult.createdCount === 0 && importResult.errors && importResult.errors.length > 0 && (
                    <div className="mt-2 text-rose-700">No rows were imported due to errors.</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-destructive">Delete Observation</CardTitle>
              <CardDescription>
                Are you sure you want to delete this observation? This action cannot be undone.
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


