import { NextResponse } from "next/server"

import type { RepositoryContext } from "@/features/medicine-vault/auth-context"
import { requireCurrentUser } from "@/features/medicine-vault/auth-context"
import { errorResponse, validationError } from "@/features/medicine-vault/api-errors"
import type { AllergyRecord, MedicalRecord, Member, Medicine } from "@/features/medicine-vault/data"
import { getMemberById } from "@/features/medicine-vault/repository"
import {
  listAllergyRecords,
  listMedicalRecords,
  listMedicines,
  listMembers,
} from "@/features/medicine-vault/repository"

type ExportFormat = "json" | "csv"

type ExportDependencies = Readonly<{
  listMembers: (ctx: RepositoryContext) => Promise<Member[]>
  listMedicalRecords: (ctx: RepositoryContext, memberId?: string) => Promise<MedicalRecord[]>
  listMedicines: (ctx: RepositoryContext, memberId?: string) => Promise<Medicine[]>
  listAllergyRecords: (ctx: RepositoryContext, memberId?: string) => Promise<AllergyRecord[]>
  getMemberById: (ctx: RepositoryContext, memberId: string) => Promise<Member | undefined>
}>

const defaultDependencies: ExportDependencies = {
  listMembers,
  listMedicalRecords,
  listMedicines,
  listAllergyRecords,
  getMemberById,
}

function parseFormat(request: Request): ExportFormat | null {
  const format = new URL(request.url).searchParams.get("format")?.trim().toLowerCase()

  if (!format || format === "json") {
    return "json"
  }

  if (format === "csv") {
    return "csv"
  }

  return null
}

function parseMemberId(request: Request) {
  const memberId = new URL(request.url).searchParams.get("memberId")?.trim()
  return memberId ? memberId : undefined
}

function createExportFilename(userId: string, exportedAt: string, format: ExportFormat) {
  return `medicine-vault-${userId}-${exportedAt.slice(0, 10)}.${format}`
}

function escapeCsvValue(value: unknown) {
  const normalized =
    value === null || value === undefined ? "" : typeof value === "string" ? value : String(value)

  if (!/[",\n]/.test(normalized)) {
    return normalized
  }

  return `"${normalized.replaceAll('"', '""')}"`
}

function toCsvRow(values: unknown[]) {
  return values.map(escapeCsvValue).join(",")
}

function buildCsvExport(input: {
  exportedAt: string
  userId: string
  members: Member[]
  medicalRecords: MedicalRecord[]
  medicines: Medicine[]
  allergyRecords: AllergyRecord[]
}) {
  const rows = [
    toCsvRow(["section", "id", "userId", "name", "relationship", "memberId", "date", "category", "value1", "value2", "value3", "note"]),
    ...input.members.map((member) =>
      toCsvRow([
        "members",
        member.id,
        member.userId,
        member.name,
        member.relationship,
        "",
        member.birthYear,
        member.gender,
        member.allergySummary,
        "",
        "",
        member.note,
      ]),
    ),
    ...input.medicalRecords.map((record) =>
      toCsvRow([
        "medicalRecords",
        record.id,
        record.userId,
        "",
        "",
        record.memberId,
        record.visitedAt,
        record.department,
        record.hospitalName,
        record.diagnosis,
        record.symptoms,
        record.note,
      ]),
    ),
    ...input.medicines.map((medicine) =>
      toCsvRow([
        "medicines",
        medicine.id,
        medicine.userId,
        medicine.name,
        "",
        medicine.memberId,
        medicine.expiresAt,
        medicine.category,
        medicine.dosage,
        medicine.specification,
        medicine.quantity,
        medicine.usageNote,
      ]),
    ),
    ...input.allergyRecords.map((record) =>
      toCsvRow([
        "allergyRecords",
        record.id,
        record.userId,
        record.allergen,
        "",
        record.memberId,
        record.discoveredAt,
        record.severity,
        record.reaction,
        "",
        "",
        record.note,
      ]),
    ),
    toCsvRow(["exportedAt", input.exportedAt, "", "", "", "", "", "", "", "", "", ""]),
  ]

  return `${rows.join("\n")}\n`
}

export function createExportHandler(
  dependencies: Partial<ExportDependencies> = {},
  getContext = requireCurrentUser,
  now = () => new Date(),
) {
  const runtime = {
    ...defaultDependencies,
    ...dependencies,
  }

  return async function GET(request: Request) {
    try {
      const format = parseFormat(request)
      const memberId = parseMemberId(request)

      if (!format) {
        return validationError("暂不支持该导出格式，请使用 json 或 csv。")
      }

      const ctx = await getContext()
      const selectedMember = memberId ? await runtime.getMemberById(ctx, memberId) : undefined

      if (memberId && !selectedMember) {
        return NextResponse.json({ message: "成员不存在。" }, { status: 404 })
      }

      const [allMembers, medicalRecords, medicines, allergyRecords] = await Promise.all([
        runtime.listMembers(ctx),
        runtime.listMedicalRecords(ctx, memberId),
        runtime.listMedicines(ctx, memberId),
        runtime.listAllergyRecords(ctx, memberId),
      ])
      const members = memberId ? allMembers.filter((member) => member.id === memberId) : allMembers
      const exportedAt = now().toISOString()
      const filename = createExportFilename(ctx.userId, exportedAt, format)

      if (format === "csv") {
        const csv = buildCsvExport({
          exportedAt,
          userId: ctx.userId,
          members,
          medicalRecords,
          medicines,
          allergyRecords,
        })

        return new Response(csv, {
          status: 200,
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="${filename}"`,
            "Cache-Control": "no-store",
          },
        })
      }

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
            "Content-Disposition": `attachment; filename="${filename}"`,
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
