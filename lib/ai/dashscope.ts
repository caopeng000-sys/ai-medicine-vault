const DASHSCOPE_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1"

type DashscopeMessage = {
  role: "system" | "user" | "assistant"
  content:
    | string
    | Array<
        | {
            type: "text"
            text: string
          }
        | {
            type: "image_url"
            image_url: {
              url: string
            }
          }
      >
}

type DashscopeResponse = {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>
    }
  }>
  error?: {
    message?: string
  }
}

function getDashscopeApiKey() {
  const apiKey = process.env.DASHSCOPE_API_KEY?.trim()

  if (!apiKey) {
    throw new Error("当前还没有配置 DASHSCOPE_API_KEY，暂时无法使用图片识别。")
  }

  return apiKey
}

export async function createDashscopeChatCompletion({
  model,
  messages,
}: Readonly<{
  model: string
  messages: DashscopeMessage[]
}>) {
  const apiKey = getDashscopeApiKey()
  const response = await fetch(`${DASHSCOPE_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.1,
    }),
  })

  const result = (await response.json()) as DashscopeResponse

  if (!response.ok) {
    throw new Error(result.error?.message ?? "阿里百炼调用失败。")
  }

  const content = result.choices?.[0]?.message?.content

  if (typeof content === "string") {
    return content
  }

  const text = content
    ?.filter((item) => item.type === "text" && item.text)
    .map((item) => item.text)
    .join("\n")

  if (!text) {
    throw new Error("阿里百炼没有返回可解析的文本结果。")
  }

  return text
}
