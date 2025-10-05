'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Combobox, type ComboboxOption } from '@/components/ui/combobox'
import { Sparkles, Upload, Award, CheckCircle, AlertCircle } from 'lucide-react'
import dynamic from 'next/dynamic'
import remarkGfm from 'remark-gfm'
import { formatMarkdownForSpacing } from '@/lib/utils'

const ReactMarkdown = dynamic(() => import('react-markdown'), { ssr: false })

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
  const [observationDate, setObservationDate] = useState(new Date().toISOString().split('T')[0])
  const [observationTime, setObservationTime] = useState('')
  const [observationSubject, setObservationSubject] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [draftStatus, setDraftStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(true)

  // Convert teachers to combobox options
  const teacherOptions: ComboboxOption[] = useMemo(() => {
    return teachers.map((teacher) => ({
      value: teacher.id,
      label: `${teacher.name} - ${teacher.subject} (Grade ${teacher.gradeLevel})`,
    }))
  }, [teachers])

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
      const selectedTeacher = teachers.find(t => t.id === selectedTeacherId)
      const draftData = {
        teacherId: selectedTeacherId,
        teacher: selectedTeacher ? {
          id: selectedTeacher.id,
          name: selectedTeacher.name,
          subject: selectedTeacher.subject,
          gradeLevel: selectedTeacher.gradeLevel,
        } : undefined,
        observer: { id: 'me', name: 'You' },
        rawNotes: notes,
        enhancedNotes,
        observationType,
        duration: parseInt(duration) || undefined,
        focusAreas,
        date: observationDate,
        time: observationTime,
        subject: observationSubject || undefined,
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
        date: observationDate,
        time: observationTime || undefined,
        subject: observationSubject || undefined,
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

  const isValid = Boolean(selectedTeacherId && notes.trim())

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium flex items-center gap-2 mb-1">
                Teacher
              </label>
              <Combobox
                options={teacherOptions}
                value={selectedTeacherId}
                onValueChange={setSelectedTeacherId}
                placeholder="Select a teacher..."
                searchPlaceholder="Type to search teachers..."
                emptyText="No teachers found."
              />
            </div>
            
            <div>
              <label className="text-sm font-medium flex items-center gap-2">Observation Type</label>
              <select
                value={observationType}
                onChange={(e) => setObservationType(e.target.value)}
                className="w-full mt-1 p-2 pr-10 border rounded-md bg-background appearance-none"
              >
                <option value="FORMAL">Formal</option>
                <option value="INFORMAL">Informal</option>
                <option value="WALKTHROUGH">Walkthrough</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                Duration (minutes)
              </label>
              <Input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="45"
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                Observation Date
              </label>
              <Input
                type="date"
                value={observationDate}
                onChange={(e) => setObservationDate(e.target.value)}
                className="mt-1"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                Observation Time
              </label>
              <Input
                type="time"
                value={observationTime}
                onChange={(e) => setObservationTime(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                Subject (optional)
              </label>
              <Input
                value={observationSubject}
                onChange={(e) => setObservationSubject(e.target.value)}
                placeholder="e.g., Algebra"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Focus Areas</label>
            <div className="mt-1 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {['Student Engagement', 'Differentiation', 'Assessment', 'Classroom Management', 'Technology Integration', 'Student Collaboration'].map((area) => (
                <label key={area} className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors">
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
                    className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary focus:ring-2 focus:ring-offset-0"
                  />
                  <span className="text-sm leading-5 select-none">{area}</span>
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
              className=""
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {isEnhancing ? 'Enhancing...' : 'Enhance with AI'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {enhancedNotes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-brand-orange">
              <Sparkles className="h-5 w-5" />
              AI Enhanced Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm md:prose-base max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {formatMarkdownForSpacing(enhancedNotes)}
              </ReactMarkdown>
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
                    <Award className="h-4 w-4 text-muted-foreground" />
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
        >
          {isSubmitting ? 'Submitting...' : 'Submit Observation'}
        </Button>
      </div>
    </div>
  )
} 