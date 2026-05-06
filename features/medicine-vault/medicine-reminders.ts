import type { Member, Medicine } from "./data"
import { getMedicineStatus } from "./data"

export type MedicineReminderStatus = "已过期" | "库存不足" | "即将过期"

export type MedicineReminderItem = Readonly<{
  id: string
  name: string
  memberName: string
  category: string
  expiresAt: string
  quantity: string
  daysLeft: number
  status: MedicineReminderStatus
  message: string
}>

export type MedicineReminderSummary = Readonly<{
  total: number
  expiredCount: number
  lowStockCount: number
  expiringSoonCount: number
  items: MedicineReminderItem[]
}>

const reminderPriority: Record<MedicineReminderStatus, number> = {
  已过期: 0,
  库存不足: 1,
  即将过期: 2,
}

function getMedicineQuantityLabel(quantity: string) {
  const trimmed = quantity.trim()
  return trimmed || "未知库存"
}

function getMemberName(memberId: string, members: readonly Member[]) {
  return members.find((member) => member.id === memberId)?.name ?? "未关联成员"
}

export function buildMedicineReminderSummary(
  medicines: readonly Medicine[],
  members: readonly Member[] = []
): MedicineReminderSummary {
  const items = medicines
    .map((medicine) => {
      const status = getMedicineStatus(medicine.expiresAt, medicine.quantity)

      if (status.label === "状态正常") {
        return null
      }

      const quantityLabel = getMedicineQuantityLabel(medicine.quantity)
      const message =
        status.label === "已过期"
          ? `已过期 ${Math.abs(status.daysLeft)} 天`
          : status.label === "库存不足"
            ? `库存剩 ${quantityLabel}`
            : `距离过期 ${status.daysLeft} 天`

      return {
        id: medicine.id,
        name: medicine.name,
        memberName: getMemberName(medicine.memberId, members),
        category: medicine.category,
        expiresAt: medicine.expiresAt,
        quantity: medicine.quantity,
        daysLeft: status.daysLeft,
        status: status.label as MedicineReminderStatus,
        message,
      }
    })
    .filter((item): item is MedicineReminderItem => item !== null)
    .sort((left, right) => {
      const statusOrder = reminderPriority[left.status] - reminderPriority[right.status]

      if (statusOrder !== 0) {
        return statusOrder
      }

      if (left.daysLeft !== right.daysLeft) {
        return left.daysLeft - right.daysLeft
      }

      return left.id.localeCompare(right.id)
    })

  return {
    total: items.length,
    expiredCount: items.filter((item) => item.status === "已过期").length,
    lowStockCount: items.filter((item) => item.status === "库存不足").length,
    expiringSoonCount: items.filter((item) => item.status === "即将过期").length,
    items,
  }
}
