import { OpenAI } from 'openai'
import { prisma } from '@trellis/database'
import type { Observation, Evaluation, Teacher } from '@trellis/types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const EMBEDDING_MODEL = 'text-embedding-3-small'
export const EMBEDDING_DIMENSION = 1536

/**
 * Generate embedding text from observation data
 */
export function generateObservationEmbeddingText(
  observation: Observation & { teacher: Pick<Teacher, 'name' | 'subject' | 'gradeLevel'> }
): string {
  const parts = []
  
  // Teacher context
  parts.push(`Teacher: ${observation.teacher.name}`)
  if (observation.teacher.subject) parts.push(`Subject: ${observation.teacher.subject}`)
  if (observation.teacher.gradeLevel) parts.push(`Grade: ${observation.teacher.gradeLevel}`)
  
  // Observation metadata
  parts.push(`Date: ${observation.date.toISOString().split('T')[0]}`)
  parts.push(`Type: ${observation.observationType}`)
  if (observation.subject) parts.push(`Lesson Subject: ${observation.subject}`)
  if (observation.duration) parts.push(`Duration: ${observation.duration} minutes`)
  
  // Focus areas
  const focusAreas = typeof observation.focusAreas === 'string' 
    ? JSON.parse(observation.focusAreas) 
    : observation.focusAreas
  if (focusAreas?.length > 0) {
    parts.push(`Focus Areas: ${focusAreas.join(', ')}`)
  }
  
  // Main content
  parts.push(`Raw Notes: ${observation.rawNotes}`)
  if (observation.enhancedNotes) {
    parts.push(`Enhanced Notes: ${observation.enhancedNotes}`)
  }
  
  return parts.join('\n\n')
}

/**
 * Generate embedding text from evaluation data
 */
export function generateEvaluationEmbeddingText(
  evaluation: Evaluation & { teacher: Pick<Teacher, 'name' | 'subject' | 'gradeLevel'> }
): string {
  const parts = []
  
  // Teacher context
  parts.push(`Teacher: ${evaluation.teacher.name}`)
  if (evaluation.teacher.subject) parts.push(`Subject: ${evaluation.teacher.subject}`)
  if (evaluation.teacher.gradeLevel) parts.push(`Grade: ${evaluation.teacher.gradeLevel}`)
  
  // Evaluation metadata
  parts.push(`Type: ${evaluation.type}`)
  parts.push(`Status: ${evaluation.status}`)
  parts.push(`Date: ${evaluation.createdAt.toISOString().split('T')[0]}`)
  
  // Content
  if (evaluation.summary) {
    parts.push(`Summary: ${evaluation.summary}`)
  }
  
  // Recommendations and next steps
  const recommendations = typeof evaluation.recommendations === 'string' 
    ? JSON.parse(evaluation.recommendations) 
    : evaluation.recommendations
  if (recommendations?.length > 0) {
    parts.push(`Recommendations: ${recommendations.join('; ')}`)
  }
  
  const nextSteps = typeof evaluation.nextSteps === 'string' 
    ? JSON.parse(evaluation.nextSteps) 
    : evaluation.nextSteps
  if (nextSteps?.length > 0) {
    parts.push(`Next Steps: ${nextSteps.join('; ')}`)
  }
  
  // Structured content
  if (evaluation.content && typeof evaluation.content === 'object') {
    const contentText = extractTextFromContent(evaluation.content)
    if (contentText) {
      parts.push(`Evaluation Content: ${contentText}`)
    }
  }
  
  return parts.join('\n\n')
}

/**
 * Extract text from structured evaluation content
 */
function extractTextFromContent(content: any): string {
  if (!content || typeof content !== 'object') return ''
  
  const texts: string[] = []
  
  function extractRecursive(obj: any, prefix = '') {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string' && value.trim()) {
        texts.push(`${prefix}${key}: ${value}`)
      } else if (typeof value === 'object' && value !== null) {
        extractRecursive(value, `${prefix}${key} - `)
      }
    }
  }
  
  extractRecursive(content)
  return texts.join('; ')
}

/**
 * Generate embedding vector using OpenAI
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
      encoding_format: 'float',
    })
    
    return response.data[0].embedding
  } catch (error) {
    console.error('Error generating embedding:', error)
    throw new Error('Failed to generate embedding')
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length')
  }
  
  let dotProduct = 0
  let normA = 0
  let normB = 0
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

/**
 * Update observation embedding
 */
export async function updateObservationEmbedding(observationId: string): Promise<void> {
  try {
    const observation = await prisma.observation.findUnique({
      where: { id: observationId },
      include: {
        teacher: {
          select: { name: true, subject: true, gradeLevel: true }
        }
      }
    })
    
    if (!observation) {
      throw new Error('Observation not found')
    }
    
    const embeddingText = generateObservationEmbeddingText(observation)
    const embedding = await generateEmbedding(embeddingText)
    
    await prisma.observation.update({
      where: { id: observationId },
      data: {
        embedding: JSON.stringify(embedding),
        embeddingText,
        embeddingVersion: EMBEDDING_MODEL,
        embeddedAt: new Date(),
      }
    })
  } catch (error) {
    console.error('Error updating observation embedding:', error)
    throw error
  }
}

/**
 * Update evaluation embedding
 */
export async function updateEvaluationEmbedding(evaluationId: string): Promise<void> {
  try {
    const evaluation = await prisma.evaluation.findUnique({
      where: { id: evaluationId },
      include: {
        teacher: {
          select: { name: true, subject: true, gradeLevel: true }
        }
      }
    })
    
    if (!evaluation) {
      throw new Error('Evaluation not found')
    }
    
    const embeddingText = generateEvaluationEmbeddingText(evaluation)
    const embedding = await generateEmbedding(embeddingText)
    
    await prisma.evaluation.update({
      where: { id: evaluationId },
      data: {
        embedding: JSON.stringify(embedding),
        embeddingText,
        embeddingVersion: EMBEDDING_MODEL,
        embeddedAt: new Date(),
      }
    })
  } catch (error) {
    console.error('Error updating evaluation embedding:', error)
    throw error
  }
}

/**
 * Batch update embeddings for all observations without embeddings
 */
export async function batchUpdateObservationEmbeddings(schoolId?: string): Promise<void> {
  try {
    const whereClause = {
      embedding: null,
      ...(schoolId && { schoolId })
    }
    
    const observations = await prisma.observation.findMany({
      where: whereClause,
      include: {
        teacher: {
          select: { name: true, subject: true, gradeLevel: true }
        }
      },
      take: 50 // Process in batches to avoid rate limits
    })
    
    console.log(`Processing ${observations.length} observations for embeddings`)
    
    for (const observation of observations) {
      try {
        await updateObservationEmbedding(observation.id)
        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        console.error(`Failed to update embedding for observation ${observation.id}:`, error)
      }
    }
  } catch (error) {
    console.error('Error in batch update:', error)
    throw error
  }
}

/**
 * Batch update embeddings for all evaluations without embeddings
 */
export async function batchUpdateEvaluationEmbeddings(schoolId?: string): Promise<void> {
  try {
    const whereClause = {
      embedding: null,
      ...(schoolId && { schoolId })
    }
    
    const evaluations = await prisma.evaluation.findMany({
      where: whereClause,
      include: {
        teacher: {
          select: { name: true, subject: true, gradeLevel: true }
        }
      },
      take: 50 // Process in batches to avoid rate limits
    })
    
    console.log(`Processing ${evaluations.length} evaluations for embeddings`)
    
    for (const evaluation of evaluations) {
      try {
        await updateEvaluationEmbedding(evaluation.id)
        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        console.error(`Failed to update embedding for evaluation ${evaluation.id}:`, error)
      }
    }
  } catch (error) {
    console.error('Error in batch update:', error)
    throw error
  }
}