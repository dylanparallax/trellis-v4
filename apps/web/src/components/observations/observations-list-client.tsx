"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar, Clock, Binoculars, User } from 'lucide-react'

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
}

interface Props {
  initial: ObservationItem[]
}

export function ObservationsListClient({ initial }: Props) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [observations, setObservations] = useState<ObservationItem[]>(initial)

  useEffect(() => {
    setObservations(initial)
  }, [initial])

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
    return result
  }, [observations, searchTerm, selectedType])

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const getSummary = (o: ObservationItem) => {
    if (o.enhancedNotes) return o.enhancedNotes.split('\n\n')[0].replace(/\*\*/g, '').slice(0, 150) + '...'
    return o.rawNotes.slice(0, 150) + '...'
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
            <div className="flex gap-2">
              <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="px-3 py-2 border rounded-md bg-background">
                <option value="all">All Types</option>
                <option value="FORMAL">Formal</option>
                <option value="INFORMAL">Informal</option>
                <option value="WALKTHROUGH">Walkthrough</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filtered.map((observation) => (
          <Card key={observation.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">{observation.teacher.name.charAt(0)}</span>
                  </div>
                  <div>
                    <CardTitle className="text-lg">{observation.teacher.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <User className="h-3 w-3" />
                      {observation.teacher.subject} • Grade {observation.teacher.gradeLevel}
                    </CardDescription>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{observation.observationType}</div>
                  <div className="text-xs text-muted-foreground">{formatDate(observation.date)}</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(observation.date)}
                  </div>
                  {observation.duration ? (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {observation.duration} minutes
                    </div>
                  ) : null}
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {observation.observer.name}
                  </div>
                </div>
                <div className="text-sm">
                  <p className="line-clamp-3 text-muted-foreground">{getSummary(observation)}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1 flex-wrap">
                    {observation.focusAreas.map((area) => (
                      <span key={area} className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                        {area}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/observations/${observation.id}`}>
                        <Binoculars className="mr-2 h-4 w-4" />
                        View Details
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
    </div>
  )
}


