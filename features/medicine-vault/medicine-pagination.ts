import { getMedicineStatus } from "./data"

export const DEFAULT_MEDICINE_PAGE_SIZE = 6

export type MedicineLike = Readonly<{
  id: string
  expiresAt: string
  quantity: string
}>

export function clampMedicinePage(page: number, totalPages: number) {
  if (!Number.isFinite(page) || page < 1) {
    return 1
  }

  return Math.min(Math.floor(page), Math.max(1, Math.floor(totalPages)))
}

export function sortMedicinesForDisplay<T extends MedicineLike>(items: readonly T[]) {
  const priority = {
    已过期: 0,
    库存不足: 1,
    即将过期: 2,
    状态正常: 3,
  } as const

  return [...items].sort((left, right) => {
    const leftStatus = getMedicineStatus(left.expiresAt, left.quantity)
    const rightStatus = getMedicineStatus(right.expiresAt, right.quantity)

    const leftPriority = priority[leftStatus.label as keyof typeof priority]
    const rightPriority = priority[rightStatus.label as keyof typeof priority]

    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority
    }

    const expiryOrder = left.expiresAt.localeCompare(right.expiresAt)

    if (expiryOrder !== 0) {
      return expiryOrder
    }

    return left.id.localeCompare(right.id)
  })
}

export function paginateMedicines<T>(items: readonly T[], { page, pageSize }: { page: number; pageSize: number }) {
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = clampMedicinePage(page, totalPages)
  const start = (currentPage - 1) * pageSize

  return {
    items: items.slice(start, start + pageSize),
    total,
    page: currentPage,
    pageSize,
    totalPages,
  }
}

