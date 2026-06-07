import assert from "node:assert/strict"
import { afterEach, describe, it } from "node:test"

import {
  buildMedicineImageObjectKey,
  isObjectStorageConfigured,
} from "@/lib/storage/object-storage"

const originalEnv = { ...process.env }

afterEach(() => {
  process.env = { ...originalEnv }
})

describe("object storage", () => {
  it("builds owner-scoped medicine image keys", () => {
    assert.equal(
      buildMedicineImageObjectKey("user-a", "med-1", "loratadine.jpg"),
      "medicines/user-a/med-1/loratadine.jpg",
    )
  })

  it("detects when object storage env vars are configured", () => {
    delete process.env.S3_BUCKET
    delete process.env.S3_ACCESS_KEY_ID
    delete process.env.S3_SECRET_ACCESS_KEY
    assert.equal(isObjectStorageConfigured(), false)

    process.env.S3_BUCKET = "medicine-vault"
    process.env.S3_ACCESS_KEY_ID = "key"
    process.env.S3_SECRET_ACCESS_KEY = "secret"
    assert.equal(isObjectStorageConfigured(), true)
  })
})
