export type AiSafetyGuardrailResult = Readonly<{
  text: string
  flagged: string[]
}>

const DISCLAIMER = "请咨询医生或药师确认后再做决定。"

const SENSITIVE_REPLACEMENTS: ReadonlyArray<{
  pattern: RegExp
  label: string
  replacement: string
}> = [
  {
    pattern: /(?:初步)?诊断为[^，。；\n]{0,30}/g,
    label: "诊断",
    replacement: DISCLAIMER,
  },
  {
    pattern: /(?:建议|应该|可以|需要)?停药[^，。；\n]{0,20}/g,
    label: "停药",
    replacement: DISCLAIMER,
  },
  {
    pattern: /(?:建议|应该|可以|需要)?(?:加量|减量|加大剂量|减少剂量)[^，。；\n]{0,20}/g,
    label: "加量",
    replacement: DISCLAIMER,
  },
  {
    pattern: /可能是[^，。；\n？?！!]{1,24}/g,
    label: "可能是X病",
    replacement: DISCLAIMER,
  },
  {
    pattern: /(?:建议|应该|可以|推荐)(?:服用|用药|换药|替代)[^，。；\n]{0,30}/g,
    label: "用药建议",
    replacement: DISCLAIMER,
  },
  {
    pattern: /(?:治疗|用药)方案[^，。；\n]{0,30}/g,
    label: "治疗方案",
    replacement: DISCLAIMER,
  },
  {
    pattern: /(?:无需|不必|不用)(?:就医|看医生|就诊)/g,
    label: "就医判断",
    replacement: DISCLAIMER,
  },
]

const HIGH_RISK_QUESTION_PATTERNS: ReadonlyArray<{
  pattern: RegExp
  label: string
}> = [
  { pattern: /吃什么药|用什么药|推荐.{0,6}药|该吃.{0,6}药/, label: "用药推荐" },
  { pattern: /是不是.{0,12}[病症炎]|会不会是.{0,12}[病症炎]|可能是.{0,12}[病症炎]吗/, label: "疾病判断" },
  { pattern: /要不要.{0,6}医院|需不需要.{0,6}就医|严重吗|要紧吗/, label: "就医判断" },
  { pattern: /停药|加量|减量|加大剂量|减少剂量/, label: "剂量调整" },
  { pattern: /诊断|确诊/, label: "诊断请求" },
]

export const HIGH_RISK_QUESTION_TEMPLATE =
  "这类问题需要专业医疗人员判断。我无法提供诊断、用药或剂量调整建议，请咨询医生或药师确认。"

export function isHighRiskQuestion(question: string): boolean {
  const normalized = question.trim()
  if (!normalized) return false
  return HIGH_RISK_QUESTION_PATTERNS.some(({ pattern }) => pattern.test(normalized))
}

export function applyAiSafetyGuardrail(text: string): AiSafetyGuardrailResult {
  const normalized = text.trim()
  if (!normalized) {
    return { text: "", flagged: [] }
  }

  let guardedText = normalized
  const flagged: string[] = []

  for (const { pattern, label, replacement } of SENSITIVE_REPLACEMENTS) {
    pattern.lastIndex = 0
    if (!pattern.test(guardedText)) continue

    pattern.lastIndex = 0
    guardedText = guardedText.replace(pattern, replacement)
    flagged.push(label)
  }

  const uniqueFlagged = [...new Set(flagged)]
  if (uniqueFlagged.length === 0) {
    return { text: guardedText, flagged: [] }
  }

  if (!guardedText.includes(DISCLAIMER)) {
    guardedText = `${guardedText}\n\n${DISCLAIMER}`
  }

  return { text: guardedText, flagged: uniqueFlagged }
}

export function guardAiText(text: string) {
  return applyAiSafetyGuardrail(text).text
}
