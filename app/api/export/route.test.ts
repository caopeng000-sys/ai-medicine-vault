import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { createExportHandler } from "./route"

describe("export route", () => {
  it("exports the current user's health vault data as JSON", async () => {
    const handler = createExportHandler(
      {
        listMembers: async () => [
          {
            id: "member-1",
            userId: "user-current",
            name: "曹鹏",
            relationship: "本人",
            birthYear: 1990,
            gender: "男",
            allergySummary: "青霉素过敏",
            note: "",
          },
        ],
        listMedicalRecords: async () => [],
        listMedicines: async () => [],
        listAllergyRecords: async () => [],
      },
      async () => ({ userId: "user-current" }),
    )

    const response = await handler(new Request("http://localhost/api/export"))
    const payload = (await response.json()) as {
      exportedAt: string
      userId: string
      data: { members: Array<{ userId: string; name: string }> }
    }

    assert.equal(response.status, 200)
    assert.equal(payload.userId, "user-current")
    assert.equal(payload.data.members[0]?.userId, "user-current")
    assert.match(response.headers.get("Content-Disposition") ?? "", /medicine-vault-export/)
    assert.match(payload.exportedAt, /^\d{4}-\d{2}-\d{2}T/)
  })
})
