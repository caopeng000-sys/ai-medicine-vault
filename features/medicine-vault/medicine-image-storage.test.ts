import assert from "node:assert/strict"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { afterEach, describe, it } from "node:test"

import {
  deleteMedicineImage,
  readMedicineImage,
  storeMedicineImage,
} from "./medicine-image-storage"

const originalStorageDir = process.env.MEDICINE_IMAGE_STORAGE_DIR

afterEach(() => {
  if (originalStorageDir === undefined) {
    delete process.env.MEDICINE_IMAGE_STORAGE_DIR
  } else {
    process.env.MEDICINE_IMAGE_STORAGE_DIR = originalStorageDir
  }
})

describe("medicine image storage", () => {
  it("stores image bytes with metadata and reads them back", async () => {
    const storageDir = await fs.mkdtemp(path.join(os.tmpdir(), "medicine-images-"))
    process.env.MEDICINE_IMAGE_STORAGE_DIR = storageDir

    const stored = await storeMedicineImage({
      userId: "user-1",
      medicineId: "medicine-1",
      imageName: "布洛芬.jpg",
      imageMimeType: "image/jpeg",
      imageBytes: new Uint8Array([1, 2, 3, 4]),
    })

    assert.equal(stored.imageName, "布洛芬.jpg")
    assert.equal(stored.imageMimeType, "image/jpeg")
    assert.equal(stored.imageKey.length > 0, true)

    const loaded = await readMedicineImage(stored.imageKey)

    assert.equal(loaded.imageName, "布洛芬.jpg")
    assert.equal(loaded.imageMimeType, "image/jpeg")
    assert.deepEqual(Array.from(loaded.imageBytes), [1, 2, 3, 4])
  })

  it("deletes stored image files by key", async () => {
    const storageDir = await fs.mkdtemp(path.join(os.tmpdir(), "medicine-images-"))
    process.env.MEDICINE_IMAGE_STORAGE_DIR = storageDir

    const stored = await storeMedicineImage({
      userId: "user-1",
      medicineId: "medicine-1",
      imageName: "布洛芬.jpg",
      imageMimeType: "image/jpeg",
      imageBytes: new Uint8Array([9, 8, 7]),
    })

    await deleteMedicineImage(stored.imageKey)

    await assert.rejects(() => readMedicineImage(stored.imageKey), /未找到/)
  })
})
