import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth/server'
import { semanticSearch } from '@/lib/ai/vector-search'
import { OpenAI } from 'openai'
import { z } from 'zod'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const chatSchema = z.object({
  message: z.string().min(1).max(2000),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })).optional().default([]),
  searchOptions: z.object({
    limit: z.number().int().min(1).max(20).optional().default(10),
    minScore: z.number().min(0).max(1).optional().default(0.75),
    type: z.enum(['observation', 'evaluation', 'both']).optional().default('both'),
  }).optional().default({})
})

export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext()
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only allow ADMIN and DISTRICT_ADMIN to use RAG chat
    if (!['ADMIN', 'DISTRICT_ADMIN'].includes(authContext.role)) {
      return NextResponse.json({ 
        error: 'Forbidden - RAG chat is only available to administrators' 
      }, { status: 403 })
    }

    const validation = chatSchema.safeParse(await request.json())
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Invalid request', 
        details: validation.error.errors 
      }, { status: 400 })
    }

    const { message, conversationHistory, searchOptions } = validation.data

    // Perform semantic search to find relevant context
    const searchResults = await semanticSearch(message, authContext, searchOptions)

    // Build context from search results
    const context = buildContextFromResults(searchResults)

    // Build the conversation with context
    const messages = [
      {
        role: 'system' as const,
        content: buildSystemPrompt(authContext, context)
      },
      ...conversationHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      {
        role: 'user' as const,
        content: message
      }
    ]

    // Generate response using OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 1000,
      stream: false,
    })

    const response = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response.'

    return NextResponse.json({
      response,
      sources: searchResults.map(result => ({
        id: result.id,
        type: result.type,
        title: result.title,
        teacherName: result.teacherName,
        date: result.date,
        score: Math.round(result.score * 100) / 100,
        snippet: result.snippet
      })),
      searchQuery: message,
      contextUsed: context.length > 0,
      scope: authContext.role === 'DISTRICT_ADMIN' ? 'district' : 'school'
    })
  } catch (error) {
    console.error('RAG chat error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function buildSystemPrompt(authContext: any, context: string): string {
  const scope = authContext.role === 'DISTRICT_ADMIN' ? 'district' : 'school'
  const scopeDescription = scope === 'district' 
    ? 'across all schools in your district' 
    : 'within your school'

  return `You are an AI assistant helping educational administrators analyze observations and evaluations ${scopeDescription}.

Your role is to:
1. Answer questions about teaching practices, evaluation trends, and educational insights
2. Provide data-driven insights based on the provided context
3. Suggest actionable recommendations for improvement
4. Help identify patterns and trends in the data
5. Maintain confidentiality and professionalism

Context from relevant observations and evaluations:
${context || 'No specific context found for this query.'}

Guidelines:
- Base your responses on the provided context when possible
- If the context doesn't contain enough information, say so clearly
- Provide specific, actionable insights rather than generic advice
- Respect teacher privacy - refer to teachers by name only when discussing specific cases
- Focus on constructive, growth-oriented feedback
- Cite specific examples from the context when making points

Remember: You are analyzing real educational data to help improve teaching and learning outcomes.`
}

function buildContextFromResults(results: any[]): string {
  if (results.length === 0) return ''

  const contextParts = results.slice(0, 8).map((result, index) => {
    const date = new Date(result.date).toLocaleDateString()
    return `
[${index + 1}] ${result.title} (${date})
Teacher: ${result.teacherName}
Type: ${result.type}
${result.metadata.subject ? `Subject: ${result.metadata.subject}` : ''}
${result.metadata.gradeLevel ? `Grade: ${result.metadata.gradeLevel}` : ''}
${result.metadata.focusAreas?.length ? `Focus Areas: ${result.metadata.focusAreas.join(', ')}` : ''}
Content: ${result.snippet}
Relevance Score: ${Math.round(result.score * 100)}%
---`
  })

  return contextParts.join('\n')
}