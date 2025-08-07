'use client'

import { useState, useRef, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { 
  Send, 
  Download, 
  Save, 
  Sparkles, 
  User, 
  Bot, 
  FileText,
  Copy,
  Check,
  ArrowLeft,
  Clock,
  History
} from 'lucide-react'
import { getTeacherById } from '@/lib/data/mock-data'

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

  const teacher = getTeacherById(teacherId || '')

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
          evaluationType: evaluationType || 'Annual',
          schoolYear: schoolYear || '2024-2025'
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate evaluation')
      }

      const data = await response.json()
      
      const initialMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.evaluation,
        timestamp: new Date()
      }
      
      setMessages([initialMessage])
      
      // Create initial version
      createEvaluationVersion(
        data.evaluation,
        `${evaluationType || 'Annual'} Evaluation`,
        'Initial AI-generated evaluation'
      )
      
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
  }, [teacher, evaluationType, schoolYear])

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

  const createEvaluationVersion = (content: string, title: string, description: string): EvaluationVersion => {
    const version: EvaluationVersion = {
      id: Date.now().toString(),
      version: evaluationVersions.length + 1,
      content,
      timestamp: new Date(),
      title,
      description
    }
    
    setEvaluationVersions(prev => [...prev, version])
    setCurrentVersionId(version.id)
    return version
  }

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || !teacher || !currentEvaluation) return

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
          teacher,
          evaluationType: (evaluationType as 'FORMATIVE' | 'SUMMATIVE') || 'FORMATIVE',
          schoolYear: schoolYear || '2024-2025',
          currentEvaluation: currentEvaluation.content
        })
      })

      if (!response.ok) {
        throw new Error('Failed to process chat message')
      }

      const data = await response.json()
      
      // Create new evaluation version if content changed
      let newVersion: EvaluationVersion | null = null
      let artifactId: string | undefined = undefined
      
      if (data.evaluation !== currentEvaluation.content) {
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
          ? `${data.message} The evaluation has been updated.`
          : data.message,
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

  const handleArtifactClick = (artifactId: string) => {
    setCurrentVersionId(artifactId)
  }

  if (!teacher) {
    return <div>Teacher not found</div>
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
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
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Sparkles className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Start Your Evaluation
                </h3>
                <p className="text-gray-500 max-w-md">
                  I'll help you create a comprehensive evaluation for {teacher?.name || 'this teacher'}. 
                  Let me know what you'd like to focus on or ask me to generate an initial evaluation.
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
                        <Bot className="h-4 w-4" />
                      )}
                      <span className="text-sm font-medium">
                        {message.role === 'user' ? 'You' : 'AI Assistant'}
                      </span>
                      <span className="text-xs opacity-70">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-4 w-4" />
                    <span className="text-sm font-medium">AI Assistant</span>
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
          <div className="border-t border-gray-200 p-6 bg-white">
            <div className="flex space-x-4">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me to modify the evaluation, add specific examples, or clarify any points..."
                className="flex-1 min-h-[60px] resize-none"
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

        {/* Sidebar */}
        <div className="w-80 bg-white border-l border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Evaluation Versions</h3>
          <div className="space-y-2">
            {evaluationVersions.map((version) => (
              <div
                key={version.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  version.id === currentVersionId
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setCurrentVersionId(version.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm text-gray-900">
                      {version.title}
                    </h4>
                    <p className="text-xs text-gray-500">{version.description}</p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {version.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
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

function generateSampleEvaluation(): string {
  return `TEACHER EVALUATION REPORT

Teacher: Sarah Johnson
Subject: Mathematics
Grade Level: 5
Evaluation Type: Formative
School Year: 2024-2025
Date: December 15, 2024

EXECUTIVE SUMMARY
Ms. Johnson demonstrates strong instructional practices with particular strengths in student engagement and differentiated instruction. Her classroom management is exemplary, and she effectively uses formative assessment to guide instruction.

STRENGTHS
• Excellent classroom management with clear expectations and routines
• Strong use of manipulatives and hands-on activities for math concepts
• Effective differentiation strategies for diverse learners
• Consistent use of formative assessment to inform instruction
• Positive relationships with students and parents

AREAS FOR GROWTH
• Opportunity to incorporate more technology-based learning activities
• Consider implementing more student-led discussions and problem-solving
• Continue developing higher-order thinking questions

RECOMMENDATIONS
1. Explore digital math tools and apps to enhance student engagement
2. Implement more collaborative problem-solving activities
3. Continue professional development in differentiated instruction

NEXT STEPS
• Schedule follow-up observation in 6 weeks
• Provide resources for technology integration
• Continue current professional development plan

Overall Rating: Proficient (3.8/5.0)`
} 