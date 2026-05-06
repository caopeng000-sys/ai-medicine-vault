import type { AllergyRecord, MedicalRecord, Member, Medicine } from "./data"
import { buildMedicineReminderSummary } from "./medicine-reminders"

export type HealthReminderPriority = "高" | "中" | "低"
export type HealthReminderKind = "药品" | "复诊" | "过敏"

export type HealthReminderItem = Readonly<{
  id: string
  kind: HealthReminderKind
  priority: HealthReminderPriority
  title: string
  memberName: string
  message: string
  detail: string
  dueAt: string
  href: string
}>

export type HealthReminderSummary = Readonly<{
  total: number
  highCount: number
  mediumCount: number
  lowCount: number
  medicineCount: number
  followUpCount: number
  allergyCount: number
  items: HealthReminderItem[]
}>

const priorityOrder: Record<HealthReminderPriority, number> = {
  高: 0,
  中: 1,
  低: 2,
}

function getMemberName(memberId: string, members: readonly Member[]) {
  return members.find((member) => member.id === memberId)?.name ?? "未关联成员"
}

function parseDateOnly(value: string) {
  const trimmed = value.trim()

  if (!trimmed) return undefined

  const parsed = new Date(`${trimmed}T00:00:00+08:00`)

  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

function getDayDelta(value: string, referenceDate: Date) {
  const parsed = parseDateOnly(value)

  if (!parsed) return undefined

  return Math.ceil((parsed.getTime() - referenceDate.getTime()) / 86_400_000)
}

function buildFollowUpReminderItems(
  records: readonly MedicalRecord[],
  members: readonly Member[],
  referenceDate: Date
) {
  return records
    .map((record): HealthReminderItem | null => {
      const daysLeft = getDayDelta(record.followUpAt ?? "", referenceDate)

      if (typeof daysLeft !== "number" || daysLeft > 14) {
        return null
      }

      const priority: HealthReminderPriority = daysLeft < 0 ? "高" : daysLeft <= 3 ? "中" : "低"
      const message =
        daysLeft < 0
          ? `复诊已逾期 ${Math.abs(daysLeft)} 天`
          : daysLeft === 0
            ? "今天需要关注复诊安排"
            : `距离复诊 ${daysLeft} 天`

      return {
        id: `follow-up-${record.id}`,
        kind: "复诊",
        priority,
        title: record.diagnosis,
        memberName: getMemberName(record.memberId, members),
        message,
        detail: record.clinicalSummary || record.doctorAdvice || record.symptoms,
        dueAt: record.followUpAt ?? "",
        href: `/records?member=${encodeURIComponent(record.memberId)}`,
      }
    })
    .filter((item): item is HealthReminderItem => item !== null)
}

function buildAllergyReminderItems(allergies: readonly AllergyRecord[], members: readonly Member[]) {
  return allergies
    .filter((record) => record.severity !== "轻微")
    .map((record): HealthReminderItem => {
      const priority: HealthReminderPriority = record.severity === "严重" ? "高" : "中"

      return {
        id: `allergy-${record.id}`,
        kind: "过敏",
        priority,
        title: record.allergen,
        memberName: getMemberName(record.memberId, members),
        message: record.severity === "严重" ? "高风险过敏记录" : "需要就医前主动说明",
        detail: `${record.reaction}${record.note ? ` · ${record.note}` : ""}`,
        dueAt: record.discoveredAt,
        href: `/allergies?member=${encodeURIComponent(record.memberId)}`,
      }
    })
}

export function buildHealthReminderSummary({
  medicines,
  records,
  allergies,
  members,
  referenceDate = new Date("2026-04-25T00:00:00+08:00"),
}: Readonly<{
  medicines: readonly Medicine[]
  records: readonly MedicalRecord[]
  allergies: readonly AllergyRecord[]
  members: readonly Member[]
  referenceDate?: Date
}>): HealthReminderSummary {
  const medicineItems = buildMedicineReminderSummary(medicines, members).items.map((item): HealthReminderItem => {
    const priority: HealthReminderPriority = item.status === "已过期" ? "高" : item.status === "库存不足" ? "中" : "低"

    return {
      id: `medicine-${item.id}`,
      kind: "药品",
      priority,
      title: item.name,
      memberName: item.memberName,
      message: item.message,
      detail: `${item.category} · 到期 ${item.expiresAt} · 库存 ${item.quantity}`,
      dueAt: item.expiresAt,
      href: `/medicines?q=${encodeURIComponent(item.name)}`,
    }
  })
  const followUpItems = buildFollowUpReminderItems(records, members, referenceDate)
  const allergyItems = buildAllergyReminderItems(allergies, members)
  const items = [...medicineItems, ...followUpItems, ...allergyItems].sort((left, right) => {
    const priority = priorityOrder[left.priority] - priorityOrder[right.priority]

    if (priority !== 0) return priority

    const dateOrder = left.dueAt.localeCompare(right.dueAt)

    if (dateOrder !== 0) return dateOrder

    return left.id.localeCompare(right.id)
  })

  return {
    total: items.length,
    highCount: items.filter((item) => item.priority === "高").length,
    mediumCount: items.filter((item) => item.priority === "中").length,
    lowCount: items.filter((item) => item.priority === "低").length,
    medicineCount: items.filter((item) => item.kind === "药品").length,
    followUpCount: items.filter((item) => item.kind === "复诊").length,
    allergyCount: items.filter((item) => item.kind === "过敏").length,
    items,
  }
}
