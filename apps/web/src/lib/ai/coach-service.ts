import { openai } from '@ai-sdk/openai'
import { anthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'

type Teacher = {
  id: string
  name: string
  subject?: string
  gradeLevel?: string
  strengths?: string[]
  growthAreas?: string[]
}

type Observation = {
  date: Date | string
  enhancedNotes?: string
  rawNotes: string
}

type Evaluation = {
  createdAt: Date | string
  type: string
  summary?: string
}

export interface CoachContext {
  teacher: Teacher
  evaluationType: 'FORMATIVE' | 'SUMMATIVE' | 'MID_YEAR' | 'END_YEAR'
  schoolYear: string
  previousObservations: Observation[]
  previousEvaluations: Evaluation[]
}

export interface CoachResponse {
  message: string
}

export class AICoachService {
  private static readonly ANTHROPIC_MODEL = 'claude-sonnet-4-5-20250929'
  private static readonly OPENAI_MODEL = 'gpt-5-nano-2025-08-07'

  private hasValidAPIKeys(): boolean {
    const hasAnthropicKey = !!(process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your_anthropic_key_here')
    const hasOpenAIKey = !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_key_here')
    return hasAnthropicKey || hasOpenAIKey
  }

  async handleMessage(userMessage: string, context: CoachContext): Promise<CoachResponse> {
    if (!this.hasValidAPIKeys()) {
      throw new Error('AI API keys are not configured')
    }

    const prompt = this.buildCoachPrompt(userMessage, context)

    try {
      const { text } = await generateText({
        model: anthropic(AICoachService.ANTHROPIC_MODEL),
        prompt,
        temperature: 0.7,
      })
      return { message: text.trim() }
    } catch (err) {
      console.error('Claude coach failed, falling back to GPT:', err)
      const { text } = await generateText({
        model: openai(AICoachService.OPENAI_MODEL),
        prompt,
        temperature: 0.7,
      })
      return { message: text.trim() }
    }
  }

  private buildCoachPrompt(userMessage: string, context: CoachContext): string {
    const teacher = context.teacher
    const previousObservations = context.previousObservations
    const previousEvaluations = context.previousEvaluations

    return `You are a professional development coach for K-12 teachers. Your tone is empathetic, growth-oriented, and practical.

TEACHER CONTEXT:
- Name: ${teacher.name}
- Subject: ${teacher.subject || 'Not specified'}
- Grade Level: ${teacher.gradeLevel || 'Not specified'}
- Strengths: ${teacher.strengths?.join(', ') || 'Not specified'}
- Growth Areas: ${teacher.growthAreas?.join(', ') || 'Not specified'}
- Evaluation Type: ${context.evaluationType}
- School Year: ${context.schoolYear}

RECENT OBSERVATIONS (high level):
${previousObservations.slice(0, 3).map(o => {
  const d = (typeof o.date === 'string' ? new Date(o.date) : o.date).toLocaleDateString()
  return `- ${d}: ${o.enhancedNotes || o.rawNotes}`
}).join('\n')}

PRIOR EVALUATIONS (high level):
${previousEvaluations.slice(0, 2).map(e => {
  const d = (typeof e.createdAt === 'string' ? new Date(e.createdAt) : e.createdAt).toLocaleDateString()
  return `- ${d} (${e.type}): ${e.summary || ''}`
}).join('\n')}

TEACHER QUESTION:
${userMessage}

INSTRUCTIONS:
- Respond with concise, supportive coaching that the teacher can try this week.
- Include: 2–3 actionable strategies; 1 reflective question; 1 resource or example.
- DO NOT modify or restate the evaluation text. Message only.
- Use clear bullets and short paragraphs.
- Format the response with clear sections and bullet points for readability.
`
  }
}

export const coachService = new AICoachService()


