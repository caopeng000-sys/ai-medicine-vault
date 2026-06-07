import { NextResponse } from "next/server"
import { ZodError } from "zod"

export class UnauthorizedError extends Error {
  readonly status = 401

  constructor(message = "未登录，无法访问家庭健康资料。请先登录。") {
    super(message)
    this.name = "UnauthorizedError"
  }
}

export class NotFoundError extends Error {
  readonly status = 404

  constructor(message = "请求的资源不存在。") {
    super(message)
    this.name = "NotFoundError"
  }
}

export class ForbiddenError extends Error {
  readonly status = 403

  constructor(message = "无权访问该资源。") {
    super(message)
    this.name = "ForbiddenError"
  }
}

export type ApiErrorPayload = Readonly<{
  status: number
  message: string
}>

function formatZodError(error: ZodError) {
  return error.issues[0]?.message ?? "请求参数无效。"
}

function inferStatusFromMessage(message: string) {
  if (/不存在|未找到|不属于当前用户/.test(message)) {
    return 404
  }

  return 400
}

export function resolveApiError(error: unknown, fallbackMessage: string): ApiErrorPayload {
  if (error instanceof UnauthorizedError) {
    return { status: error.status, message: error.message }
  }

  if (error instanceof NotFoundError) {
    return { status: error.status, message: error.message }
  }

  if (error instanceof ForbiddenError) {
    return { status: error.status, message: error.message }
  }

  if (error instanceof ZodError) {
    return { status: 400, message: formatZodError(error) }
  }

  if (error instanceof Error) {
    return {
      status: inferStatusFromMessage(error.message),
      message: error.message,
    }
  }

  return { status: 500, message: fallbackMessage }
}

export function toApiErrorResponse(error: unknown, fallbackMessage: string) {
  const payload = resolveApiError(error, fallbackMessage)

  return NextResponse.json({ message: payload.message }, { status: payload.status })
}
