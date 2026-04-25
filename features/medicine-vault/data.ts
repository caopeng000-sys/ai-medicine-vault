export type Member = {
  id: string
  name: string
  relationship: string
  birthYear: number
  gender: "男" | "女"
  allergySummary: string
  note: string
}

export type MedicalRecord = {
  id: string
  memberId: string
  visitedAt: string
  hospitalName: string
  department: string
  symptoms: string
  diagnosis: string
  doctorAdvice: string
  prescriptionNote: string
  note: string
}

export type Medicine = {
  id: string
  memberId: string
  name: string
  specification: string
  quantity: string
  expiresAt: string
  storageLocation: string
  usageNote: string
  safetyNote: string
}

export type AllergyRecord = {
  id: string
  memberId: string
  allergen: string
  reaction: string
  severity: "轻微" | "中等" | "严重"
  discoveredAt: string
  note: string
}

export type VisitPreparation = {
  memberId: string
  concern: string
  summary: string
  questions: string[]
}

export const members: Member[] = [
  {
    id: "member-cp",
    name: "曹鹏",
    relationship: "本人",
    birthYear: 1994,
    gender: "男",
    allergySummary: "青霉素疑似过敏，需就医前主动说明。",
    note: "过敏性鼻炎反复发作，换季时需要关注用药和复诊记录。",
  },
  {
    id: "member-mom",
    name: "妈妈",
    relationship: "母亲",
    birthYear: 1968,
    gender: "女",
    allergySummary: "暂无明确药物过敏记录。",
    note: "长期关注血压和睡眠情况，复诊信息需要定期整理。",
  },
  {
    id: "member-child",
    name: "小朋友",
    relationship: "家庭成员",
    birthYear: 2018,
    gender: "女",
    allergySummary: "海鲜后出现皮疹，需继续观察并咨询医生。",
    note: "儿童用药剂量需要严格按医生或药师建议确认。",
  },
]

export const medicalRecords: MedicalRecord[] = [
  {
    id: "record-20260412",
    memberId: "member-cp",
    visitedAt: "2026-04-12",
    hospitalName: "社区门诊",
    department: "全科",
    symptoms: "低烧、咳嗽、咽喉不适，夜间加重。",
    diagnosis: "上呼吸道感染倾向。",
    doctorAdvice: "多饮水，观察体温变化，若高热或喘憋及时复诊。",
    prescriptionNote: "对症处理，避免自行叠加退烧药。",
    note: "就医前已服用一次布洛芬，需要下次复诊时说明。",
  },
  {
    id: "record-20260308",
    memberId: "member-cp",
    visitedAt: "2026-03-08",
    hospitalName: "市立医院",
    department: "耳鼻喉科",
    symptoms: "鼻塞、打喷嚏、流清涕，换季明显。",
    diagnosis: "过敏性鼻炎。",
    doctorAdvice: "减少过敏原暴露，规律使用鼻喷剂，必要时复查。",
    prescriptionNote: "氯雷他定按需使用，鼻喷剂按医嘱使用。",
    note: "春季复发明显，可作为后续 AI 问答的重要上下文。",
  },
  {
    id: "record-20260215",
    memberId: "member-mom",
    visitedAt: "2026-02-15",
    hospitalName: "区中心医院",
    department: "心内科",
    symptoms: "偶发头晕，晨起血压偏高。",
    diagnosis: "血压波动，需要家庭监测。",
    doctorAdvice: "记录晨晚血压，低盐饮食，按时复诊。",
    prescriptionNote: "药物调整需由医生确认。",
    note: "后续需要增加血压记录模块，目前先作为病历备注保留。",
  },
  {
    id: "record-20260122",
    memberId: "member-child",
    visitedAt: "2026-01-22",
    hospitalName: "儿童医院",
    department: "儿科",
    symptoms: "皮疹、瘙痒，进食海鲜后出现。",
    diagnosis: "疑似食物过敏。",
    doctorAdvice: "避免再次接触可疑食物，必要时做过敏原检查。",
    prescriptionNote: "儿童用药剂量必须由医生或药师确认。",
    note: "家庭成员查看时需要突出显示。",
  },
]

export const medicines: Medicine[] = [
  {
    id: "medicine-ibuprofen",
    memberId: "member-cp",
    name: "布洛芬缓释胶囊",
    specification: "0.3g * 20 粒",
    quantity: "1 盒",
    expiresAt: "2026-09-30",
    storageLocation: "客厅药箱",
    usageNote: "发热或疼痛时查看说明并咨询医生或药师。",
    safetyNote: "胃部不适、重复退烧药叠加需谨慎。",
  },
  {
    id: "medicine-loratadine",
    memberId: "member-cp",
    name: "氯雷他定片",
    specification: "10mg * 12 片",
    quantity: "2 盒",
    expiresAt: "2027-02-28",
    storageLocation: "卧室抽屉",
    usageNote: "过敏性鼻炎发作时按说明或医嘱使用。",
    safetyNote: "若症状持续或加重，应咨询医生。",
  },
  {
    id: "medicine-ors",
    memberId: "member-child",
    name: "口服补液盐",
    specification: "III 型 * 6 袋",
    quantity: "1 盒",
    expiresAt: "2026-05-20",
    storageLocation: "儿童药箱",
    usageNote: "腹泻脱水风险时用于补液，儿童用量需确认。",
    safetyNote: "儿童使用前建议咨询医生或药师。",
  },
  {
    id: "medicine-thermometer-strip",
    memberId: "member-mom",
    name: "电子血压计电池",
    specification: "AAA 电池",
    quantity: "4 节",
    expiresAt: "2025-12-01",
    storageLocation: "卧室床头柜",
    usageNote: "家庭血压监测设备备用。",
    safetyNote: "非药品，但影响长期监测连续性。",
  },
]

export const allergyRecords: AllergyRecord[] = [
  {
    id: "allergy-penicillin",
    memberId: "member-cp",
    allergen: "青霉素",
    reaction: "既往使用后出现皮疹，具体药品和剂量待补充。",
    severity: "中等",
    discoveredAt: "2012-08-10",
    note: "就医前需要主动告知医生。",
  },
  {
    id: "allergy-seafood",
    memberId: "member-child",
    allergen: "海鲜",
    reaction: "进食后出现皮疹和瘙痒。",
    severity: "轻微",
    discoveredAt: "2026-01-22",
    note: "建议后续做过敏原检查。",
  },
]

export const visitPreparations: VisitPreparation[] = [
  {
    memberId: "member-cp",
    concern: "咳嗽低烧复诊前准备",
    summary: "近期有上呼吸道感染记录，也有过敏性鼻炎史。就医时需要说明低烧、咳嗽持续时间、已使用药品和青霉素疑似过敏史。",
    questions: [
      "当前咳嗽是否需要进一步检查？",
      "已使用布洛芬后是否还可以继续按需使用？",
      "过敏性鼻炎是否可能加重当前症状？",
      "青霉素疑似过敏是否需要补充过敏原检查？",
    ],
  },
]

export function getMemberById(memberId: string) {
  return members.find((member) => member.id === memberId)
}

export function getRecordsForMember(memberId: string) {
  return medicalRecords
    .filter((record) => record.memberId === memberId)
    .toSorted((a, b) => b.visitedAt.localeCompare(a.visitedAt))
}

export function getMedicinesForMember(memberId: string) {
  return medicines.filter((medicine) => medicine.memberId === memberId)
}

export function getAllergiesForMember(memberId: string) {
  return allergyRecords.filter((record) => record.memberId === memberId)
}

export function getVisitPreparationForMember(memberId: string) {
  return visitPreparations.find((item) => item.memberId === memberId)
}

export function getMedicineStatus(expiresAt: string) {
  const today = new Date("2026-04-25T00:00:00+08:00")
  const expires = new Date(`${expiresAt}T00:00:00+08:00`)
  const daysLeft = Math.ceil((expires.getTime() - today.getTime()) / 86_400_000)

  if (daysLeft < 0) {
    return { label: "已过期", tone: "destructive" as const, daysLeft }
  }

  if (daysLeft <= 60) {
    return { label: "即将过期", tone: "outline" as const, daysLeft }
  }

  return { label: "状态正常", tone: "secondary" as const, daysLeft }
}
