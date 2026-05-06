import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { backfillLegacyMedicineImage } from "./medicine-image-backfill"

describe("medicine image backfill", () => {
  it("stores legacy bytes and clears the bytea fields after updating the medicine row", async () => {
    const calls: string[] = []

    const result = await backfillLegacyMedicineImage(
      {
        id: "medicine-1",
        userId: "user-1",
        imageBytes: new Uint8Array([1, 2, 3]),
        imageMimeType: "image/png",
        imageName: "legacy.png",
      },
      {
        storeMedicineImage: async (input) => {
          calls.push(`store:${input.imageName}`)
          return {
            imageKey: "image-key-1",
            imageMimeType: input.imageMimeType,
            imageName: input.imageName,
          }
        },
        updateMedicineImageKey: async (medicineId, imageKey) => {
          calls.push(`update:${medicineId}:${imageKey}`)
        },
        deleteMedicineImage: async (imageKey) => {
          calls.push(`delete:${imageKey}`)
        },
      }
    )

    assert.deepEqual(result, {
      imageKey: "image-key-1",
      imageMimeType: "image/png",
      imageName: "legacy.png",
    })
    assert.deepEqual(calls, ["store:legacy.png", "update:medicine-1:image-key-1"])
  })

  it("removes stored files when updating the medicine row fails", async () => {
    const calls: string[] = []

    await assert.rejects(
      () =>
        backfillLegacyMedicineImage(
          {
            id: "medicine-1",
            userId: "user-1",
            imageBytes: new Uint8Array([1, 2, 3]),
            imageMimeType: "image/png",
            imageName: "legacy.png",
          },
          {
            storeMedicineImage: async (input) => {
              calls.push(`store:${input.imageName}`)
              return {
                imageKey: "image-key-1",
                imageMimeType: input.imageMimeType,
                imageName: input.imageName,
              }
            },
            updateMedicineImageKey: async () => {
              throw new Error("更新失败。")
            },
            deleteMedicineImage: async (imageKey) => {
              calls.push(`delete:${imageKey}`)
            },
          }
        ),
      /更新失败/
    )

    assert.deepEqual(calls, ["store:legacy.png", "delete:image-key-1"])
  })
})
