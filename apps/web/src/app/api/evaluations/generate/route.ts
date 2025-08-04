import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { openai } from '@ai-sdk/openai'
import { AIEvaluationService } from '@/lib/ai/evaluation-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { teacher, evaluationType, schoolYear } = body

    // Validate required fields
    if (!teacher || !evaluationType || !schoolYear) {
      return NextResponse.json(
        { error: 'Missing required fields: teacher, evaluationType, schoolYear' },
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
    
    console.log('Server API Key Check:', { 
      hasAnthropicKey: !!hasAnthropicKey, 
      hasOpenAIKey: !!hasOpenAIKey,
      anthropicKey: process.env.ANTHROPIC_API_KEY ? 'present' : 'missing',
      openaiKey: process.env.OPENAI_API_KEY ? 'present' : 'missing'
    })
    
    // Use demo mode only if no API keys are available
    if (!hasAnthropicKey && !hasOpenAIKey) {
      console.log('No API keys found, using demo mode')
      const evaluationService = new AIEvaluationService()
      const demoResponse = evaluationService.generateDemoEvaluation(context)
      return NextResponse.json(demoResponse)
    }
    
    console.log('Using real AI with Claude Sonnet 4')
    
    // Build the prompt
    const prompt = buildInitialEvaluationPrompt(context)
    
    try {
      console.log('Attempting to generate with Claude Sonnet 4...')
      const { text } = await generateText({
        model: anthropic('claude-3-5-sonnet-20241022'),
        prompt,
        temperature: 0.7,
      })
      
      console.log('Claude generation successful!')
      
      const response = {
        evaluation: text,
        message: `I've generated a comprehensive ${evaluationType.toLowerCase()} evaluation for ${teacher.name}. Here's what I found based on their observations and performance data:`,
        suggestions: generateSuggestions(context)
      }
      
      return NextResponse.json(response)
    } catch (error) {
      console.error('Claude evaluation failed, falling back to GPT:', error)
      
      try {
        const { text } = await generateText({
          model: openai('gpt-4-turbo'),
          prompt,
          temperature: 0.7,
        })
        
        console.log('GPT fallback successful!')
        
        const response = {
          evaluation: text,
          message: `I've generated a comprehensive ${evaluationType.toLowerCase()} evaluation for ${teacher.name}. Here's what I found based on their observations and performance data:`,
          suggestions: generateSuggestions(context)
        }
        
        return NextResponse.json(response)
      } catch (gptError) {
        console.error('Both AI models failed, using demo mode:', gptError)
        const evaluationService = new AIEvaluationService()
        const demoResponse = evaluationService.generateDemoEvaluation(context)
        return NextResponse.json(demoResponse)
      }
    }
  } catch (error) {
    console.error('API route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function buildInitialEvaluationPrompt(context: any): string {
  const teacher = context.teacher
  const observations = context.previousObservations
  const evaluations = context.previousEvaluations
  
  return `You are an expert educational evaluator creating a comprehensive ${context.evaluationType} teacher evaluation.

TEACHER INFORMATION:
- Name: ${teacher.name}
- Subject: ${teacher.subject || 'Not specified'}
- Grade Level: ${teacher.gradeLevel || 'Not specified'}
- Years of Experience: ${teacher.yearsOfExperience || 'Not specified'}
- Current Goals: ${teacher.currentGoals ? JSON.stringify(teacher.currentGoals) : 'Not specified'}
- Strengths: ${teacher.strengths ? teacher.strengths.join(', ') : 'Not specified'}
- Growth Areas: ${teacher.growthAreas ? teacher.growthAreas.join(', ') : 'Not specified'}

EVALUATION CONTEXT:
- Type: ${context.evaluationType}
- School Year: ${context.schoolYear}
- Previous Observations: ${observations.length} total

RECENT OBSERVATIONS:
${observations.slice(0, 5).map((obs: any) => `
Date: ${obs.date.toLocaleDateString()}
Notes: ${obs.enhancedNotes || obs.rawNotes}
`).join('\n')}

PREVIOUS EVALUATIONS:
${evaluations.slice(0, 3).map((evaluation: any) => `
Date: ${evaluation.createdAt.toLocaleDateString()}
Type: ${evaluation.type}
Summary: ${evaluation.summary}
`).join('\n')}

INSTRUCTIONS:
Create a professional, comprehensive teacher evaluation report that includes:

1. EXECUTIVE SUMMARY (2-3 paragraphs)
2. STRENGTHS (bullet points with specific examples)
3. AREAS FOR GROWTH (bullet points with actionable feedback)
4. RECOMMENDATIONS (numbered list of specific next steps)
5. NEXT STEPS (timeline and follow-up actions)
6. Overall Rating (Proficient/Developing/Needs Improvement with numerical score)

Use specific examples from observations when available. Be constructive and actionable. Focus on evidence-based feedback. Use professional educational language.

Format the response as a clean, structured evaluation report.`
}

function generateSuggestions(context: any): string[] {
  return [
    "Add specific examples from recent observations",
    "Include measurable goals for the next evaluation period",
    "Suggest professional development opportunities",
    "Provide actionable feedback for growth areas"
  ]
} 