import { getPrismaClient } from "@/lib/db"
import type { AllergySeverity } from "@prisma/client"

import type { RepositoryContext } from "@/features/medicine-vault/auth-context"
import type {
  AllergyRecord,
  MedicalRecordAttachment,
  MedicalRecord,
  Member,
  Medicine,
  VisitPreparation,
} from "@/features/medicine-vault/data"
import {
  allergyRecords as mockAllergyRecords,
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
import {
  backfillLegacyMedicineImage,
  type LegacyMedicineImageRecord,
} from "@/features/medicine-vault/medicine-image-backfill"
import {
  deleteMedicineImage,
  readMedicineImage,
  storeMedicineImage,
} from "@/features/medicine-vault/medicine-image-storage"
import type {
  CreateAllergyRecordInput,
  CreateMedicalRecordInput,
  CreateMemberInput,
  CreateMedicineInput,
  UpdateMemberInput,
} from "@/features/medicine-vault/schemas"
import type { MedicineImageAttachment } from "@/features/medicine-vault/medicine-request"
import {
  deleteMedicalRecordAttachment,
  readMedicalRecordAttachment,
  storeMedicalRecordAttachment,
} from "@/features/medicine-vault/medical-record-attachment-storage"

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

export type AiCallLogInput = Readonly<{
  routeKey: string
  provider: string
  model: string
  status: "success" | "error" | "fallback" | "rate_limited"
  inputBytes?: number
  outputBytes?: number
  errorMessage?: string
}>

export type CreateMedicalRecordAttachmentInput = Readonly<{
  fileBytes: Uint8Array
  fileName: string
  mimeType: string
  kind: string
  note: string
}>

export { DEFAULT_MEDICINE_PAGE_SIZE } from "@/features/medicine-vault/medicine-pagination"

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

function mapMedicalRecord(record: {
  id: string
  userId: string
  memberId: string
  visitedAt: Date
  hospitalName: string
  department: string
  symptoms: string
  diagnosis: string
  clinicalSummary?: string
  examinationResults?: string
  followUpAt?: string
  doctorAdvice: string
  prescriptionNote: string
  note: string
  attachments?: Array<{
    id: string
    userId: string
    recordId: string
    fileName: string
    mimeType: string
    kind: string
    note: string
    createdAt: Date
  }>
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
    clinicalSummary: record.clinicalSummary ?? "",
    examinationResults: record.examinationResults ?? "",
    followUpAt: record.followUpAt ?? "",
    doctorAdvice: record.doctorAdvice,
    prescriptionNote: record.prescriptionNote,
    note: record.note,
    attachments: record.attachments?.map(mapMedicalRecordAttachment) ?? [],
  }
}

function mapMedicalRecordAttachment(attachment: {
  id: string
  userId: string
  recordId: string
  fileName: string
  mimeType: string
  kind: string
  note: string
  createdAt: Date
}): MedicalRecordAttachment {
  return {
    id: attachment.id,
    userId: attachment.userId,
    recordId: attachment.recordId,
    fileName: attachment.fileName,
    mimeType: attachment.mimeType,
    kind: attachment.kind,
    note: attachment.note,
    createdAt: formatDateOnly(attachment.createdAt),
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
  imageKey?: string | null
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
    hasImage: medicineHasStoredImage(medicine),
    imageName: medicine.imageName ?? undefined,
  }
}

export function medicineHasStoredImage(medicine: {
  imageBytes?: Uint8Array | Buffer | null
  imageKey?: string | null
}) {
  return Boolean(medicine.imageKey?.trim() || medicine.imageBytes?.length)
}

async function bestEffortDeleteMedicineImage(imageKey: string | undefined | null) {
  if (!imageKey?.trim()) {
    return
  }

  try {
    await deleteMedicineImage(imageKey)
  } catch {
    // Image cleanup must never block medicine writes or deletes.
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
  userId: string
  memberId: string
  concern: string
  summary: string
  questions: string[]
}): VisitPreparation {
  return {
    userId: item.userId,
    memberId: item.memberId,
    concern: item.concern,
    summary: item.summary,
    questions: item.questions,
  }
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
      include: {
        attachments: {
          orderBy: { createdAt: "desc" },
        },
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
        id: true,
        userId: true,
        name: true,
        imageKey: true,
        imageBytes: true,
        imageMimeType: true,
        imageName: true,
      },
    })

    if (!medicine) {
      return undefined
    }

    if (medicine?.imageKey) {
      try {
        const storedImage = await readMedicineImage(medicine.imageKey)

        return {
          name: medicine.name,
          imageBytes: storedImage.imageBytes,
          imageMimeType: storedImage.imageMimeType,
          imageName: storedImage.imageName,
        }
      } catch {
        // Fall back to legacy bytea data if the file-based image is missing or damaged.
      }
    }

    const legacyBackfill = await backfillLegacyMedicineImage(
      medicine,
      {
        storeMedicineImage: async (input) => storeMedicineImage(input),
        updateMedicineImageKey: async (legacyMedicineId, imageKey) => {
          await prisma.medicine.update({
            where: { id: legacyMedicineId },
            data: {
              imageKey,
              imageBytes: null,
              imageMimeType: null,
              imageName: null,
            },
          })
        },
        deleteMedicineImage: async (imageKey) => {
          await deleteMedicineImage(imageKey)
        },
      }
    )

    if (legacyBackfill) {
      return {
        name: medicine.name,
        imageBytes: medicine.imageBytes!,
        imageMimeType: legacyBackfill.imageMimeType,
        imageName: legacyBackfill.imageName,
      }
    }

    if (!medicine.imageBytes?.length) {
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

export async function listAllergyRecords(ctx: RepositoryContext, memberId?: string) {
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

export async function logAiCall(ctx: RepositoryContext, input: AiCallLogInput) {
  const prisma = getPrismaClient()

  if (!prisma) return

  try {
    await prisma.aiCallLog.create({
      data: {
        userId: ctx.userId,
        routeKey: input.routeKey,
        provider: input.provider,
        model: input.model,
        status: input.status,
        inputBytes: input.inputBytes ?? 0,
        outputBytes: input.outputBytes ?? 0,
        errorMessage: input.errorMessage?.slice(0, 500),
      },
    })
  } catch {
    // AI call logging is best effort and must never block the user workflow.
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
      clinicalSummary: fallbackText(input.clinicalSummary, ""),
      examinationResults: fallbackText(input.examinationResults, ""),
      followUpAt: fallbackText(input.followUpAt, ""),
      doctorAdvice: input.advice,
      prescriptionNote: "待补充处方信息。",
      note: "通过原型表单录入。",
    },
  })

  return mapMedicalRecord(record)
}

export async function createMedicalRecordAttachment(
  ctx: RepositoryContext,
  recordId: string,
  input: CreateMedicalRecordAttachmentInput
) {
  const prisma = getPrismaClient()

  if (!prisma) {
    throw new Error("当前还没有配置 DATABASE_URL，暂时无法写入真实数据库。")
  }

  const record = await prisma.medicalRecord.findFirst({
    where: {
      id: recordId,
      userId: ctx.userId,
    },
    select: { id: true },
  })

  if (!record) {
    throw new Error("病历不存在或不属于当前用户。")
  }

  const stored = await storeMedicalRecordAttachment({
    userId: ctx.userId,
    recordId,
    fileBytes: input.fileBytes,
    fileName: input.fileName,
    mimeType: input.mimeType,
  })

  try {
    const attachment = await prisma.medicalRecordAttachment.create({
      data: {
        userId: ctx.userId,
        recordId,
        fileKey: stored.fileKey,
        fileName: stored.fileName,
        mimeType: stored.mimeType,
        kind: fallbackText(input.kind, "检查报告"),
        note: fallbackText(input.note, ""),
      },
    })

    return mapMedicalRecordAttachment(attachment)
  } catch (error) {
    await deleteMedicalRecordAttachment(stored.fileKey)
    throw error
  }
}

export async function getMedicalRecordAttachmentById(
  ctx: RepositoryContext,
  recordId: string,
  attachmentId: string
) {
  const prisma = getPrismaClient()

  if (!prisma) {
    return undefined
  }

  try {
    const attachment = await prisma.medicalRecordAttachment.findFirst({
      where: {
        id: attachmentId,
        recordId,
        userId: ctx.userId,
      },
    })

    if (!attachment) {
      return undefined
    }

    const stored = await readMedicalRecordAttachment(attachment.fileKey)

    return {
      fileBytes: stored.fileBytes,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
    }
  } catch {
    return undefined
  }
}

export async function deleteMedicalRecordAttachmentById(
  ctx: RepositoryContext,
  recordId: string,
  attachmentId: string
) {
  const prisma = getPrismaClient()

  if (!prisma) {
    throw new Error("当前还没有配置 DATABASE_URL，暂时无法写入真实数据库。")
  }

  const attachment = await prisma.medicalRecordAttachment.findFirst({
    where: {
      id: attachmentId,
      recordId,
      userId: ctx.userId,
    },
  })

  if (!attachment) {
    throw new Error("病历附件不存在或不属于当前用户。")
  }

  const deleted = await prisma.medicalRecordAttachment.delete({
    where: { id: attachmentId },
  })

  await deleteMedicalRecordAttachment(attachment.fileKey)

  return mapMedicalRecordAttachment(deleted)
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

  const storedImage = image
    ? await storeMedicineImage({
        userId: ctx.userId,
        medicineId: input.memberId,
        imageBytes: image.bytes,
        imageMimeType: image.mimeType,
        imageName: image.name,
      })
    : undefined

  try {
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
        imageKey: storedImage?.imageKey,
        imageBytes: null,
        imageMimeType: null,
        imageName: null,
      },
    })

    return mapMedicine(medicine)
  } catch (error) {
    if (storedImage) {
      await bestEffortDeleteMedicineImage(storedImage.imageKey)
    }

    throw error
  }
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

  const existingMedicine = await prisma.medicine.findFirst({
    where: {
      id: medicineId,
      userId: ctx.userId,
    },
    select: {
      id: true,
      imageKey: true,
      imageBytes: true,
      imageMimeType: true,
      imageName: true,
    },
  })

  if (!existingMedicine) {
    throw new Error("药品记录不存在或不属于当前用户。")
  }

  const storedImage = image
    ? await storeMedicineImage({
        userId: ctx.userId,
        medicineId,
        imageBytes: image.bytes,
        imageMimeType: image.mimeType,
        imageName: image.name,
      })
    : undefined

  try {
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
        ...(storedImage
          ? {
              imageKey: storedImage.imageKey,
              imageBytes: null,
              imageMimeType: null,
              imageName: null,
            }
          : {}),
      },
    })

    if (storedImage && existingMedicine.imageKey && existingMedicine.imageKey !== storedImage.imageKey) {
      await bestEffortDeleteMedicineImage(existingMedicine.imageKey)
    }

    return mapMedicine(medicine)
  } catch (error) {
    if (storedImage) {
      await bestEffortDeleteMedicineImage(storedImage.imageKey)
    }

    throw error
  }
}

export async function deleteMedicine(ctx: RepositoryContext, medicineId: string) {
  const prisma = getPrismaClient()

  if (!prisma) {
    throw new Error("当前还没有配置 DATABASE_URL，暂时无法写入真实数据库。")
  }

  const existingMedicine = await prisma.medicine.findFirst({
    where: {
      id: medicineId,
      userId: ctx.userId,
    },
    select: {
      id: true,
      imageKey: true,
    },
  })

  if (!existingMedicine) {
    throw new Error("药品记录不存在或不属于当前用户。")
  }

  const medicine = await prisma.medicine.delete({
    where: { id: medicineId },
  })

  await bestEffortDeleteMedicineImage(existingMedicine.imageKey)

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
