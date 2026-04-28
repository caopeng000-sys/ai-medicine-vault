import { NextResponse } from "next/server"

import type { RepositoryContext } from "@/features/medicine-vault/auth-context"
import { requireCurrentUser } from "@/features/medicine-vault/auth-context"
import { errorResponse } from "@/features/medicine-vault/api-errors"
import {
  listAllergyRecords,
  listMedicalRecords,
  listMedicines,
  listMembers,
} from "@/features/medicine-vault/repository"
import type { AllergyRecord, MedicalRecord, Member, Medicine } from "@/features/medicine-vault/data"

type ExportDependencies = Readonly<{
  listMembers: (ctx: RepositoryContext) => Promise<Member[]>
  listMedicalRecords: (ctx: RepositoryContext) => Promise<MedicalRecord[]>
  listMedicines: (ctx: RepositoryContext) => Promise<Medicine[]>
  listAllergyRecords: (ctx: RepositoryContext) => Promise<AllergyRecord[]>
}>

const defaultDependencies: ExportDependencies = {
  listMembers,
  listMedicalRecords,
  listMedicines,
  listAllergyRecords,
}

export function createExportHandler(
  dependencies: Partial<ExportDependencies> = {},
  getContext = requireCurrentUser,
) {
  const runtime = {
    ...defaultDependencies,
    ...dependencies,
  }

  return async function GET() {
    try {
      const ctx = await getContext()
      const [members, medicalRecords, medicines, allergyRecords] = await Promise.all([
        runtime.listMembers(ctx),
        runtime.listMedicalRecords(ctx),
        runtime.listMedicines(ctx),
        runtime.listAllergyRecords(ctx),
      ])
      const exportedAt = new Date().toISOString()

      return NextResponse.json(
        {
          exportedAt,
          userId: ctx.userId,
          data: {
            members,
            medicalRecords,
            medicines,
            allergyRecords,
          },
        },
        {
          headers: {
            "Content-Disposition": `attachment; filename="medicine-vault-export-${exportedAt.slice(0, 10)}.json"`,
            "Cache-Control": "no-store",
          },
        },
      )
    } catch (error) {
      return errorResponse(error, "导出家庭健康资料失败。")
    }
  }
}

export const GET = createExportHandler()
