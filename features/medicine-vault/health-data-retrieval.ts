import type { HealthDataChunk } from "./health-data-chunk"

const STOP_WORDS = new Set([
  "的",
  "了",
  "吗",
  "呢",
  "啊",
  "我",
  "我们",
  "家里",
  "有没有",
  "什么",
  "哪些",
  "怎么",
  "如何",
  "是否",
  "在",
  "和",
  "与",
  "及",
])

function tokenize(text: string) {
  const normalized = text.trim().toLowerCase()

  if (!normalized) {
    return [] as string[]
  }

  const latinTokens = normalized.match(/[a-z0-9]+/g) ?? []
  const cjkTokens = normalized.match(/[\u4e00-\u9fff]{2,}/g) ?? []
  const singleCjk = normalized.match(/[\u4e00-\u9fff]/g) ?? []

  return [...latinTokens, ...cjkTokens, ...singleCjk].filter(
    (token) => token.length >= 2 || /^[\u4e00-\u9fff]$/.test(token),
  )
}

function uniqueTokens(text: string) {
  return [...new Set(tokenize(text).filter((token) => !STOP_WORDS.has(token)))]
}

export function scoreChunk(query: string, chunk: HealthDataChunk) {
  const queryTokens = uniqueTokens(query)

  if (queryTokens.length === 0) {
    return 0
  }

  const haystack = `${chunk.title} ${chunk.content} ${chunk.memberName ?? ""}`.toLowerCase()
  let score = 0

  for (const token of queryTokens) {
    if (haystack.includes(token)) {
      score += token.length >= 3 ? 3 : 2
    }
  }

  if (query.trim() && haystack.includes(query.trim().toLowerCase())) {
    score += 5
  }

  return score
}

export function retrieveRelevantChunks(
  query: string,
  chunks: HealthDataChunk[],
  limit = 5,
): HealthDataChunk[] {
  return chunks
    .map((chunk) => ({
      chunk,
      score: scoreChunk(query, chunk),
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((item) => item.chunk)
}
