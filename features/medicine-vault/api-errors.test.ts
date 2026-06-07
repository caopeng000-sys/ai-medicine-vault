import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { z } from "zod"

import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  resolveApiError,
  toApiErrorResponse,
} from "./api-errors"

describe("api errors", () => {
  it("maps unauthorized errors to 401", () => {
    assert.deepEqual(resolveApiError(new UnauthorizedError(), "fallback"), {
      status: 401,
      message: "未登录，无法访问家庭健康资料。请先登录。",
    })
  })

  it("maps zod errors to 400", () => {
    const schema = z.object({ name: z.string().min(1, "请填写名称。") })
    const error = schema.safeParse({ name: "" }).error

    assert.deepEqual(resolveApiError(error, "fallback"), {
      status: 400,
      message: "请填写名称。",
    })
  })

  it("maps ownership errors to 404", () => {
    assert.deepEqual(resolveApiError(new Error("成员不存在或不属于当前用户。"), "fallback"), {
      status: 404,
      message: "成员不存在或不属于当前用户。",
    })
  })

  it("returns json responses without leaking unknown errors", async () => {
    const response = toApiErrorResponse(new ForbiddenError("无权访问该资源。"), "服务器处理失败。")

    assert.equal(response.status, 403)
    assert.deepEqual(await response.json(), { message: "无权访问该资源。" })
  })

  it("uses fallback message for unknown errors", async () => {
    const response = toApiErrorResponse(null, "服务器处理失败，请稍后再试。")

    assert.equal(response.status, 500)
    assert.deepEqual(await response.json(), { message: "服务器处理失败，请稍后再试。" })
  })

  it("maps not found errors to 404", () => {
    assert.deepEqual(resolveApiError(new NotFoundError("药品记录不存在。"), "fallback"), {
      status: 404,
      message: "药品记录不存在。",
    })
  })
})
