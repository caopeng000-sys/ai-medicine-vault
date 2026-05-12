import assert from "node:assert/strict"
import { afterEach, describe, it } from "node:test"

import { DEFAULT_DEVELOPMENT_USER, type RepositoryContext } from "./auth-context"
import {
  createKnowledgeDocument,
  listAllergyRecords,
  listKnowledgeDocuments,
  listMedicalRecords,
  listMembers,
  listMedicines,
  listMedicinesPaginated,
  listVisitPreparations,
  searchKnowledgeDocuments,
  medicineHasStoredImage,
  deleteKnowledgeDocument,
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

describe("knowledge documents repository", () => {
  const defaultCtx: RepositoryContext = { userId: DEFAULT_DEVELOPMENT_USER.id }
  const otherCtx: RepositoryContext = { userId: "user-other" }

  it("creates, lists, searches, and deletes knowledge documents in mock mode", async () => {
    delete process.env.DATABASE_URL

    const created = await createKnowledgeDocument(defaultCtx, {
      title: "青霉素过敏处理",
      category: "过敏史",
      source: "家庭记录",
      content: "青霉素疑似过敏时，先停止使用并及时告知医生。需要记录皮疹、瘙痒和就诊时间。",
    })

    assert.equal(created.title, "青霉素过敏处理")
    assert.ok(created.chunks.length >= 1)

    const listed = await listKnowledgeDocuments(defaultCtx)

    assert.ok(listed.some((item) => item.id === created.id))
    assert.ok(listed.find((item) => item.id === created.id)?.chunks.length === created.chunks.length)

    const searchResults = await searchKnowledgeDocuments(defaultCtx, "青霉素 皮疹", 5)

    assert.ok(searchResults.length >= 1)
    assert.equal(searchResults[0]?.document.id, created.id)
    assert.ok(searchResults[0]?.relevance > 0)

    const deleted = await deleteKnowledgeDocument(defaultCtx, created.id)

    assert.equal(deleted.id, created.id)
    assert.equal((await listKnowledgeDocuments(defaultCtx)).some((item) => item.id === created.id), false)
  })

  it("keeps knowledge documents isolated by user", async () => {
    delete process.env.DATABASE_URL

    const results = await listKnowledgeDocuments(otherCtx)

    assert.equal(results.length, 0)
    assert.equal((await searchKnowledgeDocuments(otherCtx, "青霉素", 5)).length, 0)
  })
})
