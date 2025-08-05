'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
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

export default function EvaluationChatPage() {
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
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-background p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard/evaluations')}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">
                {teacher.name.charAt(0)}
              </span>
            </div>
            <div>
              <h1 className="text-xl font-semibold">{teacher.name}</h1>
              <p className="text-sm text-muted-foreground">
                {evaluationType} Evaluation • {schoolYear}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="default" 
              size="sm" 
              onClick={generateInitialEvaluation}
              disabled={isLoading}
              className="bg-primary hover:bg-blue-500 text-white border-0"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {isLoading ? 'Generating...' : 'Generate'}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Chat Interface */}
        <div className="w-[40%] flex flex-col border-r">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-3xl ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                  <div className={`flex items-start space-x-3 ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.role === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-brand-blue text-white'
                    }`}>
                      {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    
                    <div className={`flex-1 ${message.role === 'user' ? 'text-right' : ''}`}>
                      <div className={`inline-block p-4 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}>
                        <div className="whitespace-pre-wrap">{message.content}</div>
                      </div>
                      
                      {/* Artifact Icon */}
                      {message.artifactId && (
                        <div className="mt-3 flex items-center gap-2">
                          <button
                            onClick={() => handleArtifactClick(message.artifactId!)}
                            className="flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-lg hover:bg-muted/50 transition-colors group"
                          >
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-blue to-brand-orange flex items-center justify-center">
                              <FileText className="h-3 w-3 text-white" />
                            </div>
                            <span className="text-sm font-medium text-foreground group-hover:text-brand-blue">
                              {evaluationVersions.find(v => v.id === message.artifactId)?.title || 'Evaluation Document'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              v{evaluationVersions.find(v => v.id === message.artifactId)?.version}
                            </span>
                          </button>
                        </div>
                      )}
                      
                      <div className={`text-xs text-muted-foreground mt-1 ${
                        message.role === 'user' ? 'text-right' : ''
                      }`}>
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-3xl">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-full bg-brand-blue text-white flex items-center justify-center">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-blue"></div>
                        <span>AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Input - Now positioned directly after messages */}
            <div className="pt-4">
              <div className="flex space-x-2">
                <Textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me to modify the evaluation, add specific details, or make any changes..."
                  className="flex-1 min-h-[60px] max-h-[120px] resize-none"
                  disabled={isLoading || !currentEvaluation}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading || !currentEvaluation}
                  className="bg-gradient-to-r from-brand-blue to-brand-orange hover:from-brand-blue/90 hover:to-brand-orange/90"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Evaluation Document Panel */}
        <div className="w-[70%] bg-muted/30">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Evaluation Document
              </h3>
              {currentEvaluation && (
                <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                  v{currentEvaluation.version}
                </div>
              )}
            </div>
            {currentEvaluation && (
              <div className="mt-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {currentEvaluation.timestamp.toLocaleString()}
                </div>
                <div className="mt-1 font-medium">{currentEvaluation.title}</div>
                <div className="mt-1">{currentEvaluation.description}</div>
              </div>
            )}
          </div>
          
          {/* Version History */}
          {evaluationVersions.length > 1 && (
            <div className="p-3 border-b bg-background/50">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
                <History className="h-3 w-3" />
                Version History
              </div>
              <div className="space-y-1">
                {evaluationVersions.slice().reverse().map((version) => (
                  <button
                    key={version.id}
                    onClick={() => setCurrentVersionId(version.id)}
                    className={`w-full text-left p-2 rounded text-xs transition-colors ${
                      currentVersionId === version.id
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">v{version.version}</span>
                      <span className="text-muted-foreground">
                        {version.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-muted-foreground truncate">{version.title}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Evaluation Content */}
          <div className="flex-1 overflow-y-auto">
            {currentEvaluation ? (
              <div className="p-6">
                <div className="prose prose-sm max-w-none prose-headings:font-semibold prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-p:text-sm prose-li:text-sm prose-strong:text-foreground prose-strong:font-semibold">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({children}) => <h1 className="text-xl font-bold text-foreground border-b border-border pb-2 mb-4">{children}</h1>,
                      h2: ({children}) => <h2 className="text-lg font-semibold text-foreground mt-6 mb-3">{children}</h2>,
                      h3: ({children}) => <h3 className="text-base font-medium text-foreground mt-4 mb-2">{children}</h3>,
                      p: ({children}) => <p className="text-sm text-foreground mb-3 leading-relaxed">{children}</p>,
                      ul: ({children}) => <ul className="list-disc list-inside space-y-1 mb-4">{children}</ul>,
                      ol: ({children}) => <ol className="list-decimal list-inside space-y-1 mb-4">{children}</ol>,
                      li: ({children}) => <li className="text-sm text-foreground">{children}</li>,
                      strong: ({children}) => <strong className="font-semibold text-foreground">{children}</strong>,
                      em: ({children}) => <em className="italic text-foreground">{children}</em>,
                      hr: () => <hr className="border-border my-6" />,
                      blockquote: ({children}) => <blockquote className="border-l-4 border-primary/20 pl-4 italic text-muted-foreground">{children}</blockquote>
                    }}
                  >
                    {currentEvaluation.content}
                  </ReactMarkdown>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No evaluation generated yet.</p>
                <p className="text-sm">Click &quot;Generate&quot; to create the first evaluation.</p>
              </div>
            )}
          </div>
          
          {/* Action Buttons at Bottom */}
          {currentEvaluation && (
            <div className="border-t bg-background p-4">
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  Version {currentEvaluation.version} • {currentEvaluation.timestamp.toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={copyEvaluation} title={copied ? 'Copied!' : 'Copy'}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    <span className="ml-2 text-xs">Copy</span>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={downloadEvaluation} title="Download">
                    <Download className="h-4 w-4" />
                    <span className="ml-2 text-xs">Download</span>
                  </Button>
                  <Button variant="ghost" size="sm" title="Save">
                    <Save className="h-4 w-4" />
                    <span className="ml-2 text-xs">Save</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
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