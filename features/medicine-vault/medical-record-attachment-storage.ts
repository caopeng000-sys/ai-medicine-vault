import { randomUUID } from "node:crypto"
import fs from "node:fs/promises"
import path from "node:path"

export type MedicalRecordAttachmentInput = Readonly<{
  userId: string
  recordId: string
  fileBytes: Uint8Array
  fileName: string
  mimeType: string
}>

export type StoredMedicalRecordAttachment = Readonly<{
  fileKey: string
  fileBytes: Uint8Array
  fileName: string
  mimeType: string
}>

export type MedicalRecordAttachmentStorageAdapter = Readonly<{
  storeAttachment(input: MedicalRecordAttachmentInput): Promise<StoredMedicalRecordAttachment>
  readAttachment(fileKey: string): Promise<StoredMedicalRecordAttachment>
  deleteAttachment(fileKey: string): Promise<void>
}>

type MedicalRecordAttachmentMetadata = Readonly<{
  fileKey: string
  userId: string
  recordId: string
  fileName: string
  mimeType: string
  createdAt: string
}>

const DEFAULT_ATTACHMENT_DIR = path.join(process.cwd(), ".tmp", "medical-record-attachments")

function sanitizeKeySegment(value: string) {
  const sanitized = value.trim().replaceAll(path.sep, "_").replace(/[^a-zA-Z0-9._-]/g, "_")

  return sanitized.length > 0 ? sanitized : "unknown"
}

function resolveAttachmentDirectory(directory?: string) {
  const configured = directory?.trim() || process.env.MEDICAL_RECORD_ATTACHMENT_STORAGE_DIR?.trim()

  return path.resolve(configured && configured.length > 0 ? configured : DEFAULT_ATTACHMENT_DIR)
}

function buildAttachmentKey(input: Pick<MedicalRecordAttachmentInput, "userId" | "recordId">) {
  return [
    "users",
    sanitizeKeySegment(input.userId),
    "medical-records",
    sanitizeKeySegment(input.recordId),
    "attachments",
    randomUUID(),
  ].join("/")
}

function getAttachmentPaths(storageDirectory: string, fileKey: string) {
  const safeKey = fileKey.replaceAll(path.sep, "/")

  return {
    dataPath: path.join(storageDirectory, `${safeKey}.bin`),
    metadataPath: path.join(storageDirectory, `${safeKey}.json`),
  }
}

async function ensureParentDirectory(filePath: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
}

function isNotFoundError(error: unknown) {
  return error instanceof Error && (error as { code?: string }).code === "ENOENT"
}

export function createMedicalRecordAttachmentStorage(
  directory?: string
): MedicalRecordAttachmentStorageAdapter {
  const storageDirectory = resolveAttachmentDirectory(directory)

  return {
    async storeAttachment(input) {
      const fileKey = buildAttachmentKey(input)
      const { dataPath, metadataPath } = getAttachmentPaths(storageDirectory, fileKey)
      const metadata: MedicalRecordAttachmentMetadata = {
        fileKey,
        userId: input.userId,
        recordId: input.recordId,
        fileName: input.fileName,
        mimeType: input.mimeType,
        createdAt: new Date().toISOString(),
      }

      await ensureParentDirectory(dataPath)
      await fs.writeFile(dataPath, Buffer.from(input.fileBytes))
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))

      return {
        fileKey,
        fileBytes: input.fileBytes,
        fileName: input.fileName,
        mimeType: input.mimeType,
      }
    },

    async readAttachment(fileKey) {
      const { dataPath, metadataPath } = getAttachmentPaths(storageDirectory, fileKey)

      try {
        const [metadataRaw, fileBytes] = await Promise.all([
          fs.readFile(metadataPath, "utf8"),
          fs.readFile(dataPath),
        ])
        const metadata = JSON.parse(metadataRaw) as MedicalRecordAttachmentMetadata

        return {
          fileKey: metadata.fileKey,
          fileBytes: new Uint8Array(fileBytes),
          fileName: metadata.fileName,
          mimeType: metadata.mimeType,
        }
      } catch (error) {
        if (isNotFoundError(error)) {
          throw new Error("未找到病历附件。")
        }

        if (error instanceof SyntaxError) {
          throw new Error("病历附件元数据已损坏。")
        }

        throw error
      }
    },

    async deleteAttachment(fileKey) {
      const { dataPath, metadataPath } = getAttachmentPaths(storageDirectory, fileKey)

      await Promise.allSettled([fs.unlink(dataPath), fs.unlink(metadataPath)])
    },
  }
}

const defaultStorage = createMedicalRecordAttachmentStorage()

export async function storeMedicalRecordAttachment(input: MedicalRecordAttachmentInput) {
  return defaultStorage.storeAttachment(input)
}

export async function readMedicalRecordAttachment(fileKey: string) {
  return defaultStorage.readAttachment(fileKey)
}

export async function deleteMedicalRecordAttachment(fileKey: string) {
  return defaultStorage.deleteAttachment(fileKey)
}
