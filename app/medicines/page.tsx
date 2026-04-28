import {
  CalendarClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardListIcon,
  Clock3Icon,
  ImageIcon,
  MapPinIcon,
  PackageIcon,
  PencilLineIcon,
  SearchIcon,
  ShieldAlertIcon,
  TriangleAlertIcon,
} from "lucide-react"
import Link from "next/link"

import { MedicineEntryDialog } from "@/components/medicine-vault/medicine-entry-dialog"
import { MedicineDeleteButton } from "@/components/medicine-vault/medicine-delete-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { requireCurrentUser } from "@/features/medicine-vault/auth-context"
import { getMedicineStatus, parseMedicineQuantity } from "@/features/medicine-vault/data"
import {
  DEFAULT_MEDICINE_PAGE_SIZE,
  listMembers,
  listMedicines,
  listMedicinesPaginated,
} from "@/features/medicine-vault/repository"

export const dynamic = "force-dynamic"

export default async function MedicinesPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ category?: string; q?: string; page?: string }>
}>) {
  const { category, q, page } = await searchParams
  const normalizedQuery = q?.trim() ?? ""
  const normalizedCategory = category?.trim() ?? ""
  const parsedPage = Number.parseInt(page ?? "1", 10)
  const currentPage = Number.isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage
  const ctx = await requireCurrentUser()
  const [members, allMedicinesCatalog, allMedicines, paginatedMedicines] = await Promise.all([
    listMembers(ctx),
    listMedicines(ctx, undefined, undefined, undefined),
    listMedicines(ctx, undefined, normalizedQuery, normalizedCategory),
    listMedicinesPaginated(ctx, {
      category: normalizedCategory,
      query: normalizedQuery,
      page: currentPage,
      pageSize: DEFAULT_MEDICINE_PAGE_SIZE,
    }),
  ])
  const categoryOptions = Array.from(new Set(allMedicinesCatalog.map((item) => item.category).filter(Boolean))).sort(
    (left, right) => left.localeCompare(right, "zh-Hans-CN")
  )
  const currentCategoryLabel = normalizedCategory || "全部分类"
  const visibleMedicines = paginatedMedicines.items
  const countLabel = `${paginatedMedicines.total} 条药品记录`
  const queryLabel = normalizedQuery ? `“${normalizedQuery}”` : ""
  const totalInventoryCount = allMedicines.reduce((total, item) => {
    const quantity = parseMedicineQuantity(item.quantity)
    return total + (quantity ?? 0)
  }, 0)
  const lowStockCount = allMedicines.filter((item) => {
    const status = getMedicineStatus(item.expiresAt, item.quantity)
    return status.label === "库存不足"
  }).length
  const expiringSoonCount = allMedicines.filter((item) => {
    const status = getMedicineStatus(item.expiresAt, item.quantity)
    return status.daysLeft >= 0 && status.daysLeft <= 60
  }).length
  const expiredCount = allMedicines.filter((item) => getMedicineStatus(item.expiresAt, item.quantity).daysLeft < 0).length

  function buildMedicinesHref(nextPage: number) {
    const params = new URLSearchParams()

    if (normalizedQuery) {
      params.set("q", normalizedQuery)
    }

    if (normalizedCategory) {
      params.set("category", normalizedCategory)
    }

    if (nextPage > 1) {
      params.set("page", String(nextPage))
    }

    const serialized = params.toString()
    return serialized ? `/medicines?${serialized}` : "/medicines"
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-[28px] border border-slate-200/70 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.04)] md:p-7">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-normal text-slate-950">药物管理</h1>
                <Badge className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600 hover:bg-slate-50">
                  {q?.trim() ? `找到 ${countLabel}` : countLabel}
                </Badge>
              </div>
              <p className="max-w-3xl text-sm leading-6 text-slate-500">
                按药品库方式整理常备药、家庭设备耗材和既往剩余处方，先做资料管理，不做替代用药推荐。
                {queryLabel ? ` 当前正在搜索 ${queryLabel}。` : ""}
                {normalizedCategory ? ` 当前分类为 ${currentCategoryLabel}。` : ""}
              </p>
            </div>

            <MedicineEntryDialog
              memberId={members[0]?.id ?? ""}
              triggerLabel="新增药物记录"
            />
          </div>

          <div className="grid gap-3 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-500">
                <PackageIcon className="size-4 text-slate-500" aria-hidden="true" />
                库存总量
              </p>
              <p className="mt-3 text-2xl font-semibold text-slate-950">{totalInventoryCount}</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">按库存数量字段统计当前筛选结果的总件数。</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-500">
                <Clock3Icon className="size-4 text-slate-500" aria-hidden="true" />
                即将过期
              </p>
              <p className="mt-3 text-2xl font-semibold text-slate-950">{expiringSoonCount}</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">建议优先检查存放位置和下次复诊是否仍需保留。</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-500">
                <TriangleAlertIcon className="size-4 text-slate-500" aria-hidden="true" />
                已过期
              </p>
              <p className="mt-3 text-2xl font-semibold text-slate-950">{expiredCount}</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">过期药品应尽快处理，不继续作为家庭备药保留。</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-500">
                <ShieldAlertIcon className="size-4 text-slate-500" aria-hidden="true" />
                库存不足
              </p>
              <p className="mt-3 text-2xl font-semibold text-slate-950">{lowStockCount}</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">库存过少的药品，后续补充时优先查看。 </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <form className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-center" method="get">
              <input name="page" type="hidden" value="1" />
              <div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <SearchIcon className="size-4 text-slate-400" aria-hidden="true" />
                <Input
                  className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                  defaultValue={normalizedQuery}
                  name="q"
                  placeholder="搜索药品名称、成分、用途..."
                  type="search"
                />
              </div>

              <select
                className="h-12 min-w-44 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-100"
                name="category"
                defaultValue={normalizedCategory}
              >
                <option value="">全部分类</option>
                {categoryOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <Button
                className="h-12 rounded-2xl border-slate-200 bg-white px-5 text-slate-700 shadow-sm hover:bg-slate-50"
                type="submit"
                variant="outline"
              >
                搜索
              </Button>
            </form>
          </div>
        </div>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {visibleMedicines.length === 0 ? (
            <div className="col-span-full rounded-[26px] border border-dashed border-slate-200 bg-slate-50/70 px-6 py-12 text-center text-sm text-slate-500">
              没有找到匹配的药品记录，请换一个关键词试试。
            </div>
          ) : null}
          {visibleMedicines.map((medicine) => {
            const owner = members.find((item) => item.id === medicine.memberId)
            const status = getMedicineStatus(medicine.expiresAt, medicine.quantity)
            const expiryTone =
              status.daysLeft < 0
                ? "bg-rose-50 text-rose-500"
                : status.daysLeft <= 60
                  ? "bg-amber-50 text-amber-500"
                  : "bg-emerald-50 text-emerald-600"
            const statusBadgeClass =
              status.label === "库存不足"
                ? "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-50"
                : ""

            return (
              <Card
                className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]"
                key={medicine.id}
              >
                <CardContent className="grid gap-5 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <span
                        className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500"
                      >
                        <PackageIcon className="size-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-lg font-semibold text-slate-950">{medicine.name}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                          <span>{owner?.name ?? "未关联成员"} · {medicine.category}</span>
                          {medicine.hasImage ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600">
                              <ImageIcon className="size-3.5 text-slate-500" aria-hidden="true" />
                              已保存图片
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-medium text-slate-600">
                            <PackageIcon className="size-3.5 text-slate-400" aria-hidden="true" />
                            库存 {medicine.quantity}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-medium text-slate-600">
                            <MapPinIcon className="size-3.5 text-slate-400" aria-hidden="true" />
                            {medicine.storageLocation}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Badge className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${statusBadgeClass}`} variant={status.label === "状态正常" ? "secondary" : status.label === "已过期" ? "destructive" : "outline"}>
                      {status.label}
                    </Badge>
                  </div>

                  {medicine.hasImage ? (
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                      <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-3 py-2">
                        <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-500">
                          <ImageIcon className="size-3.5 text-sky-500" aria-hidden="true" />
                          图片预览
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-600">
                          AI 识别回填
                        </span>
                      </div>
                      <div className="h-44 w-full overflow-hidden bg-slate-50">
                        <img
                          alt={medicine.imageName ? `${medicine.name} - ${medicine.imageName}` : medicine.name}
                          className="h-full w-full object-contain object-center"
                          src={`/api/medicines/${medicine.id}/image`}
                        />
                      </div>
                      <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
                        <span className="truncate">{medicine.imageName ?? "药品原图"}</span>
                        <span className="shrink-0">点击编辑可重新上传</span>
                      </div>
                    </div>
                  ) : null}

                  <div className="grid grid-cols-2 gap-3">
                    <MedicineEntryDialog
                      dialogDescription="更新药品名称、分类、剂量、规格、使用说明和治疗疾病。保存前可以继续借助图片识别回填。"
                      dialogTitle="编辑药品记录"
                      initialValues={{
                        name: medicine.name,
                        category: medicine.category,
                        dosage: medicine.dosage,
                        specification: medicine.specification,
                        quantity: medicine.quantity,
                        storageLocation: medicine.storageLocation,
                        purpose: medicine.purpose,
                        expiresAt: medicine.expiresAt,
                        instructions: medicine.instructions,
                        usageNote: medicine.usageNote,
                        safetyNote: medicine.safetyNote,
                      }}
                      medicineId={medicine.id}
                      memberId={medicine.memberId}
                      submitLabel="保存修改"
                      triggerClassName="group h-11 justify-center rounded-full border-slate-200 bg-white px-5 text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50"
                      triggerIcon={<PencilLineIcon className="size-3.5" aria-hidden="true" />}
                      triggerLabel="编辑"
                      triggerVariant="outline"
                    />

                    <MedicineDeleteButton
                      className=""
                      medicineId={medicine.id}
                      medicineName={medicine.name}
                    />
                  </div>

                  <div className="grid gap-4 text-sm leading-6 text-slate-600">
                    <div className="grid gap-1">
                      <p className="text-xs font-medium tracking-wide text-slate-400">剂量</p>
                      <p>{medicine.dosage}</p>
                    </div>

                    <div className="grid gap-1">
                      <p className="text-xs font-medium tracking-wide text-slate-400">使用说明</p>
                      <p>{medicine.instructions}</p>
                    </div>

                    <div className="grid gap-1">
                      <p className="text-xs font-medium tracking-wide text-slate-400">用途</p>
                      <p>{medicine.purpose}</p>
                    </div>

                    <div className="grid gap-2">
                      <p className="text-xs font-medium tracking-wide text-slate-400">过期日期</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-2 text-slate-700">
                          <CalendarClockIcon className="size-4 text-slate-400" aria-hidden="true" />
                          {medicine.expiresAt}
                        </span>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${expiryTone}`}>
                          {status.daysLeft < 0 ? `已过期 ${Math.abs(status.daysLeft)} 天` : `距离过期 ${status.daysLeft} 天`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 rounded-[20px] bg-slate-50 p-4 text-sm text-slate-600">
                    <div className="flex items-start gap-2">
                      <MapPinIcon className="mt-0.5 size-4 text-slate-400" aria-hidden="true" />
                      <div>
                        <p className="font-medium text-slate-700">存放位置</p>
                        <p className="mt-1">{medicine.storageLocation}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <ClipboardListIcon className="mt-0.5 size-4 text-slate-400" aria-hidden="true" />
                      <div>
                        <p className="font-medium text-slate-700">补充说明</p>
                        <p className="mt-1">{medicine.usageNote}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <ShieldAlertIcon className="mt-0.5 size-4 text-slate-400" aria-hidden="true" />
                      <div>
                        <p className="font-medium text-slate-700">安全提醒</p>
                        <p className="mt-1">{medicine.safetyNote}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </section>

        {paginatedMedicines.totalPages > 1 ? (
          <footer className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-5 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
            <p>
              第 {paginatedMedicines.page} / {paginatedMedicines.totalPages} 页，共 {paginatedMedicines.total} 条，每页{" "}
              {DEFAULT_MEDICINE_PAGE_SIZE} 条
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                asChild
                className="rounded-xl border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
                disabled={paginatedMedicines.page <= 1}
                variant="outline"
              >
                <Link href={buildMedicinesHref(paginatedMedicines.page - 1)}>
                  <ChevronLeftIcon className="size-4" aria-hidden="true" />
                  上一页
                </Link>
              </Button>

              {Array.from({ length: paginatedMedicines.totalPages }, (_, index) => index + 1).map((pageNumber) => (
                <Button
                  asChild
                  className={
                    pageNumber === paginatedMedicines.page
                      ? "rounded-xl border-slate-900 bg-slate-900 text-white shadow-sm"
                      : "rounded-xl border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
                  }
                  key={pageNumber}
                  variant="outline"
                >
                  <Link href={buildMedicinesHref(pageNumber)}>{pageNumber}</Link>
                </Button>
              ))}

              <Button
                asChild
                className="rounded-xl border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
                disabled={paginatedMedicines.page >= paginatedMedicines.totalPages}
                variant="outline"
              >
                <Link href={buildMedicinesHref(paginatedMedicines.page + 1)}>
                  下一页
                  <ChevronRightIcon className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </footer>
        ) : (
          <footer className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5 text-sm text-slate-500">
            <p>共 {paginatedMedicines.total} 条记录</p>
            <p>每页 {DEFAULT_MEDICINE_PAGE_SIZE} 条</p>
          </footer>
        )}
      </section>
    </div>
  )
}
