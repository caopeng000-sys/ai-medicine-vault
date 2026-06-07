const DASHSCOPE_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1"
const DEFAULT_EMBEDDING_MODEL = "text-embedding-v3"
const FALLBACK_EMBEDDING_MODEL = "text-embedding-v2"

type DashscopeEmbeddingResponse = {
  data?: Array<{ embedding?: number[]; index?: number }>
  error?: { message?: string }
}

export function isDashscopeEmbeddingConfigured() {
  return Boolean(process.env.DASHSCOPE_API_KEY?.trim())
}

function getDashscopeApiKey() {
  return process.env.DASHSCOPE_API_KEY?.trim() || undefined
}

async function requestEmbeddings(input: string[], model: string) {
  const apiKey = getDashscopeApiKey()
  if (!apiKey) return null
  const response = await fetch(`${DASHSCOPE_BASE_URL}/embeddings`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, input }),
  })
  const result = (await response.json()) as DashscopeEmbeddingResponse
  if (!response.ok) throw new Error(result.error?.message ?? "阿里百炼向量接口调用失败。")
  const embeddings = result.data
    ?.slice()
    .sort((left, right) => (left.index ?? 0) - (right.index ?? 0))
    .map((item) => item.embedding)
    .filter((embedding): embedding is number[] => Array.isArray(embedding) && embedding.length > 0)
  if (!embeddings || embeddings.length !== input.length) throw new Error("阿里百炼没有返回完整的向量结果。")
  return embeddings
}

export async function createEmbedding(text: string): Promise<number[] | null> {
  const normalized = text.trim()
  if (!normalized || !isDashscopeEmbeddingConfigured()) return null
  try {
    return (await requestEmbeddings([normalized], DEFAULT_EMBEDDING_MODEL))?.[0] ?? null
  } catch {
    try {
      return (await requestEmbeddings([normalized], FALLBACK_EMBEDDING_MODEL))?.[0] ?? null
    } catch {
      return null
    }
  }
}

export async function createEmbeddings(texts: string[]): Promise<number[][] | null> {
  const normalized = texts.map((text) => text.trim()).filter(Boolean)
  if (normalized.length === 0 || !isDashscopeEmbeddingConfigured()) return null
  try {
    return await requestEmbeddings(normalized, DEFAULT_EMBEDDING_MODEL)
  } catch {
    try {
      return await requestEmbeddings(normalized, FALLBACK_EMBEDDING_MODEL)
    } catch {
      return null
    }
  }
}
