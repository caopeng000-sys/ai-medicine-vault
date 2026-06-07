import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  applyAiSafetyGuardrail,
  HIGH_RISK_QUESTION_TEMPLATE,
  isHighRiskQuestion,
} from "./ai-safety-guardrail"

describe("applyAiSafetyGuardrail", () => {
  it("returns unchanged text when no sensitive phrases are present", () => {
    const result = applyAiSafetyGuardrail("家里现有的相关药品包括：双黄连口服液。")

    assert.equal(result.text, "家里现有的相关药品包括：双黄连口服液。")
    assert.deepEqual(result.flagged, [])
  })

  it("flags and replaces diagnosis phrasing", () => {
    const result = applyAiSafetyGuardrail("根据症状，初步诊断为上呼吸道感染。")

    assert.ok(result.flagged.includes("诊断"))
    assert.ok(result.text.includes("请咨询医生或药师确认后再做决定。"))
    assert.equal(result.text.includes("初步诊断为"), false)
  })

  it("flags and replaces stop-medication advice", () => {
    const result = applyAiSafetyGuardrail("建议停药三天后再观察。")

    assert.ok(result.flagged.includes("停药"))
    assert.ok(result.text.includes("请咨询医生或药师确认后再做决定。"))
  })

  it("flags and replaces dosage adjustment advice", () => {
    const result = applyAiSafetyGuardrail("如果症状加重，可以加量服用。")

    assert.ok(result.flagged.includes("加量"))
    assert.ok(result.text.includes("请咨询医生或药师确认后再做决定。"))
  })

  it("flags and replaces possible-disease phrasing", () => {
    const result = applyAiSafetyGuardrail("根据记录，可能是过敏性鼻炎。")

    assert.ok(result.flagged.includes("可能是X病"))
    assert.ok(result.text.includes("请咨询医生或药师确认后再做决定。"))
  })

  it("flags and replaces medication recommendation phrasing", () => {
    const result = applyAiSafetyGuardrail("建议服用布洛芬缓解发热。")

    assert.ok(result.flagged.includes("用药建议"))
    assert.ok(result.text.includes("请咨询医生或药师确认后再做决定。"))
  })

  it("handles empty text", () => {
    const result = applyAiSafetyGuardrail("   ")

    assert.equal(result.text, "")
    assert.deepEqual(result.flagged, [])
  })
})

describe("isHighRiskQuestion", () => {
  it("detects medication recommendation questions", () => {
    assert.equal(isHighRiskQuestion("咳嗽应该吃什么药？"), true)
  })

  it("detects disease judgment questions", () => {
    assert.equal(isHighRiskQuestion("我这是不是肺炎？"), true)
  })

  it("detects dosage adjustment questions", () => {
    assert.equal(isHighRiskQuestion("这个药可以停药吗？"), true)
  })

  it("returns false for supported assistant questions", () => {
    assert.equal(isHighRiskQuestion("家里有哪些抗过敏药？"), false)
    assert.equal(isHighRiskQuestion("我上次什么时候感冒？"), false)
  })

  it("exposes a fixed high-risk response template", () => {
    assert.ok(HIGH_RISK_QUESTION_TEMPLATE.includes("请咨询医生或药师确认"))
  })
})
