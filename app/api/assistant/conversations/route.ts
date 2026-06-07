import { NextResponse } from "next/server"

import { toApiErrorResponse } from "@/features/medicine-vault/api-errors"
import { requireCurrentUser } from "@/features/medicine-vault/auth-context"
import { DEFAULT_AI_CONVERSATION_LIMIT, listAiConversations } from "@/features/medicine-vault/repository"

export async function GET() {
  try {
    const ctx = await requireCurrentUser()
    const conversations = await listAiConversations(ctx, DEFAULT_AI_CONVERSATION_LIMIT)

    return NextResponse.json({ conversations })
  } catch (error) {
    return toApiErrorResponse(error, "读取对话历史失败。")
  }
}
