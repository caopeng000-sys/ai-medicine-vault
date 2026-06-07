import { getPrismaClient } from "@/lib/db"
import type { AllergySeverity } from "@prisma/client"

import type { RepositoryContext } from "@/features/medicine-vault/auth-context"
import type {
  AiConversationRecord,
  AllergyRecord,
  HealthDocumentChunkRecord,
  MedicalRecord,
  MedicalRecordAttachment,
  Member,
  Medicine,
  VisitPreparation,
} from "@/features/medicine-vault/data"
import {
  aiConversations as mockAiConversations,
  healthDocumentChunks as mockHealthDocumentChunks,
  allergyRecords as mockAllergyRecords,
  medicalRecordAttachments as mockMedicalRecordAttachments,
  medicalRecords as mockMedicalRecords,
  members as mockMembers,
  medicines as mockMedicines,
  visitPreparations as mockVisitPreparations,
} from "@/features/medicine-vault/data"
import {
  DEFAULT_MEDICINE_PAGE_SIZE,
  paginateMedicines,
  sortMedicinesForDisplay,
} from "@/features/medicine-vault/medicine-pagination"
import type {
  CreateAllergyRecordInput,
  CreateMedicalRecordAttachmentInput,
  CreateMedicalRecordInput,
  CreateMemberInput,
  CreateMedicineInput,
  UpdateMemberInput,
} from "@/features/medicine-vault/schemas"
import type { MedicalAttachmentFile } from "@/features/medicine-vault/medical-attachment-request"
import type { MedicineImageAttachment } from "@/features/medicine-vault/medicine-request"

export type MedicinePageQuery = Readonly<{
  memberId?: string
  query?: string
  category?: string
  page: number
  pageSize: number
}>

export type PaginatedMedicines = Readonly<{
  items: Medicine[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}>

export { DEFAULT_MEDICINE_PAGE_SIZE } from "@/features/medicine-vault/medicine-pagination"

export const DEFAULT_AI_CONVERSATION_LIMIT = 10

function toDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`)
}

function formatDateOnly(value: Date) {
  return value.toISOString().slice(0, 10)
}

function mapMember(member: {
  id: string
  userId: string
  name: string
  relationship: string
  birthYear: number | null
  gender: "男" | "女"
  allergySummary: string
  note: string
}): Member {
  return {
    id: member.id,
    userId: member.userId,
    name: member.name,
    relationship: member.relationship,
    birthYear: member.birthYear ?? 1990,
    gender: member.gender,
    allergySummary: member.allergySummary,
    note: member.note,
  }
}

function mapMedicalRecordAttachment(attachment: {
  id: string
  userId: string
  memberId: string
  medicalRecordId: string | null
  fileName: string
  mimeType: string
  fileBytes?: Uint8Array | Buffer | null
  extractedText: string
  createdAt: Date
}): MedicalRecordAttachment {
  return {
    id: attachment.id,
    userId: attachment.userId,
    memberId: attachment.memberId,
    medicalRecordId: attachment.medicalRecordId ?? undefined,
    fileName: attachment.fileName,
    mimeType: attachment.mimeType,
    extractedText: attachment.extractedText,
    hasFile: Boolean(attachment.fileBytes?.length),
    createdAt: attachment.createdAt.toISOString(),
  }
}

function mapMedicalRecord(record: {
  id: string
  userId: string
  memberId: string
  visitedAt: Date
  hospitalName: string
  department: string
  symptoms: string
  diagnosis: string
  doctorAdvice: string
  prescriptionNote: string
  note: string
}): MedicalRecord {
  return {
    id: record.id,
    userId: record.userId,
    memberId: record.memberId,
    visitedAt: formatDateOnly(record.visitedAt),
    hospitalName: record.hospitalName,
    department: record.department,
    symptoms: record.symptoms,
    diagnosis: record.diagnosis,
    doctorAdvice: record.doctorAdvice,
    prescriptionNote: record.prescriptionNote,
    note: record.note,
  }
}

function mapMedicine(medicine: {
  id: string
  userId: string
  memberId: string
  name: string
  category: string
  dosage: string
  instructions: string
  purpose: string
  specification: string
  quantity: string
  expiresAt: Date
  storageLocation: string
  usageNote: string
  safetyNote: string
  imageBytes?: Uint8Array | Buffer | null
  imageName?: string | null
}): Medicine {
  return {
    id: medicine.id,
    userId: medicine.userId,
    memberId: medicine.memberId,
    name: medicine.name,
    category: medicine.category,
    dosage: medicine.dosage,
    instructions: medicine.instructions,
    purpose: medicine.purpose,
    specification: medicine.specification,
    quantity: medicine.quantity,
    expiresAt: formatDateOnly(medicine.expiresAt),
    storageLocation: medicine.storageLocation,
    usageNote: medicine.usageNote,
    safetyNote: medicine.safetyNote,
    hasImage: Boolean(medicine.imageBytes?.length),
    imageName: medicine.imageName ?? undefined,
  }
}

function mapAllergyRecord(record: {
  id: string
  userId: string
  memberId: string
  allergen: string
  reaction: string
  severity: AllergySeverity | "轻微" | "中等" | "严重"
  discoveredAt: Date
  note: string
}): AllergyRecord {
  return {
    id: record.id,
    userId: record.userId,
    memberId: record.memberId,
    allergen: record.allergen,
    reaction: record.reaction,
    severity: record.severity,
    discoveredAt: formatDateOnly(record.discoveredAt),
    note: record.note,
  }
}

function mapVisitPreparation(item: {
  id?: string
  userId: string
  memberId: string
  concern: string
  summary: string
  questions: string[]
}): VisitPreparation {
  return {
    id: item.id,
    userId: item.userId,
    memberId: item.memberId,
    concern: item.concern,
    summary: item.summary,
    questions: item.questions,
  }
}

function mapAiConversation(item: {
  id: string
  userId: string
  question: string
  answer: string
  intent: string
  message: string | null
  sources: unknown
  createdAt: Date
}): AiConversationRecord {
  const sources = Array.isArray(item.sources)
    ? item.sources.filter(
        (source): source is { label: string; detail: string } =>
          typeof source === "object" &&
          source !== null &&
          "label" in source &&
          "detail" in source &&
          typeof source.label === "string" &&
          typeof source.detail === "string",
      )
    : []

  return {
    id: item.id,
    userId: item.userId,
    question: item.question,
    answer: item.answer,
    intent: item.intent,
    message: item.message ?? undefined,
    sources,
    createdAt: item.createdAt.toISOString(),
  }
}

function trimMockAiConversations(userId: string, limit = DEFAULT_AI_CONVERSATION_LIMIT) {
  let count = mockAiConversations.filter((item) => item.userId === userId).length

  while (count > limit) {
    const index = mockAiConversations.findLastIndex((item) => item.userId === userId)
    if (index === -1) {
      break
    }

    mockAiConversations.splice(index, 1)
    count -= 1
  }
}

async function trimDatabaseAiConversations(ctx: RepositoryContext, prisma: NonNullable<ReturnType<typeof getPrismaClient>>) {
  const items = await prisma.aiConversation.findMany({
    where: { userId: ctx.userId },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  })

  if (items.length <= DEFAULT_AI_CONVERSATION_LIMIT) {
    return
  }

  await prisma.aiConversation.deleteMany({
    where: {
      id: {
        in: items.slice(DEFAULT_AI_CONVERSATION_LIMIT).map((item) => item.id),
      },
    },
  })
}

function splitHospitalField(value: string) {
  const [hospitalName, department] = value
    .split("/")
    .map((item) => item.trim())
    .filter(Boolean)

  return {
    hospitalName: hospitalName ?? value.trim(),
    department: department ?? "未分科",
  }
}

function fallbackText(value: string | undefined, fallback: string) {
  return value?.trim() || fallback
}

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL)
}

function memberBelongsToUser(ctx: RepositoryContext, memberId: string) {
  return mockMembers.some((member) => member.id === memberId && member.userId === ctx.userId)
}

function assertMockMemberBelongsToUser(ctx: RepositoryContext, memberId: string) {
  if (!memberBelongsToUser(ctx, memberId)) {
    throw new Error("成员不存在或不属于当前用户。")
  }
}

async function assertDatabaseMemberBelongsToUser(ctx: RepositoryContext, memberId: string) {
  const prisma = getPrismaClient()

  if (!prisma) {
    assertMockMemberBelongsToUser(ctx, memberId)
    return
  }

  const member = await prisma.member.findFirst({
    where: {
      id: memberId,
      userId: ctx.userId,
    },
    select: { id: true },
  })

  if (!member) {
    throw new Error("成员不存在或不属于当前用户。")
  }
}

export async function listMembers(ctx: RepositoryContext) {
  const prisma = getPrismaClient()

  if (!prisma) {
    return mockMembers.filter((member) => member.userId === ctx.userId)
  }

  try {
    const members = await prisma.member.findMany({
      where: { userId: ctx.userId },
      orderBy: { createdAt: "asc" },
    })

    return members.map(mapMember)
  } catch {
    return mockMembers.filter((member) => member.userId === ctx.userId)
  }
}

export async function getMemberById(ctx: RepositoryContext, memberId: string) {
  const prisma = getPrismaClient()

  if (!prisma) {
    return mockMembers.find((member) => member.id === memberId && member.userId === ctx.userId)
  }

  try {
    const member = await prisma.member.findFirst({
      where: {
        id: memberId,
        userId: ctx.userId,
      },
    })

    return member ? mapMember(member) : undefined
  } catch {
    return mockMembers.find((member) => member.id === memberId && member.userId === ctx.userId)
  }
}

export async function listMedicalRecords(ctx: RepositoryContext, memberId?: string) {
  const prisma = getPrismaClient()

  if (!prisma) {
    return mockMedicalRecords
      .filter((record) => record.userId === ctx.userId)
      .filter((record) => (memberId ? record.memberId === memberId : true))
      .toSorted((a, b) => b.visitedAt.localeCompare(a.visitedAt))
  }

  try {
    const records = await prisma.medicalRecord.findMany({
      where: {
        userId: ctx.userId,
        ...(memberId ? { memberId } : {}),
      },
      orderBy: { visitedAt: "desc" },
    })

    return records.map(mapMedicalRecord)
  } catch {
    return mockMedicalRecords
      .filter((record) => record.userId === ctx.userId)
      .filter((record) => (memberId ? record.memberId === memberId : true))
      .toSorted((a, b) => b.visitedAt.localeCompare(a.visitedAt))
  }
}

async function assertMedicalRecordBelongsToUser(ctx: RepositoryContext, medicalRecordId: string, memberId: string) {
  const prisma = getPrismaClient()
  if (!prisma) {
    const record = mockMedicalRecords.find((item) => item.id === medicalRecordId && item.userId === ctx.userId && item.memberId === memberId)
    if (!record) throw new Error("关联病历不存在或不属于当前用户。")
    return
  }
  const record = await prisma.medicalRecord.findFirst({ where: { id: medicalRecordId, userId: ctx.userId, memberId }, select: { id: true } })
  if (!record) throw new Error("关联病历不存在或不属于当前用户。")
}

export async function listMedicalRecordAttachments(ctx: RepositoryContext, memberId?: string) {
  const prisma = getPrismaClient()
  if (!prisma) {
    return mockMedicalRecordAttachments
      .filter((attachment) => attachment.userId === ctx.userId)
      .filter((attachment) => (memberId ? attachment.memberId === memberId : true))
      .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))
  }
  try {
    const attachments = await prisma.medicalRecordAttachment.findMany({
      where: { userId: ctx.userId, ...(memberId ? { memberId } : {}) },
      orderBy: { createdAt: "desc" },
    })
    return attachments.map(mapMedicalRecordAttachment)
  } catch {
    return mockMedicalRecordAttachments
      .filter((attachment) => attachment.userId === ctx.userId)
      .filter((attachment) => (memberId ? attachment.memberId === memberId : true))
      .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))
  }
}

export async function listMedicines(ctx: RepositoryContext, memberId?: string, query?: string, category?: string) {
  const prisma = getPrismaClient()
  const normalizedQuery = query?.trim()
  const normalizedCategory = category?.trim()
  const hasQuery = Boolean(normalizedQuery)
  const hasCategory = Boolean(normalizedCategory)

  if (!prisma) {
    return mockMedicines.filter((medicine) => {
      const matchesUser = medicine.userId === ctx.userId
      const matchesMember = memberId ? medicine.memberId === memberId : true
      const matchesCategory = hasCategory ? medicine.category === normalizedCategory : true
      const searchableText = [
        medicine.name,
        medicine.category,
        medicine.dosage,
        medicine.instructions,
        medicine.purpose,
        medicine.specification,
        medicine.storageLocation,
        medicine.usageNote,
        medicine.safetyNote,
      ]
        .join(" ")
        .toLowerCase()

      const matchesQuery = hasQuery ? searchableText.includes(normalizedQuery!.toLowerCase()) : true

      return matchesUser && matchesMember && matchesCategory && matchesQuery
    })
  }

  try {
    const medicines = await prisma.medicine.findMany({
      where: {
        userId: ctx.userId,
        ...(memberId ? { memberId } : {}),
        ...(hasCategory ? { category: normalizedCategory } : {}),
        ...(hasQuery
          ? {
              OR: [
                { name: { contains: normalizedQuery, mode: "insensitive" } },
                { category: { contains: normalizedQuery, mode: "insensitive" } },
                { dosage: { contains: normalizedQuery, mode: "insensitive" } },
                { instructions: { contains: normalizedQuery, mode: "insensitive" } },
                { purpose: { contains: normalizedQuery, mode: "insensitive" } },
                { specification: { contains: normalizedQuery, mode: "insensitive" } },
                { storageLocation: { contains: normalizedQuery, mode: "insensitive" } },
                { usageNote: { contains: normalizedQuery, mode: "insensitive" } },
                { safetyNote: { contains: normalizedQuery, mode: "insensitive" } },
                { member: { name: { contains: normalizedQuery, mode: "insensitive" } } },
              ],
            }
          : {}),
      },
      orderBy: { expiresAt: "asc" },
    })

    return medicines.map(mapMedicine)
  } catch {
    return mockMedicines.filter((medicine) => {
      const matchesUser = medicine.userId === ctx.userId
      const matchesMember = memberId ? medicine.memberId === memberId : true
      const matchesCategory = hasCategory ? medicine.category === normalizedCategory : true
      const searchableText = [
        medicine.name,
        medicine.category,
        medicine.dosage,
        medicine.instructions,
        medicine.purpose,
        medicine.specification,
        medicine.storageLocation,
        medicine.usageNote,
        medicine.safetyNote,
      ]
        .join(" ")
        .toLowerCase()

      const matchesQuery = hasQuery ? searchableText.includes(normalizedQuery!.toLowerCase()) : true

      return matchesUser && matchesMember && matchesCategory && matchesQuery
    })
  }
}

export async function listMedicinesPaginated(
  ctx: RepositoryContext,
  {
    memberId,
    query,
    category,
    page,
    pageSize = DEFAULT_MEDICINE_PAGE_SIZE,
  }: MedicinePageQuery
): Promise<PaginatedMedicines> {
  const medicines = sortMedicinesForDisplay(await listMedicines(ctx, memberId, query, category))

  return paginateMedicines(medicines, { page, pageSize })
}

export async function getMedicineById(ctx: RepositoryContext, medicineId: string) {
  const prisma = getPrismaClient()

  if (!prisma) {
    return mockMedicines.find((medicine) => medicine.id === medicineId && medicine.userId === ctx.userId)
  }

  try {
    const medicine = await prisma.medicine.findFirst({
      where: {
        id: medicineId,
        userId: ctx.userId,
      },
    })

    return medicine ? mapMedicine(medicine) : undefined
  } catch {
    return mockMedicines.find((medicine) => medicine.id === medicineId && medicine.userId === ctx.userId)
  }
}

export async function getMedicineImageById(ctx: RepositoryContext, medicineId: string) {
  const prisma = getPrismaClient()

  if (!prisma) {
    return undefined
  }

  try {
    const medicine = await prisma.medicine.findFirst({
      where: {
        id: medicineId,
        userId: ctx.userId,
      },
      select: {
        name: true,
        imageBytes: true,
        imageMimeType: true,
        imageName: true,
      },
    })

    if (!medicine?.imageBytes?.length) {
      return undefined
    }

    return {
      name: medicine.name,
      imageBytes: medicine.imageBytes,
      imageMimeType: medicine.imageMimeType ?? "image/jpeg",
      imageName: medicine.imageName ?? `${medicine.name}.jpg`,
    }
  } catch {
    return undefined
  }
}

export async function listAllergyRecords(ctx: RepositoryContext, memberId?: string): Promise<AllergyRecord[]> {
  const prisma = getPrismaClient()

  if (!prisma) {
    return mockAllergyRecords
      .filter((record) => record.userId === ctx.userId)
      .filter((record) => (memberId ? record.memberId === memberId : true))
  }

  try {
    const records = await prisma.allergyRecord.findMany({
      where: {
        userId: ctx.userId,
        ...(memberId ? { memberId } : {}),
      },
      orderBy: { discoveredAt: "desc" },
    })

    return records.map(mapAllergyRecord)
  } catch {
    return mockAllergyRecords
      .filter((record) => record.userId === ctx.userId)
      .filter((record) => (memberId ? record.memberId === memberId : true))
  }
}

export async function listVisitPreparations(ctx: RepositoryContext, memberId?: string) {
  const prisma = getPrismaClient()

  if (!prisma) {
    return mockVisitPreparations
      .filter((item) => item.userId === ctx.userId)
      .filter((item) => (memberId ? item.memberId === memberId : true))
  }

  try {
    const items = await prisma.visitPreparation.findMany({
      where: {
        userId: ctx.userId,
        ...(memberId ? { memberId } : {}),
      },
      orderBy: { createdAt: "desc" },
    })

    return items.map(mapVisitPreparation)
  } catch {
    return mockVisitPreparations
      .filter((item) => item.userId === ctx.userId)
      .filter((item) => (memberId ? item.memberId === memberId : true))
  }
}

export async function createVisitPreparation(
  ctx: RepositoryContext,
  input: Readonly<{
    memberId: string
    concern: string
    summary: string
    questions: string[]
  }>,
) {
  const prisma = getPrismaClient()

  if (!prisma) {
    assertMockMemberBelongsToUser(ctx, input.memberId)

    const preparation: VisitPreparation = {
      userId: ctx.userId,
      memberId: input.memberId,
      concern: input.concern,
      summary: input.summary,
      questions: input.questions,
    }

    mockVisitPreparations.unshift(preparation)
    return preparation
  }

  try {
    await assertDatabaseMemberBelongsToUser(ctx, input.memberId)

    const item = await prisma.visitPreparation.create({
      data: {
        userId: ctx.userId,
        memberId: input.memberId,
        concern: input.concern,
        summary: input.summary,
        questions: input.questions,
      },
    })

    return mapVisitPreparation(item)
  } catch {
    assertMockMemberBelongsToUser(ctx, input.memberId)

    const preparation: VisitPreparation = {
      userId: ctx.userId,
      memberId: input.memberId,
      concern: input.concern,
      summary: input.summary,
      questions: input.questions,
    }

    mockVisitPreparations.unshift(preparation)
    return preparation
  }
}

export async function listAiConversations(ctx: RepositoryContext, limit = DEFAULT_AI_CONVERSATION_LIMIT) {
  const prisma = getPrismaClient()

  if (!prisma) {
    return mockAiConversations.filter((item) => item.userId === ctx.userId).slice(0, limit)
  }

  try {
    const items = await prisma.aiConversation.findMany({
      where: { userId: ctx.userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    })

    return items.map(mapAiConversation)
  } catch {
    return mockAiConversations.filter((item) => item.userId === ctx.userId).slice(0, limit)
  }
}

export async function createAiConversation(
  ctx: RepositoryContext,
  input: Readonly<{
    question: string
    answer: string
    intent: string
    message?: string
    sources: ReadonlyArray<{ label: string; detail: string }>
  }>,
) {
  const prisma = getPrismaClient()

  if (!prisma) {
    const conversation: AiConversationRecord = {
      id: `conversation-${Date.now()}`,
      userId: ctx.userId,
      question: input.question,
      answer: input.answer,
      intent: input.intent,
      message: input.message,
      sources: input.sources,
      createdAt: new Date().toISOString(),
    }

    mockAiConversations.unshift(conversation)
    trimMockAiConversations(ctx.userId)
    return conversation
  }

  try {
    const item = await prisma.aiConversation.create({
      data: {
        userId: ctx.userId,
        question: input.question,
        answer: input.answer,
        intent: input.intent,
        message: input.message,
        sources: input.sources,
      },
    })

    await trimDatabaseAiConversations(ctx, prisma)
    return mapAiConversation(item)
  } catch {
    const conversation: AiConversationRecord = {
      id: `conversation-${Date.now()}`,
      userId: ctx.userId,
      question: input.question,
      answer: input.answer,
      intent: input.intent,
      message: input.message,
      sources: input.sources,
      createdAt: new Date().toISOString(),
    }

    mockAiConversations.unshift(conversation)
    trimMockAiConversations(ctx.userId)
    return conversation
  }
}

export async function createMember(ctx: RepositoryContext, input: CreateMemberInput) {
  const prisma = getPrismaClient()

  if (!prisma) {
    throw new Error("当前还没有配置 DATABASE_URL，暂时无法写入真实数据库。")
  }

  const member = await prisma.member.create({
    data: {
      user: {
        connectOrCreate: {
          where: { id: ctx.userId },
          create: {
            id: ctx.userId,
            name: "当前用户",
          },
        },
      },
      name: input.name,
      relationship: input.relationship,
      gender: input.gender,
      birthYear: input.birthYear,
      note: input.note,
    },
  })

  return mapMember(member)
}

export async function updateMember(ctx: RepositoryContext, memberId: string, input: UpdateMemberInput) {
  const prisma = getPrismaClient()

  if (!prisma) {
    throw new Error("当前还没有配置 DATABASE_URL，暂时无法写入真实数据库。")
  }

  const existingMember = await getMemberById(ctx, memberId)

  if (!existingMember) {
    throw new Error("成员不存在或不属于当前用户。")
  }

  const member = await prisma.member.update({
    where: { id: memberId },
    data: {
      name: input.name,
      relationship: input.relationship,
      gender: input.gender,
      birthYear: input.birthYear,
      note: input.note,
    },
  })

  return mapMember(member)
}

export async function deleteMember(ctx: RepositoryContext, memberId: string) {
  const prisma = getPrismaClient()

  if (!prisma) {
    throw new Error("当前还没有配置 DATABASE_URL，暂时无法写入真实数据库。")
  }

  const existingMember = await getMemberById(ctx, memberId)

  if (!existingMember) {
    throw new Error("成员不存在或不属于当前用户。")
  }

  const member = await prisma.member.delete({
    where: { id: memberId },
  })

  return mapMember(member)
}

export async function createMedicalRecord(ctx: RepositoryContext, input: CreateMedicalRecordInput) {
  const prisma = getPrismaClient()

  if (!prisma) {
    throw new Error("当前还没有配置 DATABASE_URL，暂时无法写入真实数据库。")
  }

  await assertDatabaseMemberBelongsToUser(ctx, input.memberId)

  const { hospitalName, department } = splitHospitalField(input.hospital)
  const record = await prisma.medicalRecord.create({
    data: {
      userId: ctx.userId,
      memberId: input.memberId,
      visitedAt: toDateOnly(input.visitedAt),
      hospitalName,
      department,
      symptoms: input.symptoms,
      diagnosis: input.diagnosis,
      doctorAdvice: input.advice,
      prescriptionNote: "待补充处方信息。",
      note: "通过原型表单录入。",
    },
  })

  return mapMedicalRecord(record)
}

export async function createMedicine(
  ctx: RepositoryContext,
  input: CreateMedicineInput,
  image?: MedicineImageAttachment
) {
  const prisma = getPrismaClient()

  if (!prisma) {
    throw new Error("当前还没有配置 DATABASE_URL，暂时无法写入真实数据库。")
  }

  await assertDatabaseMemberBelongsToUser(ctx, input.memberId)

  const medicine = await prisma.medicine.create({
    data: {
      userId: ctx.userId,
      memberId: input.memberId,
      name: input.name,
      category: input.category,
      dosage: input.dosage,
      instructions: input.instructions,
      purpose: input.purpose,
      specification: input.specification,
      quantity: fallbackText(input.quantity, "1 份"),
      expiresAt: toDateOnly(input.expiresAt),
      storageLocation: fallbackText(input.storageLocation, "待补充存放位置。"),
      usageNote: fallbackText(input.usageNote, "通过原型表单录入。"),
      safetyNote: fallbackText(input.safetyNote, "后续需要补充更具体的用药风险提示。"),
      imageBytes: image?.bytes,
      imageMimeType: image?.mimeType,
      imageName: image?.name,
    },
  })

  return mapMedicine(medicine)
}

export async function updateMedicine(
  ctx: RepositoryContext,
  medicineId: string,
  input: CreateMedicineInput,
  image?: MedicineImageAttachment
) {
  const prisma = getPrismaClient()

  if (!prisma) {
    throw new Error("当前还没有配置 DATABASE_URL，暂时无法写入真实数据库。")
  }

  await assertDatabaseMemberBelongsToUser(ctx, input.memberId)

  const existingMedicine = await getMedicineById(ctx, medicineId)

  if (!existingMedicine) {
    throw new Error("药品记录不存在或不属于当前用户。")
  }

  const medicine = await prisma.medicine.update({
    where: { id: medicineId },
    data: {
      memberId: input.memberId,
      name: input.name,
      category: input.category,
      dosage: input.dosage,
      instructions: input.instructions,
      purpose: input.purpose,
      specification: input.specification,
      quantity: fallbackText(input.quantity, "1 份"),
      storageLocation: fallbackText(input.storageLocation, "待补充存放位置。"),
      usageNote: fallbackText(input.usageNote, "通过原型表单录入。"),
      safetyNote: fallbackText(input.safetyNote, "后续需要补充更具体的用药风险提示。"),
      expiresAt: toDateOnly(input.expiresAt),
      ...(image
        ? {
            imageBytes: image.bytes,
            imageMimeType: image.mimeType,
            imageName: image.name,
          }
        : {}),
    },
  })

  return mapMedicine(medicine)
}

export async function deleteMedicine(ctx: RepositoryContext, medicineId: string) {
  const prisma = getPrismaClient()

  if (!prisma) {
    throw new Error("当前还没有配置 DATABASE_URL，暂时无法写入真实数据库。")
  }

  const existingMedicine = await getMedicineById(ctx, medicineId)

  if (!existingMedicine) {
    throw new Error("药品记录不存在或不属于当前用户。")
  }

  const medicine = await prisma.medicine.delete({
    where: { id: medicineId },
  })

  return mapMedicine(medicine)
}

export async function createAllergyRecord(ctx: RepositoryContext, input: CreateAllergyRecordInput) {
  const prisma = getPrismaClient()

  if (!prisma) {
    throw new Error("当前还没有配置 DATABASE_URL，暂时无法写入真实数据库。")
  }

  await assertDatabaseMemberBelongsToUser(ctx, input.memberId)

  const record = await prisma.allergyRecord.create({
    data: {
      userId: ctx.userId,
      memberId: input.memberId,
      allergen: input.allergen,
      reaction: input.reaction,
      severity: input.severity,
      discoveredAt: toDateOnly(input.discoveredAt),
      note: input.note,
    },
  })

  return mapAllergyRecord(record)
}

function createMockMedicalRecordAttachment(ctx: RepositoryContext, input: CreateMedicalRecordAttachmentInput, file?: MedicalAttachmentFile): MedicalRecordAttachment {
  const attachment: MedicalRecordAttachment = {
    id: `attachment-${Date.now()}`,
    userId: ctx.userId,
    memberId: input.memberId,
    medicalRecordId: input.medicalRecordId,
    fileName: file?.name ?? "medical-attachment.txt",
    mimeType: file?.mimeType ?? "text/plain",
    extractedText: input.extractedText,
    hasFile: Boolean(file?.bytes.length),
    createdAt: new Date().toISOString(),
  }
  mockMedicalRecordAttachments.unshift(attachment)
  return attachment
}

export async function createMedicalRecordAttachment(ctx: RepositoryContext, input: CreateMedicalRecordAttachmentInput, file?: MedicalAttachmentFile) {
  const prisma = getPrismaClient()
  await assertDatabaseMemberBelongsToUser(ctx, input.memberId)
  if (input.medicalRecordId) await assertMedicalRecordBelongsToUser(ctx, input.medicalRecordId, input.memberId)
  if (!prisma) return createMockMedicalRecordAttachment(ctx, input, file)
  try {
    const attachment = await prisma.medicalRecordAttachment.create({
      data: {
        userId: ctx.userId,
        memberId: input.memberId,
        medicalRecordId: input.medicalRecordId,
        fileName: file?.name ?? "medical-attachment.txt",
        mimeType: file?.mimeType ?? "text/plain",
        fileBytes: file?.bytes,
        extractedText: input.extractedText,
      },
    })
    return mapMedicalRecordAttachment(attachment)
  } catch {
    return createMockMedicalRecordAttachment(ctx, input, file)
  }
}

export type UpsertHealthDocumentChunkInput = Readonly<{
  id: string
  memberId?: string
  sourceType: string
  sourceId: string
  title: string
  content: string
  embedding: number[]
}>

function parseEmbedding(value: unknown): number[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is number => typeof item === "number" && Number.isFinite(item))
}

function mapHealthDocumentChunk(item: {
  id: string
  userId: string
  memberId: string | null
  sourceType: string
  sourceId: string
  title: string
  content: string
  embedding: unknown
  createdAt: Date
  updatedAt: Date
}): HealthDocumentChunkRecord {
  return {
    id: item.id,
    userId: item.userId,
    memberId: item.memberId ?? undefined,
    sourceType: item.sourceType,
    sourceId: item.sourceId,
    title: item.title,
    content: item.content,
    embedding: parseEmbedding(item.embedding),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }
}

export async function upsertHealthDocumentChunks(
  ctx: RepositoryContext,
  chunks: ReadonlyArray<UpsertHealthDocumentChunkInput>,
) {
  const prisma = getPrismaClient()
  const now = new Date().toISOString()
  if (!prisma) {
    for (const chunk of chunks) {
      const existingIndex = mockHealthDocumentChunks.findIndex(
        (item) => item.userId === ctx.userId && item.sourceType === chunk.sourceType && item.sourceId === chunk.sourceId,
      )
      const record: HealthDocumentChunkRecord = {
        id: chunk.id,
        userId: ctx.userId,
        memberId: chunk.memberId,
        sourceType: chunk.sourceType,
        sourceId: chunk.sourceId,
        title: chunk.title,
        content: chunk.content,
        embedding: chunk.embedding,
        createdAt: existingIndex === -1 ? now : mockHealthDocumentChunks[existingIndex]!.createdAt,
        updatedAt: now,
      }
      if (existingIndex === -1) mockHealthDocumentChunks.push(record)
      else mockHealthDocumentChunks[existingIndex] = record
    }
    return chunks.length
  }
  try {
    await prisma.$transaction(
      chunks.map((chunk) =>
        prisma.healthDocumentChunk.upsert({
          where: { userId_sourceType_sourceId: { userId: ctx.userId, sourceType: chunk.sourceType, sourceId: chunk.sourceId } },
          create: {
            id: chunk.id,
            userId: ctx.userId,
            memberId: chunk.memberId,
            sourceType: chunk.sourceType,
            sourceId: chunk.sourceId,
            title: chunk.title,
            content: chunk.content,
            embedding: chunk.embedding,
          },
          update: { memberId: chunk.memberId, title: chunk.title, content: chunk.content, embedding: chunk.embedding },
        }),
      ),
    )
    return chunks.length
  } catch {
    for (const chunk of chunks) {
      const existingIndex = mockHealthDocumentChunks.findIndex(
        (item) => item.userId === ctx.userId && item.sourceType === chunk.sourceType && item.sourceId === chunk.sourceId,
      )
      const record: HealthDocumentChunkRecord = {
        id: chunk.id,
        userId: ctx.userId,
        memberId: chunk.memberId,
        sourceType: chunk.sourceType,
        sourceId: chunk.sourceId,
        title: chunk.title,
        content: chunk.content,
        embedding: chunk.embedding,
        createdAt: existingIndex === -1 ? now : mockHealthDocumentChunks[existingIndex]!.createdAt,
        updatedAt: now,
      }
      if (existingIndex === -1) mockHealthDocumentChunks.push(record)
      else mockHealthDocumentChunks[existingIndex] = record
    }
    return chunks.length
  }
}

export async function listHealthDocumentChunks(ctx: RepositoryContext, memberId?: string) {
  const prisma = getPrismaClient()
  if (!prisma) {
    return mockHealthDocumentChunks.filter((item) => item.userId === ctx.userId).filter((item) => (memberId ? item.memberId === memberId : true))
  }
  try {
    const items = await prisma.healthDocumentChunk.findMany({
      where: { userId: ctx.userId, ...(memberId ? { memberId } : {}) },
      orderBy: { updatedAt: "desc" },
    })
    return items.map(mapHealthDocumentChunk)
  } catch {
    return mockHealthDocumentChunks.filter((item) => item.userId === ctx.userId).filter((item) => (memberId ? item.memberId === memberId : true))
  }
}

export async function deleteStaleChunks(
  ctx: RepositoryContext,
  activeKeys: ReadonlyArray<Readonly<{ sourceType: string; sourceId: string }>>,
) {
  const prisma = getPrismaClient()
  const activeKeySet = new Set(activeKeys.map((item) => `${item.sourceType}:${item.sourceId}`))
  if (!prisma) {
    for (let index = mockHealthDocumentChunks.length - 1; index >= 0; index -= 1) {
      const item = mockHealthDocumentChunks[index]!
      if (item.userId !== ctx.userId) continue
      if (!activeKeySet.has(`${item.sourceType}:${item.sourceId}`)) mockHealthDocumentChunks.splice(index, 1)
    }
    return
  }
  try {
    const items = await prisma.healthDocumentChunk.findMany({ where: { userId: ctx.userId }, select: { id: true, sourceType: true, sourceId: true } })
    const staleIds = items.filter((item) => !activeKeySet.has(`${item.sourceType}:${item.sourceId}`)).map((item) => item.id)
    if (staleIds.length > 0) await prisma.healthDocumentChunk.deleteMany({ where: { id: { in: staleIds } } })
  } catch {
    for (let index = mockHealthDocumentChunks.length - 1; index >= 0; index -= 1) {
      const item = mockHealthDocumentChunks[index]!
      if (item.userId !== ctx.userId) continue
      if (!activeKeySet.has(`${item.sourceType}:${item.sourceId}`)) mockHealthDocumentChunks.splice(index, 1)
    }
  }
}

