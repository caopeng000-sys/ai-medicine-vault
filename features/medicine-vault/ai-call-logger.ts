export type AiCallLogEntry = Readonly<{
  userId: string
  route: string
  intent?: string
  model?: string
  durationMs: number
  success: boolean
  error?: string
}>

export function logAiCall(entry: AiCallLogEntry) {
  console.info(
    JSON.stringify({
      type: "ai_call",
      at: new Date().toISOString(),
      ...entry,
    }),
  )
}

export async function withAiCallLogging<T>(
  entry: Omit<AiCallLogEntry, "durationMs" | "success" | "error">,
  run: () => Promise<T>,
): Promise<T> {
  const startedAt = Date.now()

  try {
    const result = await run()
    logAiCall({
      ...entry,
      durationMs: Date.now() - startedAt,
      success: true,
    })
    return result
  } catch (error) {
    logAiCall({
      ...entry,
      durationMs: Date.now() - startedAt,
      success: false,
      error: error instanceof Error ? error.message : "unknown_error",
    })
    throw error
  }
}
