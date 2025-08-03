'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Upload, Eye, FileText } from 'lucide-react'

interface ObservationFormProps {
  teacherId?: string
  onSubmit?: (data: Record<string, unknown>) => void
}

export function ObservationForm({ teacherId, onSubmit }: ObservationFormProps) {
  const [notes, setNotes] = useState('')
  const [artifacts, setArtifacts] = useState<File[]>([])
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [enhancedNotes, setEnhancedNotes] = useState('')
  const [observationType, setObservationType] = useState('FORMAL')
  const [duration, setDuration] = useState('')
  const [focusAreas, setFocusAreas] = useState<string[]>([])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setArtifacts(prev => [...prev, ...files])
  }

  const handleEnhance = async () => {
    if (!notes.trim()) return
    
    setIsEnhancing(true)
    try {
      // Simulate AI enhancement
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const enhanced = `
**Instructional Strengths Observed:**
• Effective classroom management with clear expectations
• Strong student engagement through interactive activities
• Appropriate use of formative assessment strategies

**Areas for Growth:**
• Consider providing more differentiated instruction for diverse learners
• Opportunity to incorporate more student-led discussions

**Next Steps:**
1. Implement small-group activities to support struggling students
2. Add more open-ended questions to promote critical thinking
3. Continue building on the strong classroom culture you've established

**Connection to Previous Goals:**
Excellent progress on the classroom management goal from last month's observation.
      `
      
      setEnhancedNotes(enhanced)
    } catch (error) {
      console.error('Enhancement failed:', error)
    } finally {
      setIsEnhancing(false)
    }
  }

  const handleSubmit = () => {
    const data = {
      teacherId,
      rawNotes: notes,
      enhancedNotes,
      observationType,
      duration: parseInt(duration) || undefined,
      focusAreas,
      artifacts: artifacts.map(f => ({ name: f.name, size: f.size }))
    }
    
    onSubmit?.(data)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            New Observation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Observation Type</label>
              <select
                value={observationType}
                onChange={(e) => setObservationType(e.target.value)}
                className="w-full mt-1 p-2 border rounded-md"
              >
                <option value="FORMAL">Formal</option>
                <option value="INFORMAL">Informal</option>
                <option value="WALKTHROUGH">Walkthrough</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Duration (minutes)</label>
              <Input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="45"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Focus Areas</label>
            <div className="mt-2 space-y-2">
              {['Student Engagement', 'Differentiation', 'Assessment', 'Classroom Management'].map((area) => (
                <label key={area} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={focusAreas.includes(area)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFocusAreas(prev => [...prev, area])
                      } else {
                        setFocusAreas(prev => prev.filter(a => a !== area))
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm">{area}</span>
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Observation Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Type your observation notes here..."
            className="min-h-[200px]"
          />
          
          <div className="flex gap-2">
            <Button
              onClick={handleEnhance}
              disabled={!notes.trim() || isEnhancing}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {isEnhancing ? 'Enhancing...' : 'Enhance with AI'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {enhancedNotes && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Sparkles className="h-5 w-5" />
              AI Enhanced Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-green-900 bg-green-100 p-4 rounded-md">
                {enhancedNotes}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Artifacts & Evidence
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-sm font-medium text-primary hover:text-primary/80">
                  Upload files
                </span>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  className="sr-only"
                />
              </label>
              <p className="text-xs text-muted-foreground mt-1">
                Images, PDFs, or other documents
              </p>
            </div>
          </div>

          {artifacts.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Uploaded Files:</h4>
              {artifacts.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm">{file.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setArtifacts(prev => prev.filter((_, i) => i !== index))}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline">Save Draft</Button>
        <Button onClick={handleSubmit} disabled={!notes.trim()}>
          Submit Observation
        </Button>
      </div>
    </div>
  )
} 