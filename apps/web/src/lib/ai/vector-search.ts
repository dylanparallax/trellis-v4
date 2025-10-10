import { prisma } from '@trellis/database'
import { generateEmbedding, cosineSimilarity } from './embedding-service'
import type { AuthContext } from '../auth/server'

export interface SearchResult {
  id: string
  type: 'observation' | 'evaluation'
  score: number
  teacherName: string
  teacherId: string
  schoolId: string
  date: Date
  title: string
  snippet: string
  metadata: {
    subject?: string
    gradeLevel?: string
    observationType?: string
    evaluationType?: string
    focusAreas?: string[]
  }
}

export interface SearchOptions {
  limit?: number
  minScore?: number
  teacherId?: string
  schoolId?: string
  dateFrom?: Date
  dateTo?: Date
  type?: 'observation' | 'evaluation' | 'both'
}

/**
 * Perform semantic search across observations and evaluations
 */
export async function semanticSearch(
  query: string,
  authContext: AuthContext,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const {
    limit = 20,
    minScore = 0.7,
    teacherId,
    type = 'both',
    dateFrom,
    dateTo
  } = options

  // Generate embedding for the search query
  const queryEmbedding = await generateEmbedding(query)
  
  const results: SearchResult[] = []
  
  // Determine search scope based on user role
  const searchScope = getSearchScope(authContext)
  
  // Search observations
  if (type === 'observation' || type === 'both') {
    const observations = await searchObservations(
      queryEmbedding,
      searchScope,
      { teacherId, dateFrom, dateTo, limit: Math.ceil(limit / 2) }
    )
    results.push(...observations)
  }
  
  // Search evaluations
  if (type === 'evaluation' || type === 'both') {
    const evaluations = await searchEvaluations(
      queryEmbedding,
      searchScope,
      { teacherId, dateFrom, dateTo, limit: Math.ceil(limit / 2) }
    )
    results.push(...evaluations)
  }
  
  // Sort by score and filter by minimum score
  return results
    .filter(result => result.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

/**
 * Get search scope based on user role
 */
function getSearchScope(authContext: AuthContext) {
  switch (authContext.role) {
    case 'DISTRICT_ADMIN':
      // Can search across all schools in the district
      return { type: 'district' as const, schoolId: authContext.schoolId }
    case 'ADMIN':
      // Can search within their school
      return { type: 'school' as const, schoolId: authContext.schoolId }
    case 'EVALUATOR':
      // Can search within their school
      return { type: 'school' as const, schoolId: authContext.schoolId }
    case 'TEACHER':
      // Can only search their own data
      return { type: 'teacher' as const, teacherId: authContext.userId, schoolId: authContext.schoolId }
    default:
      throw new Error('Invalid user role')
  }
}

/**
 * Search observations with vector similarity
 */
async function searchObservations(
  queryEmbedding: number[],
  scope: ReturnType<typeof getSearchScope>,
  options: { teacherId?: string; dateFrom?: Date; dateTo?: Date; limit: number }
): Promise<SearchResult[]> {
  // Build where clause based on scope and filters
  const whereClause: any = {
    embedding: { not: null },
    embeddedAt: { not: null }
  }
  
  // Apply scope restrictions
  if (scope.type === 'school') {
    whereClause.schoolId = scope.schoolId
  } else if (scope.type === 'teacher') {
    whereClause.teacherId = scope.teacherId
    whereClause.schoolId = scope.schoolId
  } else if (scope.type === 'district') {
    // For district admin, we need to find all schools in the district
    const schools = await prisma.school.findMany({
      where: { district: { not: null } },
      select: { id: true, district: true }
    })
    
    const userSchool = await prisma.school.findUnique({
      where: { id: scope.schoolId },
      select: { district: true }
    })
    
    if (userSchool?.district) {
      const districtSchoolIds = schools
        .filter(s => s.district === userSchool.district)
        .map(s => s.id)
      whereClause.schoolId = { in: districtSchoolIds }
    }
  }
  
  // Apply additional filters
  if (options.teacherId) {
    whereClause.teacherId = options.teacherId
  }
  
  if (options.dateFrom || options.dateTo) {
    whereClause.date = {}
    if (options.dateFrom) whereClause.date.gte = options.dateFrom
    if (options.dateTo) whereClause.date.lte = options.dateTo
  }
  
  const observations = await prisma.observation.findMany({
    where: whereClause,
    include: {
      teacher: {
        select: { name: true, subject: true, gradeLevel: true }
      }
    },
    take: 100 // Get more than needed for similarity filtering
  })
  
  const results: SearchResult[] = []
  
  for (const obs of observations) {
    if (!obs.embedding) continue
    
    try {
      const embedding = JSON.parse(obs.embedding) as number[]
      const score = cosineSimilarity(queryEmbedding, embedding)
      
      const focusAreas = typeof obs.focusAreas === 'string' 
        ? JSON.parse(obs.focusAreas) 
        : obs.focusAreas || []
      
      results.push({
        id: obs.id,
        type: 'observation',
        score,
        teacherName: obs.teacher.name,
        teacherId: obs.teacherId,
        schoolId: obs.schoolId,
        date: obs.date,
        title: `${obs.observationType} Observation - ${obs.teacher.name}`,
        snippet: truncateText(obs.embeddingText || obs.rawNotes, 200),
        metadata: {
          subject: obs.teacher.subject || obs.subject || undefined,
          gradeLevel: obs.teacher.gradeLevel || undefined,
          observationType: obs.observationType,
          focusAreas
        }
      })
    } catch (error) {
      console.error(`Error processing observation ${obs.id}:`, error)
    }
  }
  
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, options.limit)
}

/**
 * Search evaluations with vector similarity
 */
async function searchEvaluations(
  queryEmbedding: number[],
  scope: ReturnType<typeof getSearchScope>,
  options: { teacherId?: string; dateFrom?: Date; dateTo?: Date; limit: number }
): Promise<SearchResult[]> {
  // Build where clause based on scope and filters
  const whereClause: any = {
    embedding: { not: null },
    embeddedAt: { not: null }
  }
  
  // Apply scope restrictions (same logic as observations)
  if (scope.type === 'school') {
    whereClause.schoolId = scope.schoolId
  } else if (scope.type === 'teacher') {
    whereClause.teacherId = scope.teacherId
    whereClause.schoolId = scope.schoolId
  } else if (scope.type === 'district') {
    const schools = await prisma.school.findMany({
      where: { district: { not: null } },
      select: { id: true, district: true }
    })
    
    const userSchool = await prisma.school.findUnique({
      where: { id: scope.schoolId },
      select: { district: true }
    })
    
    if (userSchool?.district) {
      const districtSchoolIds = schools
        .filter(s => s.district === userSchool.district)
        .map(s => s.id)
      whereClause.schoolId = { in: districtSchoolIds }
    }
  }
  
  // Apply additional filters
  if (options.teacherId) {
    whereClause.teacherId = options.teacherId
  }
  
  if (options.dateFrom || options.dateTo) {
    whereClause.createdAt = {}
    if (options.dateFrom) whereClause.createdAt.gte = options.dateFrom
    if (options.dateTo) whereClause.createdAt.lte = options.dateTo
  }
  
  const evaluations = await prisma.evaluation.findMany({
    where: whereClause,
    include: {
      teacher: {
        select: { name: true, subject: true, gradeLevel: true }
      }
    },
    take: 100 // Get more than needed for similarity filtering
  })
  
  const results: SearchResult[] = []
  
  for (const eval of evaluations) {
    if (!eval.embedding) continue
    
    try {
      const embedding = JSON.parse(eval.embedding) as number[]
      const score = cosineSimilarity(queryEmbedding, embedding)
      
      results.push({
        id: eval.id,
        type: 'evaluation',
        score,
        teacherName: eval.teacher.name,
        teacherId: eval.teacherId,
        schoolId: eval.schoolId,
        date: eval.createdAt,
        title: `${eval.type} Evaluation - ${eval.teacher.name}`,
        snippet: truncateText(eval.embeddingText || eval.summary || '', 200),
        metadata: {
          subject: eval.teacher.subject || undefined,
          gradeLevel: eval.teacher.gradeLevel || undefined,
          evaluationType: eval.type
        }
      })
    } catch (error) {
      console.error(`Error processing evaluation ${eval.id}:`, error)
    }
  }
  
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, options.limit)
}

/**
 * Get similar items based on an existing observation or evaluation
 */
export async function findSimilarItems(
  itemId: string,
  itemType: 'observation' | 'evaluation',
  authContext: AuthContext,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const { limit = 10, minScore = 0.6 } = options
  
  // Get the source item's embedding
  let sourceEmbedding: number[]
  
  if (itemType === 'observation') {
    const obs = await prisma.observation.findUnique({
      where: { id: itemId },
      select: { embedding: true }
    })
    if (!obs?.embedding) {
      throw new Error('Source observation has no embedding')
    }
    sourceEmbedding = JSON.parse(obs.embedding)
  } else {
    const eval = await prisma.evaluation.findUnique({
      where: { id: itemId },
      select: { embedding: true }
    })
    if (!eval?.embedding) {
      throw new Error('Source evaluation has no embedding')
    }
    sourceEmbedding = JSON.parse(eval.embedding)
  }
  
  // Search for similar items (excluding the source item)
  const scope = getSearchScope(authContext)
  const results: SearchResult[] = []
  
  // Search both observations and evaluations
  const [observations, evaluations] = await Promise.all([
    searchObservations(sourceEmbedding, scope, { limit: Math.ceil(limit / 2) }),
    searchEvaluations(sourceEmbedding, scope, { limit: Math.ceil(limit / 2) })
  ])
  
  results.push(...observations, ...evaluations)
  
  // Filter out the source item and apply minimum score
  return results
    .filter(result => !(result.id === itemId && result.type === itemType))
    .filter(result => result.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

/**
 * Truncate text to specified length
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + '...'
}

/**
 * Get embedding statistics for a school or district
 */
export async function getEmbeddingStats(authContext: AuthContext) {
  const scope = getSearchScope(authContext)
  
  let whereClause: any = {}
  
  if (scope.type === 'school') {
    whereClause.schoolId = scope.schoolId
  } else if (scope.type === 'teacher') {
    whereClause.teacherId = scope.teacherId
    whereClause.schoolId = scope.schoolId
  } else if (scope.type === 'district') {
    const schools = await prisma.school.findMany({
      where: { district: { not: null } },
      select: { id: true, district: true }
    })
    
    const userSchool = await prisma.school.findUnique({
      where: { id: scope.schoolId },
      select: { district: true }
    })
    
    if (userSchool?.district) {
      const districtSchoolIds = schools
        .filter(s => s.district === userSchool.district)
        .map(s => s.id)
      whereClause.schoolId = { in: districtSchoolIds }
    }
  }
  
  const [observationStats, evaluationStats] = await Promise.all([
    prisma.observation.aggregate({
      where: whereClause,
      _count: {
        id: true,
        embedding: true
      }
    }),
    prisma.evaluation.aggregate({
      where: whereClause,
      _count: {
        id: true,
        embedding: true
      }
    })
  ])
  
  return {
    observations: {
      total: observationStats._count.id,
      embedded: observationStats._count.embedding,
      percentage: observationStats._count.id > 0 
        ? Math.round((observationStats._count.embedding / observationStats._count.id) * 100)
        : 0
    },
    evaluations: {
      total: evaluationStats._count.id,
      embedded: evaluationStats._count.embedding,
      percentage: evaluationStats._count.id > 0
        ? Math.round((evaluationStats._count.embedding / evaluationStats._count.id) * 100)
        : 0
    }
  }
}