import {
  ArrowLeftIcon,
  CalendarClockIcon,
  ClipboardListIcon,
  ImageIcon,
  MapPinIcon,
  PackageIcon,
  PencilLineIcon,
  ShieldAlertIcon,
  TriangleAlertIcon,
} from "lucide-react"
import Link from "next/link"

import { MedicineDeleteButton } from "@/components/medicine-vault/medicine-delete-button"
import { MedicineEntryDialog } from "@/components/medicine-vault/medicine-entry-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { requireCurrentUser } from "@/features/medicine-vault/auth-context"
import { getMedicineStatus } from "@/features/medicine-vault/data"
import { getMedicineById, listMembers } from "@/features/medicine-vault/repository"

export const dynamic = "force-dynamic"

function DetailField({
  label,
  value,
}: Readonly<{
  label: string
  value: string
}>) {
  return (
    <div className="grid gap-1">
      <p className="text-xs font-medium tracking-wide text-slate-400">{label}</p>
      <p className="text-sm leading-6 text-slate-700">{value}</p>
    </div>
  )
}

export default async function MedicineDetailPage({
  params,
}: Readonly<{
  params: Promise<{ medicineId: string }>
}>) {
  const { medicineId } = await params
  const ctx = await requireCurrentUser()
  const [medicine, members] = await Promise.all([getMedicineById(ctx, medicineId), listMembers(ctx)])

  if (!medicine) {
    return (
      <div className="grid gap-6">
        <section className="rounded-[28px] border border-slate-200/70 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.04)] md:p-7">
          <div className="grid gap-4">
            <div className="flex items-center gap-3">
              <Button asChild className="rounded-full border-slate-200 bg-white text-slate-700 shadow-sm" variant="outline">
                <Link href="/medicines">
                  <ArrowLeftIcon className="size-4" aria-hidden="true" />
                  返回列表
                </Link>
              </Button>
            </div>
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-12 text-center">
              <p className="text-lg font-semibold text-slate-950">没有找到这条药品记录</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">可能已被删除，或者当前账号没有查看权限。</p>
            </div>
          </div>
        </section>
      </div>
    )
  }

  const owner = members.find((item) => item.id === medicine.memberId)
  const status = getMedicineStatus(medicine.expiresAt, medicine.quantity)
  const expiryTone =
    status.daysLeft < 0
      ? "bg-rose-50 text-rose-600"
      : status.daysLeft <= 60
        ? "bg-amber-50 text-amber-600"
        : "bg-emerald-50 text-emerald-600"
  const statusBadgeClass =
    status.label === "库存不足"
      ? "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-50"
      : ""

  return (
    <div className="grid gap-6">
      <section className="rounded-[28px] border border-slate-200/70 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.04)] md:p-7">
        <div className="flex flex-col gap-5 border-b border-slate-100 pb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="grid gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <Button asChild className="rounded-full border-slate-200 bg-white text-slate-700 shadow-sm" variant="outline">
                  <Link href="/medicines">
                    <ArrowLeftIcon className="size-4" aria-hidden="true" />
                    返回列表
                  </Link>
                </Button>
                <Badge className={`rounded-full px-3 py-1 text-xs ${statusBadgeClass}`} variant={status.tone}>
                  {status.label}
                </Badge>
              </div>

              <div className="grid gap-2">
                <h1 className="text-3xl font-semibold tracking-normal text-slate-950">{medicine.name}</h1>
                <p className="max-w-3xl text-sm leading-6 text-slate-500">
                  查看药品的完整资料、图片、使用说明和安全提醒。编辑或删除会沿用当前药品记录能力。
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
                  {owner?.name ?? "未关联成员"}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
                  {medicine.category}
                </span>
                {owner?.relationship ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
                    {owner.relationship}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <MedicineEntryDialog
                dialogDescription="更新药品名称、分类、剂量、规格、使用说明和治疗疾病。保存前也可以继续借助图片识别回填。"
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
                triggerClassName="h-11 rounded-full border-slate-200 bg-white px-5 text-slate-700 shadow-sm"
                triggerIcon={<PencilLineIcon className="size-3.5" aria-hidden="true" />}
                triggerLabel="编辑药品"
                triggerVariant="outline"
              />

              <MedicineDeleteButton medicineId={medicine.id} medicineName={medicine.name} />
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-4">
            {medicine.hasImage ? (
              <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white">
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-500">
                    <ImageIcon className="size-4 text-sky-500" aria-hidden="true" />
                    药品图片
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
                    已保存图片
                  </span>
                </div>
                <div className="flex min-h-72 items-center justify-center bg-slate-50">
                  <img
                    alt={medicine.imageName ? `${medicine.name} - ${medicine.imageName}` : medicine.name}
                    className="max-h-[28rem] w-full object-contain object-center"
                    src={`/api/medicines/${medicine.id}/image`}
                  />
                </div>
                <div className="border-t border-slate-200 px-4 py-3 text-sm text-slate-500">
                  {medicine.imageName ?? "药品原图"}
                </div>
              </div>
            ) : (
              <div className="grid min-h-72 place-items-center rounded-[22px] border border-dashed border-slate-200 bg-slate-50/70 px-6 text-center">
                <div className="grid gap-2">
                  <ImageIcon className="mx-auto size-6 text-slate-400" aria-hidden="true" />
                  <p className="text-sm font-medium text-slate-700">暂无药品图片</p>
                  <p className="text-sm leading-6 text-slate-500">可以在编辑时补上传药盒或说明书图片。</p>
                </div>
              </div>
            )}

            <div className="grid gap-4 rounded-[22px] border border-slate-200 bg-slate-50/60 p-5">
              <div className="grid gap-2 sm:grid-cols-2">
                <DetailField label="所属成员" value={owner?.name ?? "未关联成员"} />
                <DetailField label="分类" value={medicine.category} />
                <DetailField label="剂量" value={medicine.dosage} />
                <DetailField label="规格" value={medicine.specification} />
                <DetailField label="数量" value={medicine.quantity} />
                <div className="grid gap-1">
                  <p className="text-xs font-medium tracking-wide text-slate-400">有效期状态</p>
                  <p className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${expiryTone}`}>
                    <CalendarClockIcon className="size-4" aria-hidden="true" />
                    {status.daysLeft < 0 ? `已过期 ${Math.abs(status.daysLeft)} 天` : `距离过期 ${status.daysLeft} 天`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-4 rounded-[22px] border border-slate-200 bg-white p-5">
              <DetailField label="存放位置" value={medicine.storageLocation} />
              <div className="flex items-start gap-2 rounded-2xl bg-slate-50 px-4 py-3">
                <MapPinIcon className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden="true" />
                <div>
                  <p className="text-xs font-medium tracking-wide text-slate-400">存放位置提示</p>
                  <p className="mt-1 text-sm leading-6 text-slate-700">{medicine.storageLocation}</p>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-2xl bg-slate-50 px-4 py-3">
                <ClipboardListIcon className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden="true" />
                <div>
                  <p className="text-xs font-medium tracking-wide text-slate-400">使用说明</p>
                  <p className="mt-1 text-sm leading-6 text-slate-700">{medicine.instructions}</p>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-2xl bg-slate-50 px-4 py-3">
                <PackageIcon className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden="true" />
                <div>
                  <p className="text-xs font-medium tracking-wide text-slate-400">治疗疾病</p>
                  <p className="mt-1 text-sm leading-6 text-slate-700">{medicine.purpose}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 rounded-[22px] border border-slate-200 bg-white p-5">
              <div className="flex items-start gap-2 rounded-2xl bg-slate-50 px-4 py-3">
                <ClipboardListIcon className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden="true" />
                <div>
                  <p className="text-xs font-medium tracking-wide text-slate-400">补充说明</p>
                  <p className="mt-1 text-sm leading-6 text-slate-700">{medicine.usageNote}</p>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-2xl bg-rose-50 px-4 py-3">
                <ShieldAlertIcon className="mt-0.5 size-4 shrink-0 text-rose-500" aria-hidden="true" />
                <div>
                  <p className="text-xs font-medium tracking-wide text-rose-400">安全提醒</p>
                  <p className="mt-1 text-sm leading-6 text-rose-700">{medicine.safetyNote}</p>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-2xl bg-amber-50 px-4 py-3">
                <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-amber-500" aria-hidden="true" />
                <div>
                  <p className="text-xs font-medium tracking-wide text-amber-500">最近查看建议</p>
                  <p className="mt-1 text-sm leading-6 text-slate-700">
                    当前版本没有暴露修改时间字段，编辑后可直接回到列表页查看最新状态。
                  </p>
                </div>
              </div>
              <Button asChild className="h-11 rounded-full border-slate-200 bg-white text-slate-700 shadow-sm" variant="outline">
                <Link href="/medicines">
                  <ArrowLeftIcon className="size-4" aria-hidden="true" />
                  回到列表
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
