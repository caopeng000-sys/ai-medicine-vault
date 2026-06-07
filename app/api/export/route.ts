import { requireCurrentUser } from "@/features/medicine-vault/auth-context"
import { toApiErrorResponse } from "@/features/medicine-vault/api-errors"
import { buildVaultExport } from "@/features/medicine-vault/export-service"

export async function GET() {
  try {
    const ctx = await requireCurrentUser()
    const payload = await buildVaultExport(ctx)
    const fileName = `medrecord-export-${payload.exportedAt.slice(0, 10)}.json`

    return new Response(JSON.stringify(payload, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    return toApiErrorResponse(error, "导出家庭健康资料失败。")
  }
}
