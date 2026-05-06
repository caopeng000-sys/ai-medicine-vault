"use client"

import { FileDownIcon, FileJsonIcon, InfoIcon, ShieldCheckIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function ExperienceLinks() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button asChild className="rounded-2xl border-slate-200 bg-white text-slate-600 hover:bg-slate-50" size="sm" variant="outline">
        <a download href="/api/export?format=json">
          <FileJsonIcon className="size-4" aria-hidden="true" />
          导出 JSON
        </a>
      </Button>

      <Button asChild className="rounded-2xl border-slate-200 bg-white text-slate-600 hover:bg-slate-50" size="sm" variant="outline">
        <a download href="/api/export?format=csv">
          <FileDownIcon className="size-4" aria-hidden="true" />
          导出 CSV
        </a>
      </Button>

      <Dialog>
        <DialogTrigger asChild>
          <Button className="rounded-2xl border-slate-200 bg-white text-slate-600 hover:bg-slate-50" size="sm" variant="outline">
            <ShieldCheckIcon className="size-4" aria-hidden="true" />
            隐私说明
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>隐私与数据隔离</DialogTitle>
            <DialogDescription>
              当前版本会按登录账号或开发体验账号隔离成员、病历、药品和过敏资料，导出仅包含当前账号可见的数据。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 text-sm leading-6 text-slate-600">
            <p>导出文件会生成到本地浏览器下载目录，建议只在可信设备上操作，并妥善保管包含健康资料的附件。</p>
            <p>若上线到生产环境，请完成 `AUTH_SECRET` 与 provider 配置，再启用真实账号登录与会话管理。</p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog>
        <DialogTrigger asChild>
          <Button className="rounded-2xl border-slate-200 bg-white text-slate-600 hover:bg-slate-50" size="sm" variant="outline">
            <InfoIcon className="size-4" aria-hidden="true" />
            使用声明
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>使用声明</DialogTitle>
            <DialogDescription>
              这里提供的是家庭健康资料整理与导出工具，不替代执业医生、药师或正式病历系统。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 text-sm leading-6 text-slate-600">
            <p>AI 助手回答与结构化建议仅供整理线索、回顾病史和做就医准备，关键诊疗决策仍应以专业医护意见为准。</p>
            <p>导出 CSV 更适合表格整理，JSON 更适合备份和后续系统导入。敏感信息分享前请先自行脱敏。</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
