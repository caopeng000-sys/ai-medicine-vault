import { getPrismaClient } from "@/lib/db"
import type { AllergySeverity } from "@prisma/client"

import type {
  AllergyRecord,
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
import type {
  CreateAllergyRecordInput,
  CreateMedicalRecordInput,
  CreateMemberInput,
  CreateMedicineInput,
  UpdateMemberInput,
} from "@/features/medicine-vault/schemas"

function toDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`)
}

function formatDateOnly(value: Date) {
  return value.toISOString().slice(0, 10)
}

function mapMember(member: {
  id: string
  name: string
  relationship: string
  birthYear: number | null
  gender: "男" | "女"
  allergySummary: string
  note: string
}): Member {
  return {
    id: member.id,
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
}): Medicine {
  return {
    id: medicine.id,
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
  }
}

function mapAllergyRecord(record: {
  id: string
  memberId: string
  allergen: string
  reaction: string
  severity: AllergySeverity | "轻微" | "中等" | "严重"
  discoveredAt: Date
  note: string
}): AllergyRecord {
  return {
    id: record.id,
    memberId: record.memberId,
    allergen: record.allergen,
    reaction: record.reaction,
    severity: record.severity,
    discoveredAt: formatDateOnly(record.discoveredAt),
    note: record.note,
  }
}

function mapVisitPreparation(item: {
  memberId: string
  concern: string
  summary: string
  questions: string[]
}): VisitPreparation {
  return {
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

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL)
}

export async function listMembers() {
  const prisma = getPrismaClient()

  if (!prisma) {
    return mockMembers
  }

  try {
    const members = await prisma.member.findMany({
      orderBy: { createdAt: "asc" },
    })

    return members.map(mapMember)
  } catch {
    return mockMembers
  }
}

export async function getMemberById(memberId: string) {
  const prisma = getPrismaClient()

  if (!prisma) {
    return mockMembers.find((member) => member.id === memberId)
  }

  try {
    const member = await prisma.member.findUnique({
      where: { id: memberId },
    })

    return member ? mapMember(member) : undefined
  } catch {
    return mockMembers.find((member) => member.id === memberId)
  }
}

export async function listMedicalRecords(memberId?: string) {
  const prisma = getPrismaClient()

  if (!prisma) {
    return mockMedicalRecords
      .filter((record) => (memberId ? record.memberId === memberId : true))
      .toSorted((a, b) => b.visitedAt.localeCompare(a.visitedAt))
  }

  try {
    const records = await prisma.medicalRecord.findMany({
      where: memberId ? { memberId } : undefined,
      orderBy: { visitedAt: "desc" },
    })

    return records.map(mapMedicalRecord)
  } catch {
    return mockMedicalRecords
      .filter((record) => (memberId ? record.memberId === memberId : true))
      .toSorted((a, b) => b.visitedAt.localeCompare(a.visitedAt))
  }
}

export async function listMedicines(memberId?: string) {
  const prisma = getPrismaClient()

  if (!prisma) {
    return mockMedicines.filter((medicine) => (memberId ? medicine.memberId === memberId : true))
  }

  try {
    const medicines = await prisma.medicine.findMany({
      where: memberId ? { memberId } : undefined,
      orderBy: { expiresAt: "asc" },
    })

    return medicines.map(mapMedicine)
  } catch {
    return mockMedicines.filter((medicine) => (memberId ? medicine.memberId === memberId : true))
  }
}

export async function getMedicineById(medicineId: string) {
  const prisma = getPrismaClient()

  if (!prisma) {
    return mockMedicines.find((medicine) => medicine.id === medicineId)
  }

  try {
    const medicine = await prisma.medicine.findUnique({
      where: { id: medicineId },
    })

    return medicine ? mapMedicine(medicine) : undefined
  } catch {
    return mockMedicines.find((medicine) => medicine.id === medicineId)
  }
}

export async function listAllergyRecords(memberId?: string) {
  const prisma = getPrismaClient()

  if (!prisma) {
    return mockAllergyRecords.filter((record) => (memberId ? record.memberId === memberId : true))
  }

  try {
    const records = await prisma.allergyRecord.findMany({
      where: memberId ? { memberId } : undefined,
      orderBy: { discoveredAt: "desc" },
    })

    return records.map(mapAllergyRecord)
  } catch {
    return mockAllergyRecords.filter((record) => (memberId ? record.memberId === memberId : true))
  }
}

export async function listVisitPreparations(memberId?: string) {
  const prisma = getPrismaClient()

  if (!prisma) {
    return mockVisitPreparations.filter((item) => (memberId ? item.memberId === memberId : true))
  }

  try {
    const items = await prisma.visitPreparation.findMany({
      where: memberId ? { memberId } : undefined,
      orderBy: { createdAt: "desc" },
    })

    return items.map(mapVisitPreparation)
  } catch {
    return mockVisitPreparations.filter((item) => (memberId ? item.memberId === memberId : true))
  }
}

export async function createMember(input: CreateMemberInput) {
  const prisma = getPrismaClient()

  if (!prisma) {
    throw new Error("当前还没有配置 DATABASE_URL，暂时无法写入真实数据库。")
  }

  const member = await prisma.member.create({
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

export async function updateMember(memberId: string, input: UpdateMemberInput) {
  const prisma = getPrismaClient()

  if (!prisma) {
    throw new Error("当前还没有配置 DATABASE_URL，暂时无法写入真实数据库。")
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

export async function deleteMember(memberId: string) {
  const prisma = getPrismaClient()

  if (!prisma) {
    throw new Error("当前还没有配置 DATABASE_URL，暂时无法写入真实数据库。")
  }

  const member = await prisma.member.delete({
    where: { id: memberId },
  })

  return mapMember(member)
}

export async function createMedicalRecord(input: CreateMedicalRecordInput) {
  const prisma = getPrismaClient()

  if (!prisma) {
    throw new Error("当前还没有配置 DATABASE_URL，暂时无法写入真实数据库。")
  }

  const { hospitalName, department } = splitHospitalField(input.hospital)
  const record = await prisma.medicalRecord.create({
    data: {
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

export async function createMedicine(input: CreateMedicineInput) {
  const prisma = getPrismaClient()

  if (!prisma) {
    throw new Error("当前还没有配置 DATABASE_URL，暂时无法写入真实数据库。")
  }

  const medicine = await prisma.medicine.create({
    data: {
      memberId: input.memberId,
      name: input.name,
      category: input.category,
      dosage: input.dosage,
      instructions: input.instructions,
      purpose: input.purpose,
      specification: input.specification,
      quantity: "1 份",
      expiresAt: toDateOnly(input.expiresAt),
      storageLocation: "待补充存放位置。",
      usageNote: "通过原型表单录入。",
      safetyNote: "后续需要补充更具体的用药风险提示。",
    },
  })

  return mapMedicine(medicine)
}

export async function updateMedicine(medicineId: string, input: CreateMedicineInput) {
  const prisma = getPrismaClient()

  if (!prisma) {
    throw new Error("当前还没有配置 DATABASE_URL，暂时无法写入真实数据库。")
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
      expiresAt: toDateOnly(input.expiresAt),
    },
  })

  return mapMedicine(medicine)
}

export async function deleteMedicine(medicineId: string) {
  const prisma = getPrismaClient()

  if (!prisma) {
    throw new Error("当前还没有配置 DATABASE_URL，暂时无法写入真实数据库。")
  }

  const medicine = await prisma.medicine.delete({
    where: { id: medicineId },
  })

  return mapMedicine(medicine)
}

export async function createAllergyRecord(input: CreateAllergyRecordInput) {
  const prisma = getPrismaClient()

  if (!prisma) {
    throw new Error("当前还没有配置 DATABASE_URL，暂时无法写入真实数据库。")
  }

  const record = await prisma.allergyRecord.create({
    data: {
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
