import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { buildVaultExport } from "./export-service"

describe("export service", () => {
  it("returns only the current user scoped export payload", async () => {
    const payload = await buildVaultExport(
      { userId: "user-a" },
      {
        listMembers: async () => [{ id: "m1", userId: "user-a", name: "曹鹏" } as never],
        listMedicalRecords: async () => [],
        listMedicalRecordAttachments: async () => [],
        listMedicines: async () => [],
        listAllergyRecords: async () => [],
        listVisitPreparations: async () => [],
      },
    )

    assert.equal(payload.version, "1.0")
    assert.equal(payload.members.length, 1)
    assert.equal(payload.members[0]?.userId, "user-a")
    assert.match(payload.exportedAt, /^\d{4}-\d{2}-\d{2}T/)
  })
})
