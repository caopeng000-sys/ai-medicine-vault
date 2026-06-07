import { NextResponse } from "next/server"

import type { RepositoryContext } from "@/features/medicine-vault/auth-context"
import { requireCurrentUser } from "@/features/medicine-vault/auth-context"
import { saveAssistantConversation } from "@/features/medicine-vault/assistant-conversation"
import { resolveAssistantQuery, type AssistantQueryResponse } from "@/features/medicine-vault/assistant-service"

type AssistantQueryHandler = (request: Request) => Promise<Response>
type ResolveAssistantQuery = (ctx: RepositoryContext, question: string) => Promise<AssistantQueryResponse>
type SaveAssistantConversation = (
  ctx: RepositoryContext,
  question: string,
  result: AssistantQueryResponse,
) => Promise<void>

type AssistantQueryRequestBody = Readonly<{
  question?: string
}>

export function createAssistantQueryHandler(
  resolveQuery: ResolveAssistantQuery = resolveAssistantQuery,
  getContext = requireCurrentUser,
  saveConversation: SaveAssistantConversation = saveAssistantConversation,
): AssistantQueryHandler {
  return async (request) => {
    try {
      const ctx = await getContext()
      const body = (await request.json()) as AssistantQueryRequestBody
      const question = body.question?.trim()

      if (!question) {
        return NextResponse.json(
          {
            intent: "unsupported",
            answer: "",
            message: "请输入一个问题后再发送。",
            sources: [],
          } satisfies AssistantQueryResponse,
          { status: 400 },
        )
      }

      const result = await resolveQuery(ctx, question)

      try {
        await saveConversation(ctx, question, result)
      } catch {
        // 对话持久化失败不应阻断问答主流程。
      }

      return NextResponse.json(result)
    } catch (error) {
      const message = error instanceof Error ? error.message : "助手查询失败。"

      return NextResponse.json(
        {
          intent: "unsupported",
          answer: "",
          message,
          sources: [],
        } satisfies AssistantQueryResponse,
        { status: 500 },
      )
    }
  }
}

export const POST = createAssistantQueryHandler()
