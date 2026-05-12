import { NextResponse } from "next/server"

import { requireCurrentUser } from "@/features/medicine-vault/auth-context"
import { errorResponse, validationError } from "@/features/medicine-vault/api-errors"
import {
  deleteKnowledgeDocument,
  listKnowledgeDocuments,
  type KnowledgeDocumentWithChunks,
} from "@/features/medicine-vault/repository"

type KnowledgeDeleteDependencies = Readonly<{
  getContext: typeof requireCurrentUser
  listKnowledgeDocuments: typeof listKnowledgeDocuments
  deleteKnowledgeDocument: typeof deleteKnowledgeDocument
}>

function isKnowledgeOwnershipError(error: unknown) {
  return error instanceof Error && error.message.includes("知识文档不存在或不属于当前用户")
}

export function createKnowledgeDeleteHandler(dependencies: Partial<KnowledgeDeleteDependencies> = {}) {
  const getContext = dependencies.getContext ?? requireCurrentUser
  const readKnowledgeDocuments = dependencies.listKnowledgeDocuments ?? listKnowledgeDocuments
  const removeKnowledgeDocument = dependencies.deleteKnowledgeDocument ?? deleteKnowledgeDocument

  return {
    async DELETE(_request: Request, context: { params: Promise<{ documentId: string }> }) {
      try {
        const ctx = await getContext()
        const { documentId } = await context.params
        const existingDocument = (await readKnowledgeDocuments(ctx)).find(
          (item: KnowledgeDocumentWithChunks) => item.id === documentId,
        )

        if (!existingDocument) {
          return NextResponse.json({ message: "知识文档不存在。" }, { status: 404 })
        }

        const document = await removeKnowledgeDocument(ctx, documentId)

        return NextResponse.json({
          message: `已删除知识文档“${document.title}”。`,
          data: document,
        })
      } catch (error) {
        if (isKnowledgeOwnershipError(error)) {
          return validationError(error instanceof Error ? error.message : "知识文档不存在或不属于当前用户。")
        }

        return errorResponse(error, "删除知识文档失败。")
      }
    },
  }
}

export const { DELETE } = createKnowledgeDeleteHandler()
