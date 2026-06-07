import type { RepositoryContext } from "./auth-context"
import type {
  AllergyRecord,
  MedicalRecord,
  MedicalRecordAttachment,
  Member,
  Medicine,
  VisitPreparation,
} from "./data"
import {
  listAllergyRecords,
  listMedicalRecordAttachments,
  listMedicalRecords,
  listMedicines,
  listMembers,
  listVisitPreparations,
} from "./repository"

export type VaultExportPayload = Readonly<{
  exportedAt: string
  version: "1.0"
  members: Member[]
  medicalRecords: MedicalRecord[]
  medicalRecordAttachments: MedicalRecordAttachment[]
  medicines: Medicine[]
  allergyRecords: AllergyRecord[]
  visitPreparations: VisitPreparation[]
}>

type ExportDependencies = Readonly<{
  listMembers: typeof listMembers
  listMedicalRecords: typeof listMedicalRecords
  listMedicalRecordAttachments: typeof listMedicalRecordAttachments
  listMedicines: typeof listMedicines
  listAllergyRecords: typeof listAllergyRecords
  listVisitPreparations: typeof listVisitPreparations
}>

const defaultDependencies: ExportDependencies = {
  listMembers,
  listMedicalRecords,
  listMedicalRecordAttachments,
  listMedicines,
  listAllergyRecords,
  listVisitPreparations,
}

export async function buildVaultExport(
  ctx: RepositoryContext,
  dependencies: Partial<ExportDependencies> = {},
): Promise<VaultExportPayload> {
  const runtime = { ...defaultDependencies, ...dependencies }

  const [members, medicalRecords, medicalRecordAttachments, medicines, allergyRecords, visitPreparations] =
    await Promise.all([
      runtime.listMembers(ctx),
      runtime.listMedicalRecords(ctx),
      runtime.listMedicalRecordAttachments(ctx),
      runtime.listMedicines(ctx),
      runtime.listAllergyRecords(ctx),
      runtime.listVisitPreparations(ctx),
    ])

  return {
    exportedAt: new Date().toISOString(),
    version: "1.0",
    members,
    medicalRecords,
    medicalRecordAttachments,
    medicines,
    allergyRecords,
    visitPreparations,
  }
}
