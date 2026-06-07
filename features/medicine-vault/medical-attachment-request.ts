import { createMedicalRecordAttachmentSchema } from "./schemas"

export type MedicalAttachmentFile = { bytes: Uint8Array<ArrayBuffer>; mimeType: string; name: string }

export async function parseMedicalAttachmentSubmission(request: Request) {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? ""
  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData()
    const file = formData.get("image")
    const medicalRecordId = String(formData.get("medicalRecordId") ?? "").trim()
    const input = createMedicalRecordAttachmentSchema.parse({
      memberId: String(formData.get("memberId") ?? ""),
      extractedText: String(formData.get("extractedText") ?? ""),
      ...(medicalRecordId ? { medicalRecordId } : {}),
    })
    if (!(file instanceof File) || file.size === 0) return { input }
    return {
      input,
      file: { bytes: new Uint8Array((await file.arrayBuffer()) as ArrayBuffer), mimeType: file.type || "image/jpeg", name: file.name || "medical-attachment" },
    }
  }
  return { input: createMedicalRecordAttachmentSchema.parse(await request.json()) }
}
