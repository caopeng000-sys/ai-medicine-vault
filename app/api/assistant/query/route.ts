import { NextResponse } from "next/server"
import type { RepositoryContext } from "@/features/medicine-vault/auth-context"
import { requireCurrentUser } from "@/features/medicine-vault/auth-context"
import { saveAssistantConversation } from "@/features/medicine-vault/assistant-conversation"
import { resolveAssistantQuery, type AssistantQueryResponse } from "@/features/medicine-vault/assistant-service"
import {
  assistantQueryRateLimiter,
  rateLimitResponse,
  type RateLimitResult,
} from "@/features/medicine-vault/rate-limiter"
type ResolveAssistantQuery = (ctx: RepositoryContext, question: string, options?: { memberId?: string }) => Promise<AssistantQueryResponse>
type AssistantQueryRequestBody = Readonly<{ question?: string; memberId?: string }>
type RateLimitChecker = (userId: string) => RateLimitResult
export function createAssistantQueryHandler(resolveQuery: ResolveAssistantQuery = (ctx, q, o) => resolveAssistantQuery(ctx, q, {}, o), getContext = requireCurrentUser, saveConversation = saveAssistantConversation, checkRateLimit: RateLimitChecker = (userId) => assistantQueryRateLimiter.checkRateLimit(userId)) {
  return async (request: Request) => {
    try {
      const ctx = await getContext()
      const rateLimit = checkRateLimit(ctx.userId)

      if (!rateLimit.allowed) {
        return rateLimitResponse(rateLimit.retryAfterSeconds)
      }

      const body = (await request.json()) as AssistantQueryRequestBody; const question = body.question?.trim()
      if (!question) return NextResponse.json({ intent: "unsupported", answer: "", message: "请输入一个问题后再发送。", sources: [] } satisfies AssistantQueryResponse, { status: 400 })
      const result = await resolveQuery(ctx, question, { memberId: body.memberId?.trim() || undefined })
      try { await saveConversation(ctx, question, result) } catch {}
      return NextResponse.json(result)
    } catch (error) {
      return NextResponse.json({ intent: "unsupported", answer: "", message: error instanceof Error ? error.message : "助手查询失败。", sources: [] } satisfies AssistantQueryResponse, { status: 500 })
    }
  }
}
export const POST = createAssistantQueryHandler()
