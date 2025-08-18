import { openai } from '@ai-sdk/openai'
import { anthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'
// Minimal domain types to decouple from Prisma client exports
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

export interface EvaluationContext {
  teacher: Teacher
  evaluationType: 'FORMATIVE' | 'SUMMATIVE'
  schoolYear: string
  previousObservations: Observation[]
  previousEvaluations: Evaluation[]
  chatHistory: ChatMessage[]
  frameworkText?: string
  promptGuidelines?: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface EvaluationResponse {
  evaluation: string
  message: string
  suggestions: string[]
}

export class AIEvaluationService {
  private static readonly ANTHROPIC_MODEL = 'claude-3-5-sonnet-20241022'
  private static readonly OPENAI_MODEL = 'gpt-4-turbo'
  private hasValidAPIKeys(): boolean {
    const hasAnthropicKey = !!(process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your_anthropic_key_here')
    const hasOpenAIKey = !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_key_here')
    return hasAnthropicKey || hasOpenAIKey
  }

  async generateInitialEvaluation(context: EvaluationContext): Promise<EvaluationResponse> {
    if (!this.hasValidAPIKeys()) {
      throw new Error('AI API keys are not configured')
    }

    const prompt = this.buildInitialEvaluationPrompt(context)
    
    try {
      const { text } = await generateText({
        model: anthropic(AIEvaluationService.ANTHROPIC_MODEL),
        prompt,
        temperature: 0.7,
      })
      
      return {
        evaluation: text,
        message: `I've generated a comprehensive ${context.evaluationType.toLowerCase()} evaluation for ${context.teacher.name}. Here's what I found based on their observations and performance data:`,
        suggestions: this.generateSuggestions()
      }
    } catch (error) {
      console.error('Claude evaluation failed, falling back to GPT:', error)
      
      try {
        const { text } = await generateText({
          model: openai(AIEvaluationService.OPENAI_MODEL),
          prompt,
          temperature: 0.7,
        })
        
        return {
          evaluation: text,
          message: `I've generated a comprehensive ${context.evaluationType.toLowerCase()} evaluation for ${context.teacher.name}. Here's what I found based on their observations and performance data:`,
          suggestions: this.generateSuggestions()
        }
      } catch (gptError) {
        console.error('Both AI models failed for initial evaluation:', gptError)
        throw new Error('AI generation failed')
      }
    }
  }

  async handleChatMessage(
    userMessage: string,
    context: EvaluationContext,
    currentEvaluation: string
  ): Promise<EvaluationResponse> {
    if (!this.hasValidAPIKeys()) {
      throw new Error('AI API keys are not configured')
    }

    const prompt = this.buildChatPrompt(userMessage, context, currentEvaluation)
    
    try {
      const { text } = await generateText({
        model: anthropic(AIEvaluationService.ANTHROPIC_MODEL),
        prompt,
        temperature: 0.7,
      })
      
      const { updatedEvaluation, message } = this.parseChatResponse(text, currentEvaluation)
      
      return {
        evaluation: updatedEvaluation,
        message,
        suggestions: []
      }
    } catch (error) {
      console.error('Claude chat failed, falling back to GPT:', error)
      
      try {
        const { text } = await generateText({
          model: openai(AIEvaluationService.OPENAI_MODEL),
          prompt,
          temperature: 0.7,
        })
        
        const { updatedEvaluation, message } = this.parseChatResponse(text, currentEvaluation)
        
        return {
          evaluation: updatedEvaluation,
          message,
          suggestions: []
        }
      } catch (gptError) {
        console.error('Both AI models failed for chat:', gptError)
        throw new Error('AI chat failed')
      }
    }
  }

  private buildInitialEvaluationPrompt(context: EvaluationContext): string {
    const frameworkText = (context.frameworkText ?? process.env.EVALUATION_FRAMEWORK_TEXT) || ''
    const guidelines = (context.promptGuidelines ?? process.env.EVALUATION_PROMPT_GUIDELINES) || ''
    const teacher = context.teacher
    const observations = context.previousObservations
    const evaluations = context.previousEvaluations
    
    return `You are an expert educational evaluator creating a comprehensive ${context.evaluationType} teacher evaluation.

TEACHER INFORMATION:
- Name: ${teacher.name}
- Subject: ${teacher.subject || 'Not specified'}
- Grade Level: ${teacher.gradeLevel || 'Not specified'}
- Strengths: ${teacher.strengths ? teacher.strengths.join(', ') : 'Not specified'}
- Growth Areas: ${teacher.growthAreas ? teacher.growthAreas.join(', ') : 'Not specified'}

EVALUATION CONTEXT:
- Type: ${context.evaluationType}
- School Year: ${context.schoolYear}
- Previous Observations: ${observations.length} total
${frameworkText ? `\nEVALUATION FRAMEWORK (reference):\n${frameworkText}\n` : ''}
${guidelines ? `\nPROMPT GUIDELINES:\n${guidelines}\n` : ''}

RECENT OBSERVATIONS:
${observations.slice(0, 5).map(obs => {
  const date = typeof obs.date === 'string' ? new Date(obs.date) : obs.date
  return `\nDate: ${date.toLocaleDateString()}\nNotes: ${obs.enhancedNotes || obs.rawNotes}\n`
}).join('')}

PREVIOUS EVALUATIONS:
${evaluations.slice(0, 3).map(evaluation => {
  const date = typeof evaluation.createdAt === 'string' ? new Date(evaluation.createdAt) : evaluation.createdAt
  return `\nDate: ${date.toLocaleDateString()}\nType: ${evaluation.type}\nSummary: ${evaluation.summary || ''}\n`
}).join('')}

INSTRUCTIONS:
Create a professional, comprehensive teacher evaluation report using Markdown formatting. Include:

1. **Executive Summary** (2-3 paragraphs)
2. **Strengths** (bullet points with specific examples)
3. **Areas for Growth** (bullet points with actionable feedback)
4. **Recommendations** (numbered list of specific next steps)
5. **Next Steps** (timeline and follow-up actions)
6. **Overall Rating** (Proficient/Developing/Needs Improvement with numerical score)

Use specific examples from observations when available. Be constructive and actionable. Focus on evidence-based feedback. Use professional educational language.

Format the response using proper Markdown syntax with headers, bullet points, and emphasis where appropriate.`
  }

  private buildChatPrompt(
    userMessage: string,
    context: EvaluationContext,
    currentEvaluation: string
  ): string {
    return `You are an AI assistant helping to refine a teacher evaluation through conversation.

CURRENT EVALUATION:
${currentEvaluation}

USER REQUEST:
${userMessage}

TEACHER CONTEXT:
- Name: ${context.teacher.name}
- Subject: ${context.teacher.subject}
- Grade Level: ${context.teacher.gradeLevel}
- Evaluation Type: ${context.evaluationType}

INSTRUCTIONS:
1. Understand what the user wants to change or add to the evaluation
2. Provide an updated version of the evaluation that incorporates their feedback
3. Keep the same professional structure and format
4. Maintain all relevant information while making the requested changes
5. Provide a brief message explaining what you've updated
6. Use proper Markdown formatting with headers (##), bullets, emphasis, and paragraph spacing
7. Never truncate content or use placeholder text like "[remaining sections as before]". Always return the full updated evaluation.

IMPORTANT: You must respond in exactly this format:

UPDATED EVALUATION:
[The complete updated evaluation with proper Markdown formatting]

MESSAGE:
[Brief explanation of changes made]

Do not include any other text before or after these sections.`
  }

  private parseChatResponse(response: string, currentEvaluation: string): { updatedEvaluation: string; message: string } {
    console.log('Parsing AI response:', response.substring(0, 200) + '...')
    
    // Try to find the sections with more flexible matching
    const evaluationMatch = response.match(/UPDATED EVALUATION:\s*([\s\S]*?)(?=MESSAGE:|$)/i)
    const messageMatch = response.match(/MESSAGE:\s*([\s\S]*?)$/i)
    
    if (evaluationMatch && messageMatch) {
      console.log('Successfully parsed structured response')
      return {
        updatedEvaluation: evaluationMatch[1].trim(),
        message: messageMatch[1].trim()
      }
    }
    
    // Fallback: if no structured format, try to extract just the evaluation part
    // Look for common evaluation section headers
    const evaluationSections = ['TEACHER EVALUATION REPORT', 'EXECUTIVE SUMMARY', 'STRENGTHS', 'AREAS FOR GROWTH']
    const hasEvaluationContent = evaluationSections.some(section => response.includes(section))
    
    if (hasEvaluationContent) {
      console.log('Found evaluation content, using full response as evaluation')
      return {
        updatedEvaluation: response.trim(),
        message: "I've updated the evaluation based on your feedback."
      }
    }
    
    // Last resort: return original evaluation with a note
    console.log('No evaluation content found, returning original')
    return {
      updatedEvaluation: currentEvaluation,
      message: "I couldn't parse the AI response properly. Please try rephrasing your request."
    }
  }

  private generateDemoEvaluation(context: EvaluationContext): EvaluationResponse {
    const teacher = context.teacher
    const evaluationType = context.evaluationType
    
    const demoEvaluation = `# Teacher Evaluation Report

**Teacher:** ${teacher.name}  
**Subject:** ${teacher.subject || 'Not specified'}  
**Grade Level:** ${teacher.gradeLevel || 'Not specified'}  
**Evaluation Type:** ${evaluationType}  
**School Year:** ${context.schoolYear}  
**Date:** ${new Date().toLocaleDateString()}

## Executive Summary

${teacher.name} demonstrates strong instructional practices with particular strengths in ${teacher.strengths?.slice(0, 2).join(' and ') || 'classroom management and student engagement'}. Based on recent observations, ${teacher.name} effectively uses ${teacher.strengths?.includes('Formative Assessment') ? 'formative assessment' : 'instructional strategies'} to guide instruction and support student learning.

The teacher consistently creates an engaging learning environment where students feel supported and challenged. Their ability to differentiate instruction and provide timely feedback contributes significantly to student growth and achievement.

## Strengths

${teacher.strengths?.map(strength => `- **${strength}** - Demonstrates exceptional skill in this area`).join('\n') || '- **Excellent classroom management** - Creates a structured, positive learning environment\n- **Strong instructional planning** - Develops well-organized, engaging lessons\n- **Effective use of differentiated instruction** - Adapts teaching methods to meet diverse student needs'}

## Areas for Growth

${teacher.growthAreas?.map(area => `- **${area}** - Opportunity for continued professional development`).join('\n') || '- **Technology integration** - Continue developing digital learning strategies\n- **Student-led discussions** - Enhance opportunities for collaborative learning\n- **Higher-order thinking** - Strengthen question development and critical thinking activities'}

## Recommendations

1. **Continue professional development** in differentiated instruction strategies
2. **Implement more collaborative learning** activities to enhance student engagement
3. **Enhance assessment strategies** and data analysis for improved student outcomes

## Next Steps

- Schedule follow-up observation in **6 weeks**
- Provide resources for **professional development**
- Continue current professional development plan
- Monitor progress on identified growth areas

---

**Overall Rating:** **Proficient (3.8/5.0)**`

    return {
      evaluation: demoEvaluation,
      message: `I've generated a comprehensive ${evaluationType.toLowerCase()} evaluation for ${teacher.name}. Here's what I found based on their observations and performance data:`,
      suggestions: this.generateSuggestions()
    }
  }

  public generateDemoChatResponse(
    userMessage: string,
    context: EvaluationContext,
    currentEvaluation: string
  ): EvaluationResponse {
    const lowerMessage = userMessage.toLowerCase()
    
    let updatedEvaluation = currentEvaluation
    let message = "I've updated the evaluation based on your feedback."

    // Regex-based section manipulation for Markdown headings
    const addBulletUnderHeading = (markdown: string, heading: string, bullet: string) => {
      const headingRegex = new RegExp(`(^|\n)##\\s+${heading}\\s*\n`, 'i')
      const match = markdown.match(headingRegex)
      if (!match) return markdown
      const insertIndex = (match.index ?? 0) + match[0].length
      return markdown.slice(0, insertIndex) + `- ${bullet}\n` + markdown.slice(insertIndex)
    }

    if (lowerMessage.includes('strength')) {
      updatedEvaluation = addBulletUnderHeading(
        updatedEvaluation,
        'Strengths',
        'Demonstrated excellent growth in instructional practices'
      )
      message = "I've added a new strength under the Strengths section."
    } else if (lowerMessage.includes('technology') || lowerMessage.includes('digital')) {
      updatedEvaluation = addBulletUnderHeading(
        updatedEvaluation,
        'Areas for Growth',
        'Enhance technology integration with purposeful student use'
      )
      message = "I added a technology-focused growth item."
    } else if (lowerMessage.includes('recommendation') || lowerMessage.includes('suggest')) {
      // Insert as next numbered item in Recommendations
      const recRegex = /(\n##\s+Recommendations\s*\n)([\s\S]*?)(\n##\s+|$)/i
      const match = updatedEvaluation.match(recRegex)
      if (match) {
        const listBlock = match[2]
        const nextNumber = (listBlock.match(/^\d+\./gm) || []).length + 1
        const injected = `${match[1]}${listBlock} ${nextNumber}. Consider implementing more student-centered learning approaches\n${match[3]}`
        updatedEvaluation = updatedEvaluation.replace(recRegex, injected)
      }
      message = "I added an additional recommendation."
    }
    
    return {
      evaluation: updatedEvaluation,
      message,
      suggestions: []
    }
  }

  private generateSuggestions(): string[] {
    return [
      "Ask me to add more specific examples from recent observations",
      "Request additional recommendations for professional development",
      "Ask me to adjust the tone or focus of any section"
    ]
  }
}

// Export singleton instance
export const evaluationService = new AIEvaluationService() 