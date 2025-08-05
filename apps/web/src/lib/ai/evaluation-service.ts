import { openai } from '@ai-sdk/openai'
import { anthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'
import type { Teacher, Observation, Evaluation } from '@trellis/database'

export interface EvaluationContext {
  teacher: Teacher
  evaluationType: 'FORMATIVE' | 'SUMMATIVE'
  schoolYear: string
  previousObservations: Observation[]
  previousEvaluations: Evaluation[]
  chatHistory: ChatMessage[]
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
  private hasValidAPIKeys(): boolean {
    const hasAnthropicKey = !!(process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your_anthropic_key_here')
    const hasOpenAIKey = !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_key_here')
    return hasAnthropicKey || hasOpenAIKey
  }

  async generateInitialEvaluation(context: EvaluationContext): Promise<EvaluationResponse> {
    if (!this.hasValidAPIKeys()) {
      return this.generateDemoEvaluation(context)
    }

    const prompt = this.buildInitialEvaluationPrompt(context)
    
    try {
      const { text } = await generateText({
        model: anthropic('claude-sonnet-4-20250514'),
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
          model: openai('gpt-4-turbo'),
          prompt,
          temperature: 0.7,
        })
        
        return {
          evaluation: text,
          message: `I've generated a comprehensive ${context.evaluationType.toLowerCase()} evaluation for ${context.teacher.name}. Here's what I found based on their observations and performance data:`,
          suggestions: this.generateSuggestions()
        }
      } catch (gptError) {
        console.error('Both AI models failed, using demo mode:', gptError)
        return this.generateDemoEvaluation(context)
      }
    }
  }

  async handleChatMessage(
    userMessage: string,
    context: EvaluationContext,
    currentEvaluation: string
  ): Promise<EvaluationResponse> {
    if (!this.hasValidAPIKeys()) {
      return this.generateDemoChatResponse(userMessage, context, currentEvaluation)
    }

    const prompt = this.buildChatPrompt(userMessage, context, currentEvaluation)
    
    try {
      const { text } = await generateText({
        model: anthropic('claude-sonnet-4-20250514'),
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
          model: openai('gpt-4-turbo'),
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
        console.error('Both AI models failed for chat, using demo mode:', gptError)
        return this.generateDemoChatResponse(userMessage, context, currentEvaluation)
      }
    }
  }

  private buildInitialEvaluationPrompt(context: EvaluationContext): string {
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

RECENT OBSERVATIONS:
${observations.slice(0, 5).map(obs => `
Date: ${obs.date.toLocaleDateString()}
Notes: ${obs.enhancedNotes || obs.rawNotes}
`).join('\n')}

PREVIOUS EVALUATIONS:
${evaluations.slice(0, 3).map(evaluation => `
Date: ${evaluation.createdAt.toLocaleDateString()}
Type: ${evaluation.type}
Summary: ${evaluation.summary}
`).join('\n')}

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
6. Use proper Markdown formatting with headers, bullet points, and emphasis

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
    const teacher = context.teacher
    const lowerMessage = userMessage.toLowerCase()
    
    let updatedEvaluation = currentEvaluation
    let message = "I've updated the evaluation based on your feedback."
    
    if (lowerMessage.includes('strength') || lowerMessage.includes('strong')) {
      updatedEvaluation = currentEvaluation.replace(
        'STRENGTHS',
        'STRENGTHS\n• Additional strength: Demonstrated excellent growth in instructional practices'
      )
      message = "I've added more specific details about your strengths in the evaluation."
    } else if (lowerMessage.includes('technology') || lowerMessage.includes('digital')) {
      updatedEvaluation = currentEvaluation.replace(
        'AREAS FOR GROWTH',
        'AREAS FOR GROWTH\n• Enhanced technology integration opportunities'
      )
      message = "I've updated the evaluation to include more technology integration suggestions."
    } else if (lowerMessage.includes('recommendation') || lowerMessage.includes('suggest')) {
      updatedEvaluation = currentEvaluation.replace(
        'RECOMMENDATIONS',
        'RECOMMENDATIONS\n4. Consider implementing more student-centered learning approaches'
      )
      message = "I've added an additional recommendation to the evaluation."
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