import { NextResponse } from "next/server"

import { requireCurrentUser } from "@/features/medicine-vault/auth-context"
import { errorResponse, validationError } from "@/features/medicine-vault/api-errors"
import { createKnowledgeDocument, listKnowledgeDocuments } from "@/features/medicine-vault/repository"
import { createKnowledgeDocumentSchema } from "@/features/medicine-vault/schemas"

function isBusinessValidationError(error: unknown) {
  return error instanceof Error && error.message.toLowerCase().includes("json")
}

export function createKnowledgeListHandler(
  readKnowledgeDocuments = listKnowledgeDocuments,
  getContext = requireCurrentUser,
) {
  return async function GET() {
    try {
      const ctx = await getContext()
      const documents = await readKnowledgeDocuments(ctx)

      return NextResponse.json({
        data: documents,
      })
    } catch (error) {
      return errorResponse(error, "获取知识文档失败。")
    }
  }
}

export function createKnowledgeHandler(
  writeKnowledgeDocument = createKnowledgeDocument,
  getContext = requireCurrentUser,
) {
  return async function POST(request: Request) {
    try {
      const ctx = await getContext()
      const input = createKnowledgeDocumentSchema.parse(await request.json())
      const document = await writeKnowledgeDocument(ctx, input)

      return NextResponse.json({
        message: "知识文档已写入数据库。",
        data: document,
      })
    } catch (error) {
      if (isBusinessValidationError(error)) {
        return validationError("请求参数格式不正确。")
      }

      return errorResponse(error, "创建知识文档失败。")
    }
  }
}

export const GET = createKnowledgeListHandler()
export const POST = createKnowledgeHandler()
