import { openai } from '@ai-sdk/openai'
import { anthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'
import { OBSERVATION_ENHANCEMENT_PROMPT } from '@trellis/ai-prompts'
// Minimal domain types to avoid Prisma type coupling
type Teacher = {
  name: string
  subject?: string
  gradeLevel?: string
  currentGoals?: unknown
  strengths: string[]
  growthAreas: string[]
}

type Observation = {
  date: Date | string
  enhancedNotes?: string
  rawNotes: string
}

export class AIEnhancementService {
  private static readonly ANTHROPIC_MODEL = 'claude-sonnet-4-5-20250929'
  private static readonly OPENAI_MODEL = 'gpt-4-turbo'
  async enhanceObservation(
    rawNotes: string,
    teacher: Teacher,
    previousObservations: Observation[]
  ) {
    const prompt = this.buildEnhancementPrompt(
      rawNotes,
      teacher,
      previousObservations
    )
    
    try {
      // Try Claude first
      const { text } = await generateText({
        model: anthropic(AIEnhancementService.ANTHROPIC_MODEL),
        prompt,
        temperature: 0.7,
      })
      
      return text
    } catch (error) {
      console.error('Claude enhancement failed, falling back to GPT:', error)
      
      // Fallback to GPT
      const { text } = await generateText({
        model: openai(AIEnhancementService.OPENAI_MODEL),
        prompt,
        temperature: 0.7,
      })
      
      return text
    }
  }
  
  private buildEnhancementPrompt(
    notes: string,
    teacher: Teacher,
    history: Observation[]
  ) {
    const teacherContext = `
      Name: ${teacher.name}
      Subject: ${teacher.subject || 'Not specified'}
      Grade Level: ${teacher.gradeLevel || 'Not specified'}
      Current Goals: ${JSON.stringify(teacher.currentGoals)}
      Strengths: ${teacher.strengths.join(', ')}
      Growth Areas: ${teacher.growthAreas.join(', ')}
    `
    
    const previousObservations = history
      .slice(0, 5)
      .map((obs) => {
        const date = typeof obs.date === 'string' ? new Date(obs.date) : obs.date
        return `- ${date.toLocaleDateString()}: ${obs.enhancedNotes || obs.rawNotes}`
      })
      .join('\n')
    
    const schoolPriorities = 'Focus on student engagement, differentiated instruction, and assessment strategies'
    
    return OBSERVATION_ENHANCEMENT_PROMPT
      .replace('{teacherContext}', teacherContext)
      .replace('{observationNotes}', notes)
      .replace('{previousObservations}', previousObservations || 'No previous observations')
      .replace('{schoolPriorities}', schoolPriorities)
  }
  
  async analyzeArtifact(
    artifactContent: string,
    artifactType: string,
    teacher: Teacher
  ) {
    const prompt = `
      You are analyzing educational artifacts (lesson plans, student work, etc.) to provide insights for teacher evaluation.
      
      ARTIFACT TYPE: ${artifactType}
      ARTIFACT CONTENT: ${artifactContent}
      TEACHER CONTEXT: ${teacher.name} - ${teacher.subject} - ${teacher.gradeLevel}
      
      Please analyze this artifact and provide:
      1. Evidence of instructional planning and execution
      2. Alignment with learning objectives
      3. Assessment of student engagement and learning
      4. Areas of strength demonstrated
      5. Opportunities for improvement
      6. Connection to broader instructional practices
      
      Focus on specific, observable evidence rather than assumptions.
    `
    
    try {
      const { text } = await generateText({
        model: anthropic(AIEnhancementService.ANTHROPIC_MODEL),
        prompt,
        temperature: 0.5,
      })
      
      return text
    } catch (error) {
      console.error('Artifact analysis failed:', error)
      throw new Error('Failed to analyze artifact')
    }
  }
} 