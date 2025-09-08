"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Calendar, Clock, Binoculars, User, Edit, Trash2 } from 'lucide-react'
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

interface Props {
  initial: ObservationItem[]
}

export function ObservationsListClient({ initial }: Props) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedObserver, setSelectedObserver] = useState('all')
  const [observations, setObservations] = useState<ObservationItem[]>(initial)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editNotes, setEditNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  useEffect(() => {
    // Merge server observations with local drafts from localStorage
    try {
      const draftsRaw = typeof window !== 'undefined' ? localStorage.getItem('observationDrafts') : null
      const drafts = draftsRaw ? JSON.parse(draftsRaw) : []
      const normalizedDrafts: ObservationItem[] = drafts.map((d: any) => ({
        id: `draft-${d.id}`,
        teacher: d.teacher ?? { id: d.teacherId, name: 'Unknown Teacher', subject: '', gradeLevel: '' },
        observer: d.observer ?? { id: 'me', name: 'You' },
        date: typeof d.date === 'string' ? d.date : new Date().toISOString(),
        duration: typeof d.duration === 'number' ? d.duration : null,
        observationType: d.observationType ?? 'INFORMAL',
        focusAreas: Array.isArray(d.focusAreas) ? d.focusAreas : [],
        rawNotes: d.rawNotes ?? '',
        enhancedNotes: d.enhancedNotes ?? null,
        isDraft: true,
      }))
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
      result = result.filter((o) =>
        o.teacher.name.toLowerCase().includes(term) ||
        o.teacher.subject.toLowerCase().includes(term) ||
        o.rawNotes.toLowerCase().includes(term)
      )
    }
    if (selectedType !== 'all') {
      result = result.filter((o) => o.observationType === selectedType)
    }
    if (selectedObserver !== 'all') {
      result = result.filter((o) => o.observer.id === selectedObserver)
    }
    return result
  }, [observations, searchTerm, selectedType, selectedObserver])

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const getSummary = (o: ObservationItem) => {
    if (o.enhancedNotes) return o.enhancedNotes.split('\n\n')[0].replace(/\*\*/g, '').slice(0, 150) + '...'
    return o.rawNotes.slice(0, 150) + '...'
  }

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
          const drafts = draftsRaw ? JSON.parse(draftsRaw) : []
          const nextDrafts = drafts.map((d: any) => String(d.id) === id ? { ...d, rawNotes: editNotes } : d)
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
      } else {
        console.error('Failed to update observation')
      }
    } catch (error) {
      console.error('Error updating observation:', error)
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
        const drafts = draftsRaw ? JSON.parse(draftsRaw) : []
        const id = observationId.replace('draft-', '')
        const nextDrafts = drafts.filter((d: any) => String(d.id) !== id)
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Observations</h1>
          <p className="text-muted-foreground">View and manage classroom observations with AI-enhanced feedback.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/observations/new">New Observation</Link>
        </Button>
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
              <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="px-3 py-2 border rounded-md bg-background">
                <option value="all">All Types</option>
                <option value="FORMAL">Formal</option>
                <option value="INFORMAL">Informal</option>
                <option value="WALKTHROUGH">Walkthrough</option>
              </select>
              <select value={selectedObserver} onChange={(e) => setSelectedObserver(e.target.value)} className="px-3 py-2 border rounded-md bg-background">
                <option value="all">All Observers</option>
                {[...new Map(observations.map(o => [o.observer.id, o.observer])).values()].map((obs) => (
                  <option key={obs.id} value={obs.id}>{obs.name}</option>
                ))}
              </select>
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
                    <>
                      <div className="text-sm mb-3">
                        <p className="line-clamp-3 text-muted-foreground">{getSummary(observation)}</p>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {observation.focusAreas.map((area) => (
                          <span key={area} className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                            {area}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
                <div className="mt-auto flex items-center justify-between px-6 pb-5">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/observations/${observation.id}`}>
                      <Binoculars className="mr-2 h-4 w-4" />
                      View Details
                    </Link>
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(observation)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive" onClick={() => setDeleteConfirmId(observation.id)}>
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
              <Button variant="outline" onClick={() => { setSearchTerm(''); setSelectedType('all') }}>Clear filters</Button>
            </div>
          </CardContent>
        </Card>
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


