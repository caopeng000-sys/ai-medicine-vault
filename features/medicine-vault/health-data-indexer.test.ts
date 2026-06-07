import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { allergyRecords, medicalRecordAttachments, medicalRecords, members, medicines } from "./data"
import { indexHealthData } from "./health-data-indexer"

describe("indexHealthData", () => {
  it("indexes attachment chunks", () => {
    const chunks = indexHealthData({ members, records: medicalRecords, medicines, allergies: allergyRecords, attachments: medicalRecordAttachments })
    assert.ok(chunks.some((c) => c.sourceType === "attachment"))
  })
})
