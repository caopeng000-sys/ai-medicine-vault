export type HealthDataChunkSourceType = "member" | "record" | "medicine" | "allergy" | "attachment"

export type HealthDataChunk = Readonly<{
  id: string
  sourceType: HealthDataChunkSourceType
  sourceId: string
  memberId?: string
  memberName?: string
  title: string
  content: string
  href: string
}>
