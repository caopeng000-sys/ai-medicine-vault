import { NextResponse } from "next/server"
import { ZodError } from "zod"

export type ApiErrorBody = Readonly<{
  message: string
}>

const UNAUTHORIZED_MARKERS = ["登录", "拒绝访问", "unauthorized", "authentication"]

export function isUnauthorizedError(error: unknown) {
  if (!(error instanceof Error)) return false

  const message = error.message.toLowerCase()
  return UNAUTHORIZED_MARKERS.some((marker) => message.includes(marker.toLowerCase()))
}

export function validationError(message: string, init?: ResponseInit) {
  return NextResponse.json<ApiErrorBody>({ message }, { status: 400, ...init })
}

export function unauthorizedError(message = "请先登录后再访问家庭健康资料。") {
  return NextResponse.json<ApiErrorBody>({ message }, { status: 401 })
}

export function rateLimitError(retryAfterSeconds: number) {
  return NextResponse.json<ApiErrorBody>(
    { message: `请求过于频繁，请 ${retryAfterSeconds} 秒后再试。` },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
      },
    },
  )
}

export function upstreamAiError(message = "AI 服务暂时不可用，请稍后再试。") {
  return NextResponse.json<ApiErrorBody>({ message }, { status: 502 })
}

export function internalError(message = "服务暂时不可用，请稍后再试。") {
  return NextResponse.json<ApiErrorBody>({ message }, { status: 500 })
}

export function errorResponse(error: unknown, fallbackMessage: string) {
  if (isUnauthorizedError(error)) {
    return unauthorizedError()
  }

  if (error instanceof ZodError) {
    return validationError(error.issues[0]?.message ?? fallbackMessage)
  }

  return internalError(fallbackMessage)
}
