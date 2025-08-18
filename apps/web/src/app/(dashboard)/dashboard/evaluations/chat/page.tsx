'use client'

import { useState, useRef, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import dynamic from 'next/dynamic'
import { 
  Send, 
  Download, 
  Sparkles, 
  User, 
  Copy,
  Check,
  ArrowLeft
} from 'lucide-react'
import Image from 'next/image'
const ReactMarkdown = dynamic(() => import('react-markdown'), { ssr: false })
import remarkGfm from 'remark-gfm'


interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface Message extends ChatMessage {
  id: string
  artifactId?: string // Reference to evaluation version
}

interface EvaluationVersion {
  id: string
  version: number
  content: string
  timestamp: Date
  title: string
  description: string
}

type ApiTeacher = {
  id: string
  name: string
  subject?: string
  gradeLevel?: string
}

function EvaluationChatContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const teacherId = searchParams.get('teacher')
  const evaluationType = searchParams.get('type')
  const schoolYear = searchParams.get('year')
  
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [evaluationVersions, setEvaluationVersions] = useState<EvaluationVersion[]>([])
  const [currentVersionId, setCurrentVersionId] = useState<string>('')
  const [copied, setCopied] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const [teacher, setTeacher] = useState<ApiTeacher | null>(null)
  const [teacherError, setTeacherError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      if (!teacherId) return
      try {
        const res = await fetch(`/api/teachers/${teacherId}`)
        if (!res.ok) {
          throw new Error('Failed to load teacher')
        }
        const data = await res.json()
        setTeacher({ id: data.id, name: data.name, subject: data.subject, gradeLevel: data.gradeLevel })
      } catch {
        setTeacherError('Unable to load teacher')
      }
    }
    run()
  }, [teacherId])

  const createEvaluationVersion = useCallback((content: string, title: string, description: string): EvaluationVersion => {
    const newVersion: EvaluationVersion = {
      id: Date.now().toString(),
      version: (evaluationVersions?.length || 0) + 1,
      content,
      timestamp: new Date(),
      title,
      description,
    }
    setEvaluationVersions(prev => [...prev, newVersion])
    setCurrentVersionId(newVersion.id)
    return newVersion
  }, [evaluationVersions])

  const currentEvaluation = evaluationVersions.find(v => v.id === currentVersionId)

  const generateInitialEvaluation = useCallback(async () => {
    if (!teacher) return
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/evaluations/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teacherId: teacher.id,
          evaluationType: (evaluationType as 'FORMATIVE' | 'SUMMATIVE') || 'FORMATIVE',
          schoolYear: schoolYear || '2024-2025'
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate evaluation')
      }

      const data = await response.json()
      // Create initial version first
      const version = createEvaluationVersion(
        data.evaluation,
        `${evaluationType || 'Annual'} Evaluation`,
        'Initial AI-generated evaluation'
      )
      // Add assistant message with summary and thumbnail
      const initialMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.message || `Generated an initial evaluation for ${teacher.name}.`,
        timestamp: new Date(),
        artifactId: version.id,
      }
      setMessages([initialMessage])
      
    } catch (error) {
      console.error('Error generating initial evaluation:', error)
      // Add error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error generating the initial evaluation. Please try again.',
        timestamp: new Date()
      }
      setMessages([errorMessage])
    } finally {
      setIsLoading(false)
    }
  }, [teacher, evaluationType, schoolYear, createEvaluationVersion])

  useEffect(() => {
    if (teacher && messages.length === 0) {
      // Generate initial evaluation
      generateInitialEvaluation()
    }
  }, [teacher, messages.length, generateInitialEvaluation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || !teacher) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/evaluations/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userMessage: input,
          teacherId: teacher.id,
          evaluationType: (evaluationType as 'FORMATIVE' | 'SUMMATIVE') || 'FORMATIVE',
          schoolYear: schoolYear || '2024-2025',
          currentEvaluation: currentEvaluation?.content ?? ''
        })
      })

      if (!response.ok) {
        throw new Error('Failed to process chat message')
      }

      const data = await response.json()
      
      // Create new evaluation version if content changed
      let newVersion: EvaluationVersion | null = null
      let artifactId: string | undefined = undefined
      
      if (!currentEvaluation || data.evaluation !== currentEvaluation.content) {
        newVersion = createEvaluationVersion(
          data.evaluation,
          `Updated ${evaluationType} Evaluation`,
          `Updated based on: "${input.substring(0, 50)}${input.length > 50 ? '...' : ''}"`
        )
        artifactId = newVersion.id
      }
      
      // Add AI response to chat
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: newVersion 
          ? (data.message || 'Updated the evaluation. Click to view V2.')
          : (data.message || 'No changes were necessary.'),
        timestamp: new Date(),
        artifactId
      }

      setMessages(prev => [...prev, aiResponse])
    } catch (error) {
      console.error('Failed to process chat message:', error)
      // Fallback response
      const fallbackResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I'm having trouble processing your request right now. Please try again.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, fallbackResponse])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const copyEvaluation = async () => {
    if (!currentEvaluation) return
    await navigator.clipboard.writeText(currentEvaluation.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadEvaluation = () => {
    if (!currentEvaluation || !teacher) return
    const blob = new Blob([currentEvaluation.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${teacher.name}-${evaluationType}-Evaluation-v${currentEvaluation.version}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  // artifact click is handled via version list onClick

  if (teacherError) return <div>{teacherError}</div>
  if (!teacher) return <div>Loading teacher...</div>

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Evaluation Chat
              </h1>
              {teacher && (
                <p className="text-sm text-gray-500">
                  {teacher.name} • {evaluationType || 'Annual'} Evaluation
                </p>
              )}
            </div>
          </div>
          {currentEvaluation && teacher && (
            <div className="mt-3 flex justify-end">
              <Button
                variant="default"
                size="sm"
                onClick={async () => {
                  try {
                    const payload = {
                      teacherId: teacher.id,
                      evaluationType: (evaluationType as 'FORMATIVE' | 'SUMMATIVE') || 'FORMATIVE',
                      schoolYear: schoolYear || '2024-2025',
                      content: { markdown: currentEvaluation.content },
                      summary: currentEvaluation.content.slice(0, 180),
                      status: 'SUBMITTED',
                    }
                    const res = await fetch('/api/evaluations', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(payload),
                    })
                    if (!res.ok) throw new Error('Failed to save evaluation')
                  } catch (e) {
                    console.error(e)
                  }
                }}
              >
                Submit Evaluation
              </Button>
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            {currentEvaluation && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyEvaluation}
                  className="flex items-center space-x-2"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadEvaluation}
                  className="flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 grid grid-cols-12 overflow-hidden">
        {/* Chat Area (left) */}
        <div className="col-span-5 min-w-0 flex flex-col border-r border-gray-200 overflow-hidden">
          {/* Messages */}
          <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Sparkles className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Start Your Evaluation
                </h3>
                <p className="text-gray-500 max-w-md">
                   I&apos;ll help you create a comprehensive evaluation for {teacher?.name || 'this teacher'}. 
                   Let me know what you&apos;d like to focus on or ask me to generate an initial evaluation.
                </p>
                <Button
                  onClick={generateInitialEvaluation}
                  disabled={isLoading || !teacher}
                  className="mt-4"
                >
                  {isLoading ? 'Generating...' : 'Generate Initial Evaluation'}
                </Button>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-3xl rounded-lg px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      {message.role === 'user' ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Image src="/trellis-light.svg" alt="Trellis" width={16} height={16} />
                      )}
                      <span className="text-sm font-medium">
                        {message.role === 'user' ? 'You' : 'Trellis'}
                      </span>
                      <span className="text-xs opacity-70">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="prose prose-sm max-w-none space-y-3">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                      {message.role === 'assistant' && message.artifactId ? (
                        <div
                          className={`p-3 border rounded-md cursor-pointer hover:bg-muted/50`}
                          onClick={() => setCurrentVersionId(message.artifactId!)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-sm">{teacher?.name} – {evaluationType} Evaluation</div>
                            <span className="text-xs text-muted-foreground">V{evaluationVersions.find(v => v.id === message.artifactId)?.version || ''}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">Click to open the generated evaluation</div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <Image src="/trellis-light.svg" alt="Trellis" width={16} height={16} />
                    <span className="text-sm font-medium">Trellis</span>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4 bg-white sticky bottom-0">
            <div className="flex gap-4">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me to modify the evaluation, add specific examples, or clarify any points..."
                className="flex-1 min-h-[60px] max-h-40 resize-y"
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !input.trim()}
                className="self-end"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Artifact Viewer (right) */}
        <div className="col-span-7 min-w-0 flex flex-col bg-white p-6 overflow-hidden max-w-none">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Generated Evaluation</h3>
          </div>
          {/* Versions strip (ensure unique and single for first) */}
          {evaluationVersions.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-3 mb-3 border-b">
              {[...new Map(evaluationVersions.map(v => [v.id, v])).values()].map((v) => (
                <div
                  key={v.id}
                  className={`px-3 py-2 rounded-md text-sm cursor-pointer whitespace-nowrap ${
                    v.id === currentVersionId ? 'bg-blue-50 border border-blue-300' : 'bg-muted hover:bg-muted/60 border'
                  }`}
                  onClick={() => setCurrentVersionId(v.id)}
                >
                  {v.title} (V{v.version})
                </div>
              ))}
            </div>
          )}
          {/* Artifact content */}
          {currentEvaluation ? (
            <div className="prose prose-sm md:prose-base lg:prose-lg max-w-none flex-1 min-h-0 overflow-y-auto">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {currentEvaluation.content}
              </ReactMarkdown>
              <div className="sticky bottom-0 bg-white pt-3 mt-6 flex gap-2 border-t">
                <Button variant="ghost" size="icon" onClick={copyEvaluation} aria-label="Copy Evaluation">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={downloadEvaluation} aria-label="Download Evaluation">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No evaluation generated yet.</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function EvaluationChatPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EvaluationChatContent />
    </Suspense>
  )
}