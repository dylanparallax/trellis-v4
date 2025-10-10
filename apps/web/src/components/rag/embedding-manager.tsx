'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, Database, CheckCircle, AlertCircle, Play, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { motion } from 'framer-motion'

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

interface EmbeddingManagerProps {
  userRole: 'ADMIN' | 'DISTRICT_ADMIN'
  schoolId: string
}

export function EmbeddingManager({ userRole, schoolId }: EmbeddingManagerProps) {
  const [stats, setStats] = useState<EmbeddingStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [updateType, setUpdateType] = useState<'both' | 'observations' | 'evaluations'>('both')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/rag/search')
      if (!response.ok) {
        throw new Error('Failed to load stats')
      }

      const data = await response.json()
      setStats(data.stats)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load stats')
    } finally {
      setLoading(false)
    }
  }

  const updateEmbeddings = async () => {
    setUpdating(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/rag/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'batch',
          type: updateType,
          ...(userRole === 'ADMIN' && { schoolId })
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update embeddings')
      }

      const data = await response.json()
      setSuccess(data.message)
      
      // Reload stats after update
      setTimeout(() => {
        loadStats()
      }, 1000)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update embeddings')
    } finally {
      setUpdating(false)
    }
  }

  const getTotalProgress = () => {
    if (!stats) return 0
    const totalItems = stats.observations.total + stats.evaluations.total
    const totalEmbedded = stats.observations.embedded + stats.evaluations.embedded
    return totalItems > 0 ? Math.round((totalEmbedded / totalItems) * 100) : 0
  }

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600'
    if (percentage >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getStatusIcon = (percentage: number) => {
    if (percentage >= 90) return <CheckCircle className="h-4 w-4 text-green-600" />
    return <AlertCircle className="h-4 w-4 text-yellow-600" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Database className="h-5 w-5" />
            Embedding Management
          </h3>
          <p className="text-sm text-muted-foreground">
            Manage AI embeddings for {userRole === 'DISTRICT_ADMIN' ? 'district-wide' : 'school'} RAG search
          </p>
        </div>
        
        <Button
          onClick={loadStats}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Overall Progress */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Overall Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{getTotalProgress()}%</span>
                  {getStatusIcon(getTotalProgress())}
                </div>
                <Progress value={getTotalProgress()} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {stats.observations.embedded + stats.evaluations.embedded} of{' '}
                  {stats.observations.total + stats.evaluations.total} items embedded
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Observations */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Observations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-2xl font-bold ${getStatusColor(stats.observations.percentage)}`}>
                    {stats.observations.percentage}%
                  </span>
                  {getStatusIcon(stats.observations.percentage)}
                </div>
                <Progress value={stats.observations.percentage} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {stats.observations.embedded} of {stats.observations.total} embedded
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Evaluations */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Evaluations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-2xl font-bold ${getStatusColor(stats.evaluations.percentage)}`}>
                    {stats.evaluations.percentage}%
                  </span>
                  {getStatusIcon(stats.evaluations.percentage)}
                </div>
                <Progress value={stats.evaluations.percentage} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {stats.evaluations.embedded} of {stats.evaluations.total} embedded
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Update Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Update Embeddings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select value={updateType} onValueChange={(value: any) => setUpdateType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">Update Both Observations & Evaluations</SelectItem>
                  <SelectItem value="observations">Update Observations Only</SelectItem>
                  <SelectItem value="evaluations">Update Evaluations Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button
              onClick={updateEmbeddings}
              disabled={updating || !stats}
              className="flex-shrink-0"
            >
              {updating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start Update
                </>
              )}
            </Button>
          </div>

          <div className="text-sm text-muted-foreground space-y-1">
            <p>• This will generate embeddings for items that don't have them yet</p>
            <p>• The process may take several minutes depending on the number of items</p>
            <p>• You can continue using the system while embeddings are being generated</p>
            {userRole === 'DISTRICT_ADMIN' && (
              <p>• As a district admin, you can update embeddings across all schools</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Loading State */}
      {loading && !stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="h-8 bg-gray-200 rounded animate-pulse" />
                  <div className="h-2 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}