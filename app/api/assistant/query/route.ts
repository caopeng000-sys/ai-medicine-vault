import { NextResponse } from "next/server"

import type { RepositoryContext } from "@/features/medicine-vault/auth-context"
import { requireCurrentUser } from "@/features/medicine-vault/auth-context"
import { errorResponse, isInvalidJsonError, rateLimitError } from "@/features/medicine-vault/api-errors"
import { resolveAssistantQuery, type AssistantQueryResponse } from "@/features/medicine-vault/assistant-service"
import { logAiCall, type AiCallLogInput } from "@/features/medicine-vault/repository"
import { assistantQueryRateLimiter, type MemoryRateLimiter } from "@/features/medicine-vault/rate-limit"

type AssistantQueryHandler = (request: Request) => Promise<Response>
type ResolveAssistantQuery = (ctx: RepositoryContext, question: string) => Promise<AssistantQueryResponse>
type LogAiCall = (ctx: RepositoryContext, input: AiCallLogInput) => Promise<void>

type AssistantQueryRequestBody = Readonly<{
  question?: string
}>

const MAX_QUESTION_LENGTH = 1200

export function createAssistantQueryHandler(
  resolveQuery: ResolveAssistantQuery = resolveAssistantQuery,
  getContext = requireCurrentUser,
  options: Partial<{
    rateLimiter: MemoryRateLimiter
    logAiCall: LogAiCall
  }> = {},
): AssistantQueryHandler {
  const rateLimiter = options.rateLimiter ?? assistantQueryRateLimiter
  const writeAiCallLog = options.logAiCall ?? logAiCall

  return async (request) => {
    let ctx: RepositoryContext | undefined
    let question = ""

    try {
      ctx = await getContext()
      const body = (await request.json()) as AssistantQueryRequestBody
      question = body.question?.trim() ?? ""

      if (!question) {
        return validationErrorResponse({
          intent: "unsupported",
          answer: "",
          message: "请输入一个问题后再发送。",
          sources: [],
        })
      }

      if (question.length > MAX_QUESTION_LENGTH) {
        return validationErrorResponse({
          intent: "unsupported",
          answer: "",
          message: `问题不能超过 ${MAX_QUESTION_LENGTH} 个字符。`,
          sources: [],
        })
      }

      const rateLimit = rateLimiter.check(ctx.userId, "assistant.query")

      if (!rateLimit.allowed) {
        await writeAiCallLog(ctx, {
          routeKey: "assistant.query",
          provider: "dashscope",
          model: "qwen-plus",
          status: "rate_limited",
          inputBytes: byteLength(question),
        })
        return rateLimitError(rateLimit.retryAfterSeconds)
      }

      const result = await resolveQuery(ctx, question)

      await writeAiCallLog(ctx, {
        routeKey: "assistant.query",
        provider: "dashscope",
        model: "qwen-plus",
        status: result.message ? "fallback" : "success",
        inputBytes: byteLength(question),
        outputBytes: byteLength(JSON.stringify(result)),
      })

      return NextResponse.json(result)
    } catch (error) {
      if (isInvalidJsonError(error)) {
        return validationErrorResponse({
          intent: "unsupported",
          answer: "",
          message: "请求参数格式不正确。",
          sources: [],
        })
      }

      if (!ctx) {
        return errorResponse(error, "助手查询失败。")
      }

      await writeAiCallLog(ctx, {
        routeKey: "assistant.query",
        provider: "dashscope",
        model: "qwen-plus",
        status: "error",
        inputBytes: byteLength(question),
        errorMessage: error instanceof Error ? error.message : "unknown",
      })

      return NextResponse.json(
        {
          intent: "unsupported",
          answer: "",
          message: "AI 服务暂时不可用，请稍后再试。",
          sources: [],
        } satisfies AssistantQueryResponse,
        { status: 502 },
      )
    }
  }
}

export const POST = createAssistantQueryHandler()

function byteLength(value: string) {
  return new TextEncoder().encode(value).length
}

function validationErrorResponse(payload: AssistantQueryResponse) {
  return NextResponse.json(payload, { status: 400 })
}
