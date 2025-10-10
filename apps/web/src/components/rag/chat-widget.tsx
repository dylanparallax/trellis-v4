'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Sparkles, FileText, BookOpen, Calendar, TrendingUp, MessageSquare, X, Minimize2, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  sources?: ChatSource[]
}

interface ChatSource {
  id: string
  type: 'observation' | 'evaluation'
  title: string
  teacherName: string
  date: string
  score: number
  snippet: string
}

interface ChatResponse {
  response: string
  sources: ChatSource[]
  searchQuery: string
  contextUsed: boolean
  scope: 'school' | 'district'
}

export function RAGChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant for educational insights. I can help you analyze observations and evaluations to identify trends, best practices, and areas for improvement. What would you like to explore?',
      timestamp: new Date(),
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [scope, setScope] = useState<'school' | 'district'>('school')
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen, isMinimized])

  const sendMessage = async () => {
    if (!inputValue.trim() || loading) return

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setLoading(true)

    try {
      const response = await fetch('/api/rag/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory: messages.slice(-6), // Keep last 6 messages for context
          searchOptions: {
            limit: 8,
            minScore: 0.75,
            type: 'both'
          }
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data: ChatResponse = await response.json()
      setScope(data.scope)

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        sources: data.sources
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getSourceIcon = (type: string) => {
    return type === 'observation' ? <BookOpen className="h-3 w-3" /> : <FileText className="h-3 w-3" />
  }

  if (!isOpen) {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          size="lg"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: 1,
        height: isMinimized ? 'auto' : '600px',
        width: isMinimized ? '320px' : '400px'
      }}
      className="fixed bottom-6 right-6 z-50 bg-white rounded-lg shadow-2xl border"
      style={{ maxHeight: '80vh' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">AI Assistant</h3>
            <p className="text-xs text-muted-foreground">
              {scope === 'district' ? 'District-wide' : 'School-wide'} insights
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-8 w-8 p-0"
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <ScrollArea className="h-96 p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                  }`}>
                    {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  
                  <div className={`flex-1 space-y-2 ${message.role === 'user' ? 'text-right' : ''}`}>
                    <div className={`inline-block p-3 rounded-lg max-w-[280px] ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      {message.role === 'assistant' ? (
                        <ReactMarkdown className="prose prose-sm max-w-none">
                          {message.content}
                        </ReactMarkdown>
                      ) : (
                        <p className="text-sm">{message.content}</p>
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      {formatTimestamp(message.timestamp)}
                    </p>

                    {/* Sources */}
                    {message.sources && message.sources.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground font-medium">
                          Sources ({message.sources.length}):
                        </p>
                        <div className="space-y-1">
                          {message.sources.slice(0, 3).map((source, idx) => (
                            <Card key={idx} className="p-2 bg-gray-50 border-gray-200">
                              <div className="flex items-start gap-2">
                                {getSourceIcon(source.type)}
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium truncate">
                                    {source.teacherName}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {source.snippet}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs h-4">
                                      {Math.round(source.score * 100)}%
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(source.date).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </Card>
                          ))}
                          {message.sources.length > 3 && (
                            <p className="text-xs text-muted-foreground">
                              +{message.sources.length - 3} more sources
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3"
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-100 p-3 rounded-lg inline-block">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about teaching practices, trends, or insights..."
                className="flex-1 min-h-[40px] max-h-[100px] resize-none"
                disabled={loading}
              />
              <Button
                onClick={sendMessage}
                disabled={loading || !inputValue.trim()}
                size="sm"
                className="h-10 w-10 p-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">
                Press Enter to send, Shift+Enter for new line
              </p>
              <Badge variant="outline" className="text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                {scope === 'district' ? 'District' : 'School'}
              </Badge>
            </div>
          </div>
        </>
      )}
    </motion.div>
  )
}