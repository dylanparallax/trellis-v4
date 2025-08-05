'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Upload, FileText, User, Clock, CheckCircle, AlertCircle } from 'lucide-react'

interface Teacher {
  id: string
  name: string
  subject: string
  gradeLevel: string
  email?: string
  strengths: string[]
  growthAreas: string[]
  currentGoals: Array<{ goal: string; progress: number }>
}

interface ObservationFormProps {
  teacherId?: string
  onSubmit?: (data: Record<string, unknown>) => void
}

export function ObservationForm({ teacherId, onSubmit }: ObservationFormProps) {
  const [selectedTeacherId, setSelectedTeacherId] = useState(teacherId || '')
  const [notes, setNotes] = useState('')
  const [artifacts, setArtifacts] = useState<File[]>([])
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [enhancedNotes, setEnhancedNotes] = useState('')
  const [observationType, setObservationType] = useState('FORMAL')
  const [duration, setDuration] = useState('')
  const [focusAreas, setFocusAreas] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [draftStatus, setDraftStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(true)

  // Fetch teachers from API
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const response = await fetch('/api/teachers?schoolId=demo-school-1')
        if (response.ok) {
          const data = await response.json()
          setTeachers(data)
        } else {
          console.error('Failed to fetch teachers')
        }
      } catch (error) {
        console.error('Error fetching teachers:', error)
      } finally {
        setIsLoadingTeachers(false)
      }
    }

    fetchTeachers()
  }, [])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setArtifacts(prev => [...prev, ...files])
  }

  const handleEnhance = async () => {
    if (!notes.trim()) return
    
    setIsEnhancing(true)
    try {
      const response = await fetch('/api/observations/enhance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rawNotes: notes,
          teacherId: selectedTeacherId,
          observationType,
          focusAreas
        })
      })

      if (!response.ok) {
        throw new Error('Failed to enhance notes')
      }

      const data = await response.json()
      setEnhancedNotes(data.enhancedNotes)
    } catch (error) {
      console.error('Enhancement failed:', error)
      // Fallback to demo enhancement
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
    } finally {
      setIsEnhancing(false)
    }
  }

  const handleSaveDraft = async () => {
    setIsSavingDraft(true)
    setDraftStatus('idle')
    
    try {
      const draftData = {
        teacherId: selectedTeacherId,
        rawNotes: notes,
        enhancedNotes,
        observationType,
        duration: parseInt(duration) || undefined,
        focusAreas,
        artifacts: artifacts.map(f => ({ name: f.name, size: f.size })),
        savedAt: new Date().toISOString(),
        isDraft: true
      }
      
      // Save to localStorage for now (in a real app, this would go to your API)
      const existingDrafts = JSON.parse(localStorage.getItem('observationDrafts') || '[]')
      const newDraft = {
        id: Date.now().toString(),
        ...draftData
      }
      existingDrafts.push(newDraft)
      localStorage.setItem('observationDrafts', JSON.stringify(existingDrafts))
      
      console.log('Draft saved:', newDraft)
      
      setDraftStatus('success')
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setDraftStatus('idle')
      }, 3000)
      
    } catch (error) {
      console.error('Failed to save draft:', error)
      setDraftStatus('error')
      
      // Clear error message after 3 seconds
      setTimeout(() => {
        setDraftStatus('idle')
      }, 3000)
    } finally {
      setIsSavingDraft(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedTeacherId || !notes.trim()) return
    
    setIsSubmitting(true)
    setSubmitStatus('idle')
    
    try {
      const data = {
        teacherId: selectedTeacherId,
        rawNotes: notes,
        enhancedNotes,
        observationType,
        duration: parseInt(duration) || undefined,
        focusAreas,
        artifacts: artifacts.map(f => ({ 
          fileName: f.name, 
          fileUrl: `demo-url/${f.name}`, // In real app, this would be uploaded
          fileType: f.type 
        }))
      }
      
      // Submit to API
      const response = await fetch('/api/observations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Failed to submit observation')
      }

      const result = await response.json()
      console.log('Observation submitted:', result)
      
      setSubmitStatus('success')
      onSubmit?.(result)
      
      // Reset form after successful submission
      setTimeout(() => {
        setNotes('')
        setEnhancedNotes('')
        setArtifacts([])
        setFocusAreas([])
        setDuration('')
        setSubmitStatus('idle')
      }, 2000)
      
    } catch (error) {
      console.error('Submission failed:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isValid = selectedTeacherId && notes.trim() && duration.trim()

  if (isLoadingTeachers) {
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Observation Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Teacher
              </label>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="w-full mt-1 p-2 border rounded-md bg-background"
                required
              >
                <option value="">Select a teacher...</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name} - {teacher.subject} (Grade {teacher.gradeLevel})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Observation Type</label>
              <select
                value={observationType}
                onChange={(e) => setObservationType(e.target.value)}
                className="w-full mt-1 p-2 border rounded-md bg-background"
              >
                <option value="FORMAL">Formal</option>
                <option value="INFORMAL">Informal</option>
                <option value="WALKTHROUGH">Walkthrough</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Duration (minutes)
              </label>
              <Input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="45"
                className="mt-1"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Focus Areas</label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {['Student Engagement', 'Differentiation', 'Assessment', 'Classroom Management', 'Technology Integration', 'Student Collaboration'].map((area) => (
                <label key={area} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer">
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
            placeholder="Describe what you observed during the classroom visit. Include specific examples of teaching strategies, student engagement, and any areas for growth..."
            className="min-h-[200px]"
            required
          />
          
          <div className="flex gap-2">
            <Button
              onClick={handleEnhance}
              disabled={!notes.trim() || isEnhancing}
              className="bg-gradient-to-r from-brand-blue to-brand-orange hover:from-brand-blue/90 hover:to-brand-orange/90"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {isEnhancing ? 'Enhancing...' : 'Enhance with AI'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {enhancedNotes && (
        <Card className="border-brand-yellow/20 bg-brand-yellow/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-brand-orange">
              <Sparkles className="h-5 w-5" />
              AI Enhanced Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-foreground bg-brand-yellow/10 p-4 rounded-md">
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
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
            <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
            <div className="mt-4">
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-sm font-medium text-primary hover:text-primary/80">
                  Upload files
                </span>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept="image/*,application/pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="sr-only"
                />
              </label>
              <p className="text-xs text-muted-foreground mt-1">
                Images, PDFs, or documents (max 10MB each)
              </p>
            </div>
          </div>

          {artifacts.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Uploaded Files:</h4>
              {artifacts.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-md">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-sm font-medium">{file.name}</span>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
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

      {/* Status Messages */}
      {submitStatus === 'success' && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="flex items-center gap-2 p-4">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-800">Observation submitted successfully!</span>
          </CardContent>
        </Card>
      )}

      {submitStatus === 'error' && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-2 p-4">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-800">Failed to submit observation. Please try again.</span>
          </CardContent>
        </Card>
      )}

      {draftStatus === 'success' && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="flex items-center gap-2 p-4">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            <span className="text-blue-800">Observation draft saved successfully!</span>
          </CardContent>
        </Card>
      )}

      {draftStatus === 'error' && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-2 p-4">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-800">Failed to save draft. Please try again.</span>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" disabled={isSubmitting || isSavingDraft} onClick={handleSaveDraft}>
          {isSavingDraft ? 'Saving...' : 'Save Draft'}
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={!isValid || isSubmitting}
          className="bg-gradient-to-r from-brand-blue to-brand-orange hover:from-brand-blue/90 hover:to-brand-orange/90"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Observation'}
        </Button>
      </div>
    </div>
  )
} 