import type { MedicineImageAttachment, MedicineImageInput } from "./medicine-image-storage"

export type LegacyMedicineImageRecord = Readonly<{
  id: string
  userId: string
  imageBytes: Uint8Array | Buffer | null
  imageMimeType: string | null
  imageName: string | null
  imageKey?: string | null
}>

export type MedicineImageBackfillDependencies = Readonly<{
  storeMedicineImage: (input: MedicineImageInput) => Promise<MedicineImageAttachment>
  updateMedicineImageKey: (medicineId: string, imageKey: string) => Promise<void>
  deleteMedicineImage: (imageKey: string) => Promise<void>
}>

export async function backfillLegacyMedicineImage(
  medicine: LegacyMedicineImageRecord,
  dependencies: MedicineImageBackfillDependencies
): Promise<MedicineImageAttachment | undefined> {
  if (medicine.imageKey?.trim() || !medicine.imageBytes?.length) {
    return undefined
  }

  const storedImage = await dependencies.storeMedicineImage({
    userId: medicine.userId,
    medicineId: medicine.id,
    imageBytes: medicine.imageBytes,
    imageMimeType: medicine.imageMimeType ?? "image/jpeg",
    imageName: medicine.imageName ?? `${medicine.id}.jpg`,
  })

  try {
    await dependencies.updateMedicineImageKey(medicine.id, storedImage.imageKey)
  } catch (error) {
    try {
      await dependencies.deleteMedicineImage(storedImage.imageKey)
    } catch {
      // Best effort cleanup only.
    }

    throw error
  }

  return {
    imageKey: storedImage.imageKey,
    imageMimeType: storedImage.imageMimeType,
    imageName: storedImage.imageName,
  }
}
