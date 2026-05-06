import assert from "node:assert/strict"
import { afterEach, describe, it } from "node:test"

import { DEFAULT_DEVELOPMENT_USER, type RepositoryContext } from "./auth-context"
import {
  listAllergyRecords,
  listMedicalRecords,
  listMembers,
  listMedicines,
  listMedicinesPaginated,
  listVisitPreparations,
  medicineHasStoredImage,
} from "./repository"

const originalDatabaseUrl = process.env.DATABASE_URL

afterEach(() => {
  if (originalDatabaseUrl === undefined) {
    delete process.env.DATABASE_URL
  } else {
    process.env.DATABASE_URL = originalDatabaseUrl
  }
})

describe("listMedicinesPaginated", () => {
  const defaultCtx: RepositoryContext = { userId: DEFAULT_DEVELOPMENT_USER.id }
  const otherCtx: RepositoryContext = { userId: "user-other" }

  it("returns six items per page and total pages after filtering", async () => {
    process.env.DATABASE_URL = ""
    const result = await listMedicinesPaginated(defaultCtx, { page: 1, pageSize: 6 })

    assert.equal(result.page, 1)
    assert.equal(result.pageSize, 6)
    assert.equal(result.items.length, 6)
    assert.ok(result.total >= result.items.length)
    assert.ok(result.totalPages >= 1)
  })

  it("keeps member and keyword filters while paging", async () => {
    process.env.DATABASE_URL = ""
    const result = await listMedicinesPaginated(defaultCtx, {
      memberId: "member-cp",
      query: "布洛芬",
      page: 1,
      pageSize: 6,
    })

    assert.equal(result.pageSize, 6)
    assert.ok(result.items.every((item) => item.memberId === "member-cp"))
    assert.equal(result.totalPages >= 1, true)
  })

  it("filters medicines by category before paging", async () => {
    process.env.DATABASE_URL = ""
    const result = await listMedicinesPaginated(defaultCtx, {
      category: "止痛退烧",
      page: 1,
      pageSize: 6,
    })

    assert.ok(result.items.every((item) => item.category === "止痛退烧"))
    assert.equal(result.total >= result.items.length, true)
  })

  it("filters every mock-backed list by repository context user", async () => {
    process.env.DATABASE_URL = ""

    assert.equal((await listMembers(otherCtx)).length, 0)
    assert.equal((await listMedicalRecords(otherCtx)).length, 0)
    assert.equal((await listMedicines(otherCtx)).length, 0)
    assert.equal((await listMedicinesPaginated(otherCtx, { page: 1, pageSize: 6 })).total, 0)
    assert.equal((await listAllergyRecords(otherCtx)).length, 0)
    assert.equal((await listVisitPreparations(otherCtx)).length, 0)
  })

  it("treats legacy image bytes and stored image keys as image presence", () => {
    assert.equal(medicineHasStoredImage({ imageBytes: new Uint8Array([1]) }), true)
    assert.equal(medicineHasStoredImage({ imageKey: "image-key-1" }), true)
    assert.equal(medicineHasStoredImage({}), false)
  })
})
