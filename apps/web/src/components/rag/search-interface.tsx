'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, Calendar, User, BookOpen, FileText, Sparkles, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { motion, AnimatePresence } from 'framer-motion'

interface SearchResult {
  id: string
  type: 'observation' | 'evaluation'
  score: number
  teacherName: string
  teacherId: string
  schoolId: string
  date: string
  title: string
  snippet: string
  metadata: {
    subject?: string
    gradeLevel?: string
    observationType?: string
    evaluationType?: string
    focusAreas?: string[]
  }
}

interface SearchResponse {
  results: SearchResult[]
  query: string
  totalResults: number
  scope: 'school' | 'district'
}

interface EmbeddingStats {
  observations: {
    total: number
    embedded: number
    percentage: number
  }
  evaluations: {
    total: number
    embedded: number
    percentage: number
  }
}

export function RAGSearchInterface() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<EmbeddingStats | null>(null)
  const [searchType, setSearchType] = useState<'both' | 'observation' | 'evaluation'>('both')
  const [minScore, setMinScore] = useState(0.7)
  const [limit, setLimit] = useState(20)
  const [scope, setScope] = useState<'school' | 'district'>('school')
  const [error, setError] = useState<string | null>(null)

  // Load initial stats
  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const response = await fetch('/api/rag/search')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        setScope(data.scope)
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const handleSearch = async () => {
    if (!query.trim()) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/rag/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'search',
          query: query.trim(),
          type: searchType,
          minScore,
          limit,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Search failed')
      }

      const data: SearchResponse = await response.json()
      setResults(data.results)
      setScope(data.scope)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Search failed')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSearch()
    }
  }

  const getTypeIcon = (type: string) => {
    return type === 'observation' ? <BookOpen className="h-4 w-4" /> : <FileText className="h-4 w-4" />
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.9) return 'bg-green-100 text-green-800 border-green-200'
    if (score >= 0.8) return 'bg-blue-100 text-blue-800 border-blue-200'
    if (score >= 0.7) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-gray-100 text-gray-800 border-gray-200'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-600" />
            RAG Knowledge Search
          </h2>
          <p className="text-muted-foreground">
            Search across {scope === 'district' ? 'all schools in your district' : 'your school'} observations and evaluations
          </p>
        </div>
        
        {stats && (
          <Card className="w-64">
            <CardContent className="pt-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Observations:</span>
                  <span className="font-medium">{stats.observations.embedded}/{stats.observations.total} ({stats.observations.percentage}%)</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Evaluations:</span>
                  <span className="font-medium">{stats.evaluations.embedded}/{stats.evaluations.total} ({stats.evaluations.percentage}%)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Search Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Semantic Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="space-y-2">
            <Label htmlFor="search-query">Search Query</Label>
            <Textarea
              id="search-query"
              placeholder="e.g., 'classroom management strategies for middle school', 'effective questioning techniques', 'student engagement in math lessons'..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="min-h-[80px] resize-none"
            />
          </div>

          {/* Search Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Content Type</Label>
              <Select value={searchType} onValueChange={(value: any) => setSearchType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">Both Observations & Evaluations</SelectItem>
                  <SelectItem value="observation">Observations Only</SelectItem>
                  <SelectItem value="evaluation">Evaluations Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Minimum Relevance</Label>
              <Select value={minScore.toString()} onValueChange={(value) => setMinScore(parseFloat(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.9">Very High (90%+)</SelectItem>
                  <SelectItem value="0.8">High (80%+)</SelectItem>
                  <SelectItem value="0.7">Medium (70%+)</SelectItem>
                  <SelectItem value="0.6">Low (60%+)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Max Results</Label>
              <Select value={limit.toString()} onValueChange={(value) => setLimit(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 results</SelectItem>
                  <SelectItem value="20">20 results</SelectItem>
                  <SelectItem value="30">30 results</SelectItem>
                  <SelectItem value="50">50 results</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Search Button */}
          <Button 
            onClick={handleSearch} 
            disabled={loading || !query.trim()}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Searching...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Search Knowledge Base
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Search Results ({results.length} found)
              </h3>
              <Badge variant="outline" className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {scope === 'district' ? 'District-wide' : 'School-wide'} Search
              </Badge>
            </div>

            <div className="grid gap-4">
              {results.map((result, index) => (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(result.type)}
                            <h4 className="font-medium">{result.title}</h4>
                          </div>
                          <Badge className={getScoreColor(result.score)}>
                            {Math.round(result.score * 100)}% match
                          </Badge>
                        </div>

                        {/* Metadata */}
                        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {result.teacherName}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(result.date).toLocaleDateString()}
                          </div>
                          {result.metadata.subject && (
                            <Badge variant="secondary" className="text-xs">
                              {result.metadata.subject}
                            </Badge>
                          )}
                          {result.metadata.gradeLevel && (
                            <Badge variant="secondary" className="text-xs">
                              Grade {result.metadata.gradeLevel}
                            </Badge>
                          )}
                        </div>

                        {/* Content Snippet */}
                        <p className="text-sm leading-relaxed bg-gray-50 p-3 rounded-md">
                          {result.snippet}
                        </p>

                        {/* Focus Areas */}
                        {result.metadata.focusAreas && result.metadata.focusAreas.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {result.metadata.focusAreas.map((area, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {area}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {!loading && results.length === 0 && query && (
        <Card className="text-center py-12">
          <CardContent>
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No results found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search query or lowering the minimum relevance threshold.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}