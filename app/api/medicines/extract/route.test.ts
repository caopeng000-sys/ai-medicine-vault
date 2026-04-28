import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { createMedicineExtractHandler } from "./route"

describe("medicine extract route", () => {
  it("rejects oversized images before calling the AI extractor", async () => {
    let called = false
    const handler = createMedicineExtractHandler(
      async () => {
        called = true
        return {
          name: "",
          category: "",
          dosage: "",
          specification: "",
          instructions: "",
          purpose: "",
          summary: "",
          warnings: [],
          originalText: "",
        }
      },
      async () => ({ userId: "user-current" }),
    )
    const formData = new FormData()
    formData.set("image", new File([new Uint8Array(8 * 1024 * 1024 + 1)], "large.png", { type: "image/png" }))

    const response = await handler(
      new Request("http://localhost/api/medicines/extract", {
        method: "POST",
        body: formData,
      }),
    )
    const payload = (await response.json()) as { message: string }

    assert.equal(response.status, 400)
    assert.equal(called, false)
    assert.match(payload.message, /8MB/)
  })

  it("returns a friendly AI failure without leaking provider internals", async () => {
    const handler = createMedicineExtractHandler(
      async () => {
        throw new Error("DASHSCOPE_API_KEY=secret stack trace")
      },
      async () => ({ userId: "user-current" }),
    )
    const formData = new FormData()
    formData.set("image", new File([new Uint8Array([1, 2, 3])], "label.png", { type: "image/png" }))

    const response = await handler(
      new Request("http://localhost/api/medicines/extract", {
        method: "POST",
        body: formData,
      }),
    )
    const payload = (await response.json()) as { message: string }

    assert.equal(response.status, 502)
    assert.match(payload.message, /暂时不可用/)
    assert.doesNotMatch(payload.message, /DASHSCOPE_API_KEY/)
  })
})
