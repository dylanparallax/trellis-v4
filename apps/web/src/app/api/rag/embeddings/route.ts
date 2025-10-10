import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth/server'
import { 
  batchUpdateObservationEmbeddings, 
  batchUpdateEvaluationEmbeddings,
  updateObservationEmbedding,
  updateEvaluationEmbedding
} from '@/lib/ai/embedding-service'
import { z } from 'zod'

const batchUpdateSchema = z.object({
  type: z.enum(['observations', 'evaluations', 'both']),
  schoolId: z.string().optional(),
})

const singleUpdateSchema = z.object({
  id: z.string(),
  type: z.enum(['observation', 'evaluation']),
})

export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext()
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only allow ADMIN and DISTRICT_ADMIN to manage embeddings
    if (!['ADMIN', 'DISTRICT_ADMIN'].includes(authContext.role)) {
      return NextResponse.json({ 
        error: 'Forbidden - Embedding management is only available to administrators' 
      }, { status: 403 })
    }

    const body = await request.json()
    const action = body.action || 'batch'

    switch (action) {
      case 'batch': {
        const validation = batchUpdateSchema.safeParse(body)
        if (!validation.success) {
          return NextResponse.json({ 
            error: 'Invalid request', 
            details: validation.error.errors 
          }, { status: 400 })
        }

        const { type, schoolId } = validation.data

        // Determine which school to process based on user role
        let targetSchoolId = schoolId
        if (authContext.role === 'ADMIN' && !schoolId) {
          // Admin can only process their own school if no schoolId specified
          targetSchoolId = authContext.schoolId
        } else if (authContext.role === 'ADMIN' && schoolId && schoolId !== authContext.schoolId) {
          // Admin cannot process other schools
          return NextResponse.json({ 
            error: 'Forbidden - You can only process embeddings for your own school' 
          }, { status: 403 })
        }

        const results = { observations: 0, evaluations: 0 }

        try {
          if (type === 'observations' || type === 'both') {
            await batchUpdateObservationEmbeddings(targetSchoolId)
            results.observations = 1 // Simplified - actual count would require additional query
          }

          if (type === 'evaluations' || type === 'both') {
            await batchUpdateEvaluationEmbeddings(targetSchoolId)
            results.evaluations = 1 // Simplified - actual count would require additional query
          }

          return NextResponse.json({
            message: 'Batch embedding update completed',
            processed: results,
            schoolId: targetSchoolId,
            scope: authContext.role === 'DISTRICT_ADMIN' ? 'district' : 'school'
          })
        } catch (error) {
          console.error('Batch embedding update error:', error)
          return NextResponse.json({ 
            error: 'Failed to update embeddings',
            message: error instanceof Error ? error.message : 'Unknown error'
          }, { status: 500 })
        }
      }

      case 'single': {
        const validation = singleUpdateSchema.safeParse(body)
        if (!validation.success) {
          return NextResponse.json({ 
            error: 'Invalid request', 
            details: validation.error.errors 
          }, { status: 400 })
        }

        const { id, type } = validation.data

        try {
          if (type === 'observation') {
            await updateObservationEmbedding(id)
          } else {
            await updateEvaluationEmbedding(id)
          }

          return NextResponse.json({
            message: `${type} embedding updated successfully`,
            id,
            type
          })
        } catch (error) {
          console.error('Single embedding update error:', error)
          return NextResponse.json({ 
            error: `Failed to update ${type} embedding`,
            message: error instanceof Error ? error.message : 'Unknown error'
          }, { status: 500 })
        }
      }

      default:
        return NextResponse.json({ 
          error: 'Invalid action. Supported actions: batch, single' 
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Embedding management error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext()
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only allow ADMIN and DISTRICT_ADMIN to view embedding status
    if (!['ADMIN', 'DISTRICT_ADMIN'].includes(authContext.role)) {
      return NextResponse.json({ 
        error: 'Forbidden - Embedding status is only available to administrators' 
      }, { status: 403 })
    }

    return NextResponse.json({
      message: 'Embedding management endpoint',
      availableActions: ['batch', 'single'],
      batchTypes: ['observations', 'evaluations', 'both'],
      singleTypes: ['observation', 'evaluation'],
      userRole: authContext.role,
      scope: authContext.role === 'DISTRICT_ADMIN' ? 'district' : 'school'
    })
  } catch (error) {
    console.error('Embedding status error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}