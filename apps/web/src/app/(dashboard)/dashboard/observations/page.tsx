'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Eye, Calendar, Clock, User } from 'lucide-react'
import Link from 'next/link'

interface Observation {
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
  duration: number
  observationType: string
  focusAreas: string[]
  rawNotes: string
  enhancedNotes?: string
  artifacts: Array<{
    id: string
    fileName: string
    fileType: string
  }>
}

export default function ObservationsPage() {
  const [observations, setObservations] = useState<Observation[]>([])
  const [filteredObservations, setFilteredObservations] = useState<Observation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')

  // Fetch observations from API
  useEffect(() => {
    const fetchObservations = async () => {
      try {
        const response = await fetch('/api/observations?schoolId=demo-school-1')
        if (response.ok) {
          const data = await response.json()
          setObservations(data)
          setFilteredObservations(data)
        } else {
          console.error('Failed to fetch observations')
        }
      } catch (error) {
        console.error('Error fetching observations:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchObservations()
  }, [])

  // Filter observations based on search and filters
  useEffect(() => {
    let filtered = observations

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(observation =>
        observation.teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        observation.teacher.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        observation.rawNotes.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(observation => observation.observationType === selectedType)
    }

    setFilteredObservations(filtered)
  }, [observations, searchTerm, selectedType])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getObservationSummary = (observation: Observation) => {
    if (observation.enhancedNotes) {
      // Extract first paragraph from enhanced notes
      const firstParagraph = observation.enhancedNotes.split('\n\n')[0]
      return firstParagraph.replace(/\*\*/g, '').substring(0, 150) + '...'
    }
    return observation.rawNotes.substring(0, 150) + '...'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading observations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Observations</h1>
          <p className="text-muted-foreground">
            View and manage classroom observations with AI-enhanced feedback.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/observations/new">
            <Plus className="mr-2 h-4 w-4" />
            New Observation
          </Link>
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
                  placeholder="Search observations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
              >
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
        {filteredObservations.map((observation) => (
          <Card key={observation.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {observation.teacher.name.charAt(0)}
                    </span>
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
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {observation.duration} minutes
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {observation.observer.name}
                  </div>
                </div>
                
                <div className="text-sm">
                  <p className="line-clamp-3 text-muted-foreground">
                    {getObservationSummary(observation)}
                  </p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex gap-1 flex-wrap">
                    {observation.focusAreas.map((area) => (
                      <span
                        key={area}
                        className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/observations/${observation.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/observations/${observation.id}/edit`}>
                        Edit
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredObservations.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
              <Eye className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {observations.length === 0 ? 'No observations yet' : 'No observations found'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {observations.length === 0 
                ? 'Start by conducting your first classroom observation.'
                : 'Try adjusting your search or filters to find what you\'re looking for.'
              }
            </p>
            <div className="flex gap-2 justify-center">
              {observations.length === 0 && (
                <Button asChild>
                  <Link href="/dashboard/observations/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Observation
                  </Link>
                </Button>
              )}
              {observations.length > 0 && (
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedType('all')
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 