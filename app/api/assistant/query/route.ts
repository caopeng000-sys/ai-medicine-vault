import { NextResponse } from "next/server"

import { resolveAssistantQuery, type AssistantQueryResponse } from "@/features/medicine-vault/assistant-service"

type AssistantQueryHandler = (request: Request) => Promise<Response>

type AssistantQueryRequestBody = Readonly<{
  question?: string
}>

export function createAssistantQueryHandler(
  resolveQuery = resolveAssistantQuery,
): AssistantQueryHandler {
  return async (request) => {
    try {
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

      const result = await resolveQuery(question)

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
