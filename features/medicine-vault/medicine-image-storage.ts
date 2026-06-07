import type { MedicineImageAttachment } from "@/features/medicine-vault/medicine-request"
import {
  buildMedicineImageObjectKey,
  deleteObject,
  getObject,
  isObjectStorageConfigured,
  uploadObject,
} from "@/lib/storage/object-storage"

export type MedicineImageRecord = Readonly<{
  imageKey?: string | null
  imageBytes?: Uint8Array | Buffer | null
  imageMimeType?: string | null
  imageName?: string | null
}>

export type PersistedMedicineImage = Readonly<{
  imageKey?: string | null
  imageBytes?: Uint8Array | null
  imageMimeType?: string | null
  imageName?: string | null
}>

export async function persistMedicineImage(
  userId: string,
  medicineId: string,
  image: MedicineImageAttachment,
): Promise<PersistedMedicineImage> {
  if (isObjectStorageConfigured()) {
    const imageKey = buildMedicineImageObjectKey(userId, medicineId, image.name)

    await uploadObject(imageKey, {
      bytes: image.bytes,
      mimeType: image.mimeType,
    })

    return {
      imageKey,
      imageBytes: null,
      imageMimeType: image.mimeType,
      imageName: image.name,
    }
  }

  return {
    imageKey: null,
    imageBytes: image.bytes,
    imageMimeType: image.mimeType,
    imageName: image.name,
  }
}

export async function deleteMedicineImageAsset(imageKey?: string | null) {
  if (!imageKey || !isObjectStorageConfigured()) {
    return
  }

  try {
    await deleteObject(imageKey)
  } catch {
    // Ignore cleanup failures so user data deletion can continue.
  }
}

export async function resolveMedicineImageAsset(record: MedicineImageRecord & { name: string }) {
  if (record.imageKey && isObjectStorageConfigured()) {
    const object = await getObject(record.imageKey)

    if (!object) {
      return undefined
    }

    return {
      name: record.name,
      imageBytes: object.bytes,
      imageMimeType: object.mimeType,
      imageName: record.imageName ?? `${record.name}.jpg`,
    }
  }

  if (!record.imageBytes?.length) {
    return undefined
  }

  return {
    name: record.name,
    imageBytes: record.imageBytes,
    imageMimeType: record.imageMimeType ?? "image/jpeg",
    imageName: record.imageName ?? `${record.name}.jpg`,
  }
}
