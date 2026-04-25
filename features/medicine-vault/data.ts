export type MedicineItem = {
  name: string
  status: string
  note: string
}

export type TimelineItem = {
  label: string
  value: string
}

export const medicineItems: MedicineItem[] = [
  {
    name: "布洛芬",
    status: "家中常备",
    note: "退热止痛，需注意胃部不适",
  },
  {
    name: "氯雷他定",
    status: "过敏季",
    note: "用于过敏性鼻炎相关记录",
  },
  {
    name: "口服补液盐",
    status: "应急",
    note: "腹泻脱水风险时查看用法",
  },
]

export const recordItems: string[] = [
  "2026-04-12 感冒发热记录",
  "2026-03-08 过敏性鼻炎复诊",
  "2025-12-21 体检报告摘要",
]

export const workflowSteps: TimelineItem[] = [
  {
    label: "资料入库",
    value: "病历、药品、过敏史",
  },
  {
    label: "AI 检索",
    value: "优先使用个人历史记录",
  },
  {
    label: "就医清单",
    value: "整理可核对的问题",
  },
]
