export type RagSourceTable = 'observation' | 'evaluation'

export type RagHit = {
  chunkId: string
  sourceTable: RagSourceTable
  sourceId: string
  score: number
  snippet: string
  metadata: Record<string, unknown>
}

export type SearchRequest = {
  query: string
  topK?: number
  filters?: { type?: RagSourceTable; startDate?: string; endDate?: string; tags?: string[] }
}
