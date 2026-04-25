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
  category: string
  dosage: string
  instructions: string
  purpose: string
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
    category: "止痛退烧",
    dosage: "0.3g/粒",
    instructions: "口服，按说明或医嘱使用。",
    purpose: "缓解发热、肌肉酸痛和轻中度疼痛。",
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
    category: "抗过敏",
    dosage: "10mg/片",
    instructions: "口服，每次 1 片，每日 1 次。",
    purpose: "缓解过敏性鼻炎、打喷嚏和流清涕。",
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
    category: "补液",
    dosage: "III 型/袋",
    instructions: "按比例冲调，少量多次补液。",
    purpose: "腹泻或呕吐后补充水分和电解质。",
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
    category: "设备耗材",
    dosage: "AAA/节",
    instructions: "用于家用血压计供电，电量不足及时更换。",
    purpose: "保障家庭血压监测连续性。",
    specification: "AAA 电池",
    quantity: "4 节",
    expiresAt: "2025-12-01",
    storageLocation: "卧室床头柜",
    usageNote: "家庭血压监测设备备用。",
    safetyNote: "非药品，但影响长期监测连续性。",
  },
  {
    id: "medicine-vitamin-c",
    memberId: "member-cp",
    name: "维生素 C 片",
    category: "营养补充",
    dosage: "100mg/片",
    instructions: "口服，每次 1 片，每日 2 次。",
    purpose: "用于日常补充维生素 C。",
    specification: "100mg * 60 片",
    quantity: "1 瓶",
    expiresAt: "2025-12-10",
    storageLocation: "厨房收纳柜",
    usageNote: "不作为治疗替代，仅作日常补充。",
    safetyNote: "若同时服用其他补充剂，需要注意重复摄入。",
  },
  {
    id: "medicine-cold-granule",
    memberId: "member-mom",
    name: "感冒灵颗粒",
    category: "感冒对症",
    dosage: "10g/袋",
    instructions: "温水冲服，每次 1 袋，每日 3 次。",
    purpose: "缓解感冒初期头痛、鼻塞和咽喉不适。",
    specification: "10g * 9 袋",
    quantity: "1 盒",
    expiresAt: "2025-11-05",
    storageLocation: "客厅药箱",
    usageNote: "仅用于轻症对症，不适合长期连续使用。",
    safetyNote: "与退烧止痛药同服前，需要先确认成分是否重复。",
  },
  {
    id: "medicine-amoxicillin",
    memberId: "member-mom",
    name: "阿莫西林胶囊",
    category: "抗感染",
    dosage: "0.5g/粒",
    instructions: "应在医生指导下使用，不自行启用。",
    purpose: "用于细菌感染治疗。",
    specification: "0.5g * 24 粒",
    quantity: "1 盒",
    expiresAt: "2026-06-20",
    storageLocation: "卧室抽屉",
    usageNote: "保留剩余药品信息，便于复诊时核对。",
    safetyNote: "家庭成员如有青霉素类过敏史，不应自行使用。",
  },
  {
    id: "medicine-cefixime",
    memberId: "member-child",
    name: "头孢克肟片",
    category: "抗感染",
    dosage: "0.1g/片",
    instructions: "儿童使用前需核对体重和医嘱。",
    purpose: "细菌感染治疗备用记录。",
    specification: "0.1g * 6 片",
    quantity: "1 盒",
    expiresAt: "2025-10-20",
    storageLocation: "儿童药箱",
    usageNote: "仅保留就诊后未用完药品信息，便于后续问诊说明。",
    safetyNote: "不要将既往剩余抗生素作为下次感冒自行用药依据。",
  },
  {
    id: "medicine-levocetirizine",
    memberId: "member-cp",
    name: "左西替利嗪片",
    category: "抗过敏",
    dosage: "5mg/片",
    instructions: "睡前服用更合适，注意观察困倦反应。",
    purpose: "缓解鼻炎、皮疹或瘙痒不适。",
    specification: "5mg * 14 片",
    quantity: "1 盒",
    expiresAt: "2026-09-30",
    storageLocation: "卧室抽屉",
    usageNote: "换季过敏明显时备查，实际使用以医生建议为准。",
    safetyNote: "若影响精神状态或驾驶安全，需要谨慎安排用药时间。",
  },
  {
    id: "medicine-cough-syrup",
    memberId: "member-child",
    name: "双黄连口服液",
    category: "咽喉舒缓",
    dosage: "10ml/支",
    instructions: "按说明口服，儿童服用需再次确认。",
    purpose: "作为既往家庭常备药记录。",
    specification: "10ml * 10 支",
    quantity: "1 盒",
    expiresAt: "2026-03-12",
    storageLocation: "儿童药箱",
    usageNote: "使用前先核对症状与适应证，不把常备药等同于通用方案。",
    safetyNote: "儿童症状持续或加重时，应优先复诊。",
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
