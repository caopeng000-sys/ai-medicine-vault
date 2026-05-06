import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { allergyRecords, medicalRecords, medicines, members, visitPreparations } from "@/features/medicine-vault/data"

import { buildVisitPreparationPageModel } from "./page"

describe("visit prep page model", () => {
  it("keeps the default preparation member when no memberId is provided", () => {
    const model = buildVisitPreparationPageModel({
      members,
      visitPreparations,
      medicalRecords,
      medicines,
      allergies: allergyRecords,
    })

    assert.equal(model.activeMember?.id, "member-cp")
    assert.equal(model.activePreparation?.memberId, "member-cp")
    assert.equal(model.preparationCards.length, 1)
  })

  it("focuses the requested member when memberId is provided", () => {
    const model = buildVisitPreparationPageModel({
      memberId: "member-mom",
      members,
      visitPreparations,
      medicalRecords,
      medicines,
      allergies: allergyRecords,
    })

    assert.equal(model.activeMember?.id, "member-mom")
    assert.equal(model.activePreparation, undefined)
    assert.equal(model.records.length, 1)
    assert.ok(model.memberMedicines.length > 0)
    assert.equal(model.preparationCards.length, 0)
  })
})
