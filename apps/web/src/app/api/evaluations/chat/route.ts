import { NextRequest, NextResponse } from 'next/server'
import { AIEvaluationService } from '@/lib/ai/evaluation-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userMessage, teacher, evaluationType, schoolYear, currentEvaluation } = body

    // Validate required fields
    if (!userMessage || !teacher || !evaluationType || !schoolYear || !currentEvaluation) {
      return NextResponse.json(
        { error: 'Missing required fields: userMessage, teacher, evaluationType, schoolYear, currentEvaluation' },
        { status: 400 }
      )
    }

    // Create evaluation context
    const context = {
      teacher,
      evaluationType,
      schoolYear,
      previousObservations: [], // TODO: Fetch from database
      previousEvaluations: [], // TODO: Fetch from database
      chatHistory: []
    }

    // Check if we have API keys for real AI
    const hasAnthropicKey = process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your_anthropic_key_here'
    const hasOpenAIKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_key_here'
    
    console.log('Server Chat API Key Check:', { 
      hasAnthropicKey: !!hasAnthropicKey, 
      hasOpenAIKey: !!hasOpenAIKey,
      userMessage: userMessage.substring(0, 50) + '...'
    })
    
    // Use demo mode only if no API keys are available
    if (!hasAnthropicKey && !hasOpenAIKey) {
      console.log('No API keys found, using demo mode for chat')
      const evaluationService = new AIEvaluationService()
      const demoResponse = await evaluationService.handleChatMessage(userMessage, context, currentEvaluation)
      return NextResponse.json(demoResponse)
    }
    
    console.log('Using real AI for chat response')
    
    // Use the service method directly
    const evaluationService = new AIEvaluationService()
    const response = await evaluationService.handleChatMessage(userMessage, context, currentEvaluation)
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('API route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 