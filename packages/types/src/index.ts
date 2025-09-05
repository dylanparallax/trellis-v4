// Re-export Prisma types
export type {
  School,
  User,
  Teacher,
  Observation,
  ObservationArtifact,
  Evaluation,
  Role,
  ObservationType,
  EvaluationType,
  EvaluationStatus,
} from '@trellis/database'

// API Response types
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Form types
export interface TeacherFormData {
  name: string
  email?: string
  subject?: string
  gradeLevel?: string
}

export interface ObservationFormData {
  teacherId: string
  rawNotes: string
  date: Date
  duration?: number
  observationType: any // ObservationType
  focusAreas: string[]
  artifacts?: File[]
}

export interface EvaluationFormData {
  teacherId: string
  type: any // EvaluationType
  content: Record<string, any>
  summary?: string
  recommendations: string[]
  nextSteps: string[]
  scores: Record<string, number>
}

// AI Enhancement types
export interface AIEnhancementRequest {
  observationId: string
  rawNotes: string
  teacherContext: TeacherContext
  previousObservations?: ObservationSummary[]
}

export interface TeacherContext {
  name: string
  subject?: string
  gradeLevel?: string
  currentGoals: Goal[]
  strengths: string[]
  growthAreas: string[]
}

export interface Goal {
  id: string
  description: string
  progress: number
  targetDate: Date
}

export interface ObservationSummary {
  id: string
  date: Date
  enhancedNotes: string
  focusAreas: string[]
}

// Analytics types
export interface DistrictAnalytics {
  summary: {
    totalSchools: number
    totalTeachers: number
    totalObservations: number
    avgObservationsPerTeacher: number
  }
  trends: ObservationTrends
  performance: PerformanceMetrics
  focusAreas: FocusAreaAnalysis
  growth: TeacherGrowthData
  insights: AIInsights
  recommendations: string[]
}

export interface ObservationTrends {
  total: number
  average: number
  byMonth: Array<{
    month: string
    count: number
  }>
  byType: Record<string, number> // Record<ObservationType, number>
}

export interface PerformanceMetrics {
  averageScores: Record<string, number>
  improvementRates: Record<string, number>
  topPerformers: any[] // Teacher[]
  needsSupport: any[] // Teacher[]
}

export interface FocusAreaAnalysis {
  topAreas: Array<{
    area: string
    count: number
  }>
  trending: string[]
  recommendations: string[]
}

export interface TeacherGrowthData {
  improvedTeachers: any[] // Teacher[]
  growthAreas: string[]
  successStories: string[]
}

export interface AIInsights {
  keyInsights: string[]
  areasOfConcern: string[]
  successStories: string[]
  recommendations: string[]
  predictedChallenges: string[]
}

// Demo types
export interface DemoData {
  school: any // School
  teachers: any[] // Teacher[]
  observations: any[] // Observation[]
  evaluations: any[] // Evaluation[]
}

// File upload types
export interface FileUploadResponse {
  url: string
  fileName: string
  fileType: string
  size: number
}

export interface ProcessedArtifact {
  fileUrl: string
  text?: string
  metadata?: Record<string, any>
}

// Real-time types
export interface RealtimeUpdate {
  type: 'observation' | 'evaluation' | 'teacher'
  action: 'create' | 'update' | 'delete'
  data: any
  timestamp: Date
} 