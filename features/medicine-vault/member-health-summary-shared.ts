import type { AssistantSource } from "./assistant-service"
import type { MemberHealthSummaryGenerated } from "./schemas"

export type MemberHealthSummary = Readonly<
  MemberHealthSummaryGenerated & {
    sources: AssistantSource[]
  }
>

export function formatMemberHealthSummaryForCopy(summary: MemberHealthSummary) {
  return [
    "【给新医生看的 30 秒摘要】",
    summary.doctorBrief,
    "",
    "【慢性病史 / 就诊时间线】",
    ...summary.chronicTimeline.map((item) => `- ${item}`),
    "",
    "【常用药摘要】",
    summary.medicationSummary,
    "",
    "【过敏与风险提示】",
    summary.allergyRisks,
    "",
    "【最近一次就医要点】",
    summary.lastVisitHighlight,
    "",
    "—— 由 MediVault AI 基于家庭资料整理，不构成医疗建议 ——",
  ].join("\n")
}
