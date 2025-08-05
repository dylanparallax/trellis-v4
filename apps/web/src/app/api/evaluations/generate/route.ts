import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { openai } from '@ai-sdk/openai'
import { AIEvaluationService } from '@/lib/ai/evaluation-service'

// Add proper types
interface Teacher {
  name: string
  subject?: string
  gradeLevel?: string
  yearsOfExperience?: number
  currentGoals?: Array<{ goal: string; progress: number }>
  strengths?: string[]
  growthAreas?: string[]
}

interface Observation {
  date: Date
  enhancedNotes?: string
  rawNotes?: string
}

interface Evaluation {
  createdAt: Date
  type: string
  summary: string
}

interface EvaluationContext {
  teacher: Teacher
  evaluationType: string
  schoolYear: string
  previousObservations: Observation[]
  previousEvaluations: Evaluation[]
}

export async function POST(request: NextRequest) {
  try {
    const { teacherId, evaluationType, schoolYear } = await request.json()

    // Fetch teacher data
    const teacherResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/teachers/${teacherId}`)
    const teacher = await teacherResponse.json()

    // Fetch previous observations
    const observationsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/observations?teacherId=${teacherId}`)
    const observations = await observationsResponse.json()

    // Fetch previous evaluations
    const evaluationsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/evaluations?teacherId=${teacherId}`)
    const evaluations = await evaluationsResponse.json()

    // Create evaluation context
    const context: EvaluationContext = {
      teacher,
      evaluationType,
      schoolYear,
      previousObservations: observations,
      previousEvaluations: evaluations
    }

    const prompt = buildInitialEvaluationPrompt(context)

    try {
      const { text } = await generateText({
        model: anthropic('claude-3-5-sonnet-20241022'),
        prompt,
        temperature: 0.7,
      })
      
      console.log('Claude evaluation successful!')
      
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

function buildInitialEvaluationPrompt(context: EvaluationContext): string {
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
${observations.slice(0, 5).map((obs: Observation) => `
Date: ${obs.date.toLocaleDateString()}
Notes: ${obs.enhancedNotes || obs.rawNotes}
`).join('\n')}

PREVIOUS EVALUATIONS:
${evaluations.slice(0, 3).map((evaluation: Evaluation) => `
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

function generateSuggestions(context: EvaluationContext): string[] {
  return [
    "Add specific examples from recent observations",
    "Include measurable goals for the next evaluation period",
    "Suggest professional development opportunities",
    "Provide actionable feedback for growth areas"
  ]
} 