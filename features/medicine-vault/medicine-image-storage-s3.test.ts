import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3"

import { createMedicineImageStorage } from "./medicine-image-storage"

describe("s3 medicine image storage", () => {
  it("stores, reads, and deletes images with a bucket-backed client", async () => {
    const commands: unknown[] = []
    const payload = new Uint8Array([1, 2, 3, 4])

    const storage = createMedicineImageStorage({
      provider: "s3",
      bucket: "medicine-images",
      region: "ap-southeast-1",
      endpoint: "https://example.com",
      accessKeyId: "test-key",
      accessKeySecret: "test-secret",
      forcePathStyle: true,
      client: {
        send: async (command: unknown) => {
          commands.push(command)

          if (command instanceof PutObjectCommand) {
            return {}
          }

          if (command instanceof GetObjectCommand) {
            return {
              Body: {
                transformToByteArray: async () => payload,
              },
              ContentType: "image/png",
              Metadata: {
                "image-name": "阿莫西林.png",
                "medicine-id": "medicine-1",
                "user-id": "user-1",
              },
            }
          }

          if (command instanceof DeleteObjectCommand) {
            return {}
          }

          throw new Error("未处理的对象存储命令。")
        },
      },
    })

    const stored = await storage.storeMedicineImage({
      userId: "user-1",
      medicineId: "medicine-1",
      imageBytes: payload,
      imageMimeType: "image/png",
      imageName: "阿莫西林.png",
    })

    assert.equal(stored.imageMimeType, "image/png")
    assert.equal(stored.imageName, "阿莫西林.png")
    assert.equal(stored.imageKey.includes("medicine-1"), true)
    assert.ok(commands[0] instanceof PutObjectCommand)

    const loaded = await storage.readMedicineImage(stored.imageKey)

    assert.equal(loaded.imageName, "阿莫西林.png")
    assert.equal(loaded.imageMimeType, "image/png")
    assert.deepEqual(Array.from(loaded.imageBytes), Array.from(payload))
    assert.ok(commands[1] instanceof GetObjectCommand)

    await storage.deleteMedicineImage(stored.imageKey)
    assert.ok(commands[2] instanceof DeleteObjectCommand)
  })
})
