import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth/server'
import { semanticSearch, findSimilarItems, getEmbeddingStats } from '@/lib/ai/vector-search'
import { z } from 'zod'

const searchSchema = z.object({
  query: z.string().min(1).max(1000),
  limit: z.number().int().min(1).max(50).optional().default(20),
  minScore: z.number().min(0).max(1).optional().default(0.7),
  teacherId: z.string().optional(),
  type: z.enum(['observation', 'evaluation', 'both']).optional().default('both'),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
})

const similarItemsSchema = z.object({
  itemId: z.string(),
  itemType: z.enum(['observation', 'evaluation']),
  limit: z.number().int().min(1).max(20).optional().default(10),
  minScore: z.number().min(0).max(1).optional().default(0.6),
})

export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext()
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only allow ADMIN and DISTRICT_ADMIN to use RAG search
    if (!['ADMIN', 'DISTRICT_ADMIN'].includes(authContext.role)) {
      return NextResponse.json({ 
        error: 'Forbidden - RAG search is only available to administrators' 
      }, { status: 403 })
    }

    const body = await request.json()
    const action = body.action || 'search'

    switch (action) {
      case 'search': {
        const validation = searchSchema.safeParse(body)
        if (!validation.success) {
          return NextResponse.json({ 
            error: 'Invalid request', 
            details: validation.error.errors 
          }, { status: 400 })
        }

        const { query, limit, minScore, teacherId, type, dateFrom, dateTo } = validation.data

        const results = await semanticSearch(query, authContext, {
          limit,
          minScore,
          teacherId,
          type,
          dateFrom: dateFrom ? new Date(dateFrom) : undefined,
          dateTo: dateTo ? new Date(dateTo) : undefined,
        })

        return NextResponse.json({
          results,
          query,
          totalResults: results.length,
          scope: authContext.role === 'DISTRICT_ADMIN' ? 'district' : 'school'
        })
      }

      case 'similar': {
        const validation = similarItemsSchema.safeParse(body)
        if (!validation.success) {
          return NextResponse.json({ 
            error: 'Invalid request', 
            details: validation.error.errors 
          }, { status: 400 })
        }

        const { itemId, itemType, limit, minScore } = validation.data

        const results = await findSimilarItems(itemId, itemType, authContext, {
          limit,
          minScore
        })

        return NextResponse.json({
          results,
          sourceItem: { id: itemId, type: itemType },
          totalResults: results.length,
          scope: authContext.role === 'DISTRICT_ADMIN' ? 'district' : 'school'
        })
      }

      case 'stats': {
        const stats = await getEmbeddingStats(authContext)
        return NextResponse.json({
          stats,
          scope: authContext.role === 'DISTRICT_ADMIN' ? 'district' : 'school'
        })
      }

      default:
        return NextResponse.json({ 
          error: 'Invalid action. Supported actions: search, similar, stats' 
        }, { status: 400 })
    }
  } catch (error) {
    console.error('RAG search error:', error)
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

    // Only allow ADMIN and DISTRICT_ADMIN to use RAG search
    if (!['ADMIN', 'DISTRICT_ADMIN'].includes(authContext.role)) {
      return NextResponse.json({ 
        error: 'Forbidden - RAG search is only available to administrators' 
      }, { status: 403 })
    }

    // Return embedding statistics
    const stats = await getEmbeddingStats(authContext)
    return NextResponse.json({
      stats,
      scope: authContext.role === 'DISTRICT_ADMIN' ? 'district' : 'school',
      capabilities: {
        canSearchDistrict: authContext.role === 'DISTRICT_ADMIN',
        canSearchSchool: ['ADMIN', 'DISTRICT_ADMIN'].includes(authContext.role),
      }
    })
  } catch (error) {
    console.error('RAG stats error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}