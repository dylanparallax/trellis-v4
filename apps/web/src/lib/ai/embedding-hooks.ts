import { updateObservationEmbedding, updateEvaluationEmbedding } from './embedding-service'

/**
 * Hook to automatically generate embeddings for new observations
 * Call this after creating a new observation
 */
export async function onObservationCreated(observationId: string): Promise<void> {
  try {
    // Generate embedding in the background
    setTimeout(async () => {
      try {
        await updateObservationEmbedding(observationId)
        console.log(`Generated embedding for observation ${observationId}`)
      } catch (error) {
        console.error(`Failed to generate embedding for observation ${observationId}:`, error)
      }
    }, 1000) // Small delay to ensure the observation is fully saved
  } catch (error) {
    console.error('Error in onObservationCreated hook:', error)
  }
}

/**
 * Hook to automatically generate embeddings for new evaluations
 * Call this after creating a new evaluation
 */
export async function onEvaluationCreated(evaluationId: string): Promise<void> {
  try {
    // Generate embedding in the background
    setTimeout(async () => {
      try {
        await updateEvaluationEmbedding(evaluationId)
        console.log(`Generated embedding for evaluation ${evaluationId}`)
      } catch (error) {
        console.error(`Failed to generate embedding for evaluation ${evaluationId}:`, error)
      }
    }, 1000) // Small delay to ensure the evaluation is fully saved
  } catch (error) {
    console.error('Error in onEvaluationCreated hook:', error)
  }
}

/**
 * Hook to update embeddings when observations are updated
 * Call this after updating an observation's content
 */
export async function onObservationUpdated(observationId: string): Promise<void> {
  try {
    // Regenerate embedding in the background
    setTimeout(async () => {
      try {
        await updateObservationEmbedding(observationId)
        console.log(`Updated embedding for observation ${observationId}`)
      } catch (error) {
        console.error(`Failed to update embedding for observation ${observationId}:`, error)
      }
    }, 1000)
  } catch (error) {
    console.error('Error in onObservationUpdated hook:', error)
  }
}

/**
 * Hook to update embeddings when evaluations are updated
 * Call this after updating an evaluation's content
 */
export async function onEvaluationUpdated(evaluationId: string): Promise<void> {
  try {
    // Regenerate embedding in the background
    setTimeout(async () => {
      try {
        await updateEvaluationEmbedding(evaluationId)
        console.log(`Updated embedding for evaluation ${evaluationId}`)
      } catch (error) {
        console.error(`Failed to update embedding for evaluation ${evaluationId}:`, error)
      }
    }, 1000)
  } catch (error) {
    console.error('Error in onEvaluationUpdated hook:', error)
  }
}