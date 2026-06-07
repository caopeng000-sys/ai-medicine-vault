import { NextResponse } from "next/server"
import type { RepositoryContext } from "@/features/medicine-vault/auth-context"
import { requireCurrentUser } from "@/features/medicine-vault/auth-context"
import { saveAssistantConversation } from "@/features/medicine-vault/assistant-conversation"
import { resolveAssistantQuery, type AssistantQueryResponse } from "@/features/medicine-vault/assistant-service"
import { withAiCallLogging } from "@/features/medicine-vault/ai-call-logger"
import { resolveApiError } from "@/features/medicine-vault/api-errors"
import {
  assistantQueryRateLimiter,
  rateLimitResponse,
  type RateLimitResult,
} from "@/features/medicine-vault/rate-limiter"
import { assistantQuerySchema } from "@/features/medicine-vault/schemas"

type ResolveAssistantQuery = (
  ctx: RepositoryContext,
  question: string,
  options?: { memberId?: string },
) => Promise<AssistantQueryResponse>
type RateLimitChecker = (userId: string) => RateLimitResult

function assistantErrorResponse(error: unknown, fallbackMessage: string) {
  const payload = resolveApiError(error, fallbackMessage)

  return NextResponse.json(
    {
      intent: "unsupported",
      answer: "",
      message: payload.message,
      sources: [],
    } satisfies AssistantQueryResponse,
    { status: payload.status },
  )
}

export function createAssistantQueryHandler(
  resolveQuery: ResolveAssistantQuery = (ctx, q, o) => resolveAssistantQuery(ctx, q, {}, o),
  getContext = requireCurrentUser,
  saveConversation = saveAssistantConversation,
  checkRateLimit: RateLimitChecker = (userId) => assistantQueryRateLimiter.checkRateLimit(userId),
) {
  return async (request: Request) => {
    try {
      const ctx = await getContext()
      const rateLimit = checkRateLimit(ctx.userId)

      if (!rateLimit.allowed) {
        return rateLimitResponse(rateLimit.retryAfterSeconds)
      }

      const body = assistantQuerySchema.parse(await request.json())
      const result = await withAiCallLogging(
        {
          userId: ctx.userId,
          route: "/api/assistant/query",
        },
        async () => resolveQuery(ctx, body.question, { memberId: body.memberId }),
      )

      try {
        await saveConversation(ctx, body.question, result)
      } catch {}

      return NextResponse.json({
        ...result,
        intent: result.intent,
      })
    } catch (error) {
      return assistantErrorResponse(error, "助手查询失败。")
    }
  }
}

export const POST = createAssistantQueryHandler()
