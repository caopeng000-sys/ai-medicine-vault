import { createMedicineSchema, type CreateMedicineInput } from "@/features/medicine-vault/schemas"
import { assertValidImageUpload } from "@/features/medicine-vault/upload-validation"

export type MedicineImageAttachment = {
  bytes: Uint8Array<ArrayBuffer>
  mimeType: string
  name: string
}

type MedicineSubmission = {
  input: CreateMedicineInput
  image?: MedicineImageAttachment
}

function toText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : ""
}

function parseJsonPayload(request: Request) {
  return request.json() as Promise<unknown>
}

async function parseMultipartPayload(request: Request): Promise<MedicineSubmission> {
  const formData = await request.formData()
  const file = formData.get("image")

  const payload = {
    memberId: toText(formData.get("memberId")),
    name: toText(formData.get("name")),
    category: toText(formData.get("category")),
    dosage: toText(formData.get("dosage")),
    specification: toText(formData.get("specification")),
    quantity: toText(formData.get("quantity")),
    storageLocation: toText(formData.get("storageLocation")),
    expiresAt: toText(formData.get("expiresAt")),
    instructions: toText(formData.get("instructions")),
    purpose: toText(formData.get("purpose")),
    usageNote: toText(formData.get("usageNote")),
    safetyNote: toText(formData.get("safetyNote")),
  }

  const input = createMedicineSchema.parse(payload)

  if (!(file instanceof File) || file.size === 0) {
    return { input }
  }

  assertValidImageUpload(file)

  return {
    input,
    image: {
      bytes: new Uint8Array((await file.arrayBuffer()) as ArrayBuffer),
      mimeType: file.type || "image/jpeg",
      name: file.name || "medicine-image",
    },
  }
}

export async function parseMedicineSubmission(request: Request): Promise<MedicineSubmission> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? ""

  if (contentType.includes("multipart/form-data")) {
    return parseMultipartPayload(request)
  }

  const input = createMedicineSchema.parse(await parseJsonPayload(request))
  return { input }
}
