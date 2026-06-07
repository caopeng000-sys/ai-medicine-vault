import { createEmbeddings, createEmbedding, isDashscopeEmbeddingConfigured } from "@/lib/ai/dashscope-embedding"

import type { RepositoryContext } from "./auth-context"
import type { HealthDocumentChunkRecord } from "./data"
import type { HealthDataChunk, HealthDataChunkSourceType } from "./health-data-chunk"
import { indexHealthData } from "./health-data-indexer"
import { retrieveRelevantChunks } from "./health-data-retrieval"
import {
  deleteStaleChunks,
  listAllergyRecords,
  listHealthDocumentChunks,
  listMedicalRecords,
  listMedicines,
  listMembers,
  upsertHealthDocumentChunks,
} from "./repository"

export type HealthChunkIndexResult = Readonly<{ indexed: number; embedded: number }>

function buildChunkHref(sourceType: HealthDataChunkSourceType, memberId?: string, sourceId?: string) {
  switch (sourceType) {
    case "member":
      return `/members/${sourceId ?? memberId ?? ""}`
    case "record":
      return `/records?member=${memberId ?? ""}`
    case "medicine":
      return `/medicines?member=${memberId ?? ""}`
    case "allergy":
      return `/allergies?member=${memberId ?? ""}`
    default:
      return "/"
  }
}

function toHealthDataChunk(record: HealthDocumentChunkRecord, memberName?: string): HealthDataChunk {
  return {
    id: record.id,
    sourceType: record.sourceType as HealthDataChunkSourceType,
    sourceId: record.sourceId,
    memberId: record.memberId,
    memberName,
    title: record.title,
    content: record.content,
    href: buildChunkHref(record.sourceType as HealthDataChunkSourceType, record.memberId, record.sourceId),
  }
}

export function cosineSimilarity(left: number[], right: number[]) {
  if (left.length === 0 || right.length === 0 || left.length !== right.length) return 0
  let dotProduct = 0
  let leftMagnitude = 0
  let rightMagnitude = 0
  for (let index = 0; index < left.length; index += 1) {
    dotProduct += left[index]! * right[index]!
    leftMagnitude += left[index]! * left[index]!
    rightMagnitude += right[index]! * right[index]!
  }
  if (leftMagnitude === 0 || rightMagnitude === 0) return 0
  return dotProduct / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude))
}

export function rankChunksByEmbedding(queryEmbedding: number[], records: HealthDocumentChunkRecord[], limit: number) {
  return records
    .map((record) => ({ record, score: cosineSimilarity(queryEmbedding, record.embedding) }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((item) => item.record)
}

export async function rebuildIndex(ctx: RepositoryContext): Promise<HealthChunkIndexResult> {
  const [members, records, medicines, allergies] = await Promise.all([
    listMembers(ctx),
    listMedicalRecords(ctx),
    listMedicines(ctx),
    listAllergyRecords(ctx),
  ])
  const chunks = indexHealthData({ members, records, medicines, allergies })
  const embeddings = isDashscopeEmbeddingConfigured()
    ? await createEmbeddings(chunks.map((chunk) => `${chunk.title}\n${chunk.content}`))
    : null
  const payload = chunks.map((chunk, index) => ({
    id: chunk.id,
    memberId: chunk.memberId,
    sourceType: chunk.sourceType,
    sourceId: chunk.sourceId,
    title: chunk.title,
    content: chunk.content,
    embedding: embeddings?.[index] ?? [],
  }))
  await upsertHealthDocumentChunks(ctx, payload)
  await deleteStaleChunks(ctx, chunks.map((chunk) => ({ sourceType: chunk.sourceType, sourceId: chunk.sourceId })))
  return { indexed: payload.length, embedded: payload.filter((item) => item.embedding.length > 0).length }
}

export async function searchChunks(ctx: RepositoryContext, query: string, limit = 5): Promise<HealthDataChunk[]> {
  const normalizedQuery = query.trim()
  if (!normalizedQuery) return []
  const storedChunks = await listHealthDocumentChunks(ctx)
  if (storedChunks.length === 0) return []
  const [members, records, medicines, allergies] = await Promise.all([
    listMembers(ctx),
    listMedicalRecords(ctx),
    listMedicines(ctx),
    listAllergyRecords(ctx),
  ])
  const indexedChunks = indexHealthData({ members, records, medicines, allergies })
  const memberNameById = new Map(members.map((member) => [member.id, member.name]))
  const indexedById = new Map(indexedChunks.map((chunk) => [chunk.id, chunk]))
  const queryEmbedding =
    isDashscopeEmbeddingConfigured() && storedChunks.some((item) => item.embedding.length > 0)
      ? await createEmbedding(normalizedQuery)
      : null
  if (queryEmbedding) {
    const rankedRecords = rankChunksByEmbedding(queryEmbedding, storedChunks, limit)
    if (rankedRecords.length > 0) {
      return rankedRecords.map((record) => {
        const indexed = indexedById.get(record.id)
        return indexed ?? toHealthDataChunk(record, record.memberId ? memberNameById.get(record.memberId) : undefined)
      })
    }
  }
  const fallbackChunks =
    indexedChunks.length > 0
      ? indexedChunks
      : storedChunks.map((record) =>
          toHealthDataChunk(record, record.memberId ? memberNameById.get(record.memberId) : undefined),
        )
  return retrieveRelevantChunks(normalizedQuery, fallbackChunks, limit)
}
