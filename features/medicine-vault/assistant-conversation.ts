import type { RepositoryContext } from "./auth-context"
import type { AssistantQueryResponse } from "./assistant-service"
import { createAiConversation } from "./repository"

export async function saveAssistantConversation(
  ctx: RepositoryContext,
  question: string,
  result: AssistantQueryResponse,
) {
  await createAiConversation(ctx, {
    question,
    answer: result.answer,
    intent: result.intent,
    message: result.message,
    sources: result.sources,
  })
}
