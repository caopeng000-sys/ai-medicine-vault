import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  encodeMedicalRecordAttachmentAiMetadata,
  parseMedicalRecordAttachmentAiMetadata,
} from "./medical-record-attachment-ai-metadata"

describe("medical record attachment AI metadata", () => {
  it("round-trips structured extraction data through form-safe fields", () => {
    const encoded = encodeMedicalRecordAttachmentAiMetadata({
      documentType: "检查报告",
      summary: "识别到一份血常规检查报告。",
      keyFindings: ["白细胞轻度升高", "医生建议复查"],
      suggestedFollowUp: "按报告提示复查。",
      originalText: "血常规 白细胞",
      warnings: ["部分指标不清晰"],
    })

    const parsed = parseMedicalRecordAttachmentAiMetadata(encoded)

    assert.equal(parsed.documentType, "检查报告")
    assert.equal(parsed.summary, "识别到一份血常规检查报告。")
    assert.deepEqual(parsed.keyFindings, ["白细胞轻度升高", "医生建议复查"])
    assert.equal(parsed.suggestedFollowUp, "按报告提示复查。")
    assert.equal(parsed.originalText, "血常规 白细胞")
    assert.deepEqual(parsed.warnings, ["部分指标不清晰"])
  })

  it("drops empty AI metadata instead of saving blank extraction fields", () => {
    const parsed = parseMedicalRecordAttachmentAiMetadata({
      aiDocumentType: "",
      aiSummary: "   ",
      aiKeyFindings: "[]",
      aiSuggestedFollowUp: "",
      aiOriginalText: "",
      aiWarnings: "[]",
    })

    assert.equal(parsed, undefined)
  })
})
