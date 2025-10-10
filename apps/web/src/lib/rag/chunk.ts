export type TextChunk = { content: string; tokenCount: number; index: number }

function estimateTokens(text: string): number {
  // Rough token estimate: ~4 chars per token
  return Math.ceil(text.length / 4)
}

export function chunkText(
  text: string,
  maxChars = 8000,
  overlapChars = 1200
): TextChunk[] {
  const chunks: TextChunk[] = []
  if (!text) return chunks
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxChars) {
    chunks.push({ content: normalized, tokenCount: estimateTokens(normalized), index: 0 })
    return chunks
  }
  let start = 0
  let index = 0
  while (start < normalized.length) {
    const end = Math.min(start + maxChars, normalized.length)
    const slice = normalized.slice(start, end)
    chunks.push({ content: slice, tokenCount: estimateTokens(slice), index })
    if (end === normalized.length) break
    start = end - overlapChars
    if (start < 0) start = 0
    index += 1
  }
  return chunks
}
