import assert from "node:assert/strict"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, it } from "node:test"

import { createMedicalRecordAttachmentStorage } from "./medical-record-attachment-storage"

let tempDir = ""

beforeEach(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "medical-record-attachments-"))
})

afterEach(async () => {
  if (tempDir) {
    await fs.rm(tempDir, { force: true, recursive: true })
  }
})

describe("createMedicalRecordAttachmentStorage", () => {
  it("stores, reads and deletes a record attachment", async () => {
    const storage = createMedicalRecordAttachmentStorage(tempDir)
    const stored = await storage.storeAttachment({
      userId: "user-1",
      recordId: "record-1",
      fileBytes: new Uint8Array([1, 2, 3]),
      fileName: "检查报告.png",
      mimeType: "image/png",
    })

    assert.match(stored.fileKey, /users\/user-1\/medical-records\/record-1\/attachments\//)

    const read = await storage.readAttachment(stored.fileKey)

    assert.deepEqual([...read.fileBytes], [1, 2, 3])
    assert.equal(read.fileName, "检查报告.png")
    assert.equal(read.mimeType, "image/png")

    await storage.deleteAttachment(stored.fileKey)
    await assert.rejects(() => storage.readAttachment(stored.fileKey), /未找到病历附件/)
  })
})
