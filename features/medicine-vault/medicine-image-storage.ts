import fs from "node:fs/promises"
import path from "node:path"
import { randomUUID } from "node:crypto"

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  type S3ClientConfig,
} from "@aws-sdk/client-s3"

export type MedicineImageAttachment = Readonly<{
  imageKey: string
  imageMimeType: string
  imageName: string
}>

export type MedicineImageInput = Readonly<{
  userId: string
  medicineId: string
  imageBytes: Uint8Array
  imageMimeType: string
  imageName: string
}>

export type MedicineImageRecord = Readonly<{
  imageKey: string
  imageBytes: Uint8Array
  imageMimeType: string
  imageName: string
}>

export type MedicineImageStorageAdapter = Readonly<{
  storeMedicineImage(input: MedicineImageInput): Promise<MedicineImageAttachment>
  readMedicineImage(imageKey: string): Promise<MedicineImageRecord>
  deleteMedicineImage(imageKey: string): Promise<void>
}>

type LocalMedicineImageStorageConfig = Readonly<{
  provider?: "local"
  directory?: string
}>

type S3CompatibleMedicineImageStorageConfig = Readonly<{
  provider: "s3"
  bucket: string
  region: string
  endpoint?: string
  accessKeyId: string
  accessKeySecret: string
  forcePathStyle?: boolean
  client?: S3ClientLike
}>

export type MedicineImageStorageConfig =
  | LocalMedicineImageStorageConfig
  | S3CompatibleMedicineImageStorageConfig

type S3ClientLike = Readonly<{
  send(command: PutObjectCommand | GetObjectCommand | DeleteObjectCommand): Promise<unknown>
}>

type MedicineImageMetadata = Readonly<{
  imageKey: string
  userId: string
  medicineId: string
  imageMimeType: string
  imageName: string
  createdAt: string
}>

const DEFAULT_STORAGE_DIR = path.join(process.cwd(), ".tmp", "medicine-images")

let cachedDefaultStorage:
  | Readonly<{
      cacheKey: string
      storage: MedicineImageStorageAdapter
    }>
  | undefined

function sanitizeKeySegment(value: string) {
  const sanitized = value.trim().replaceAll(path.sep, "_").replace(/[^a-zA-Z0-9._-]/g, "_")

  return sanitized.length > 0 ? sanitized : "unknown"
}

function buildMedicineImageKey(input: Pick<MedicineImageInput, "userId" | "medicineId">) {
  return [
    "users",
    sanitizeKeySegment(input.userId),
    "medicines",
    sanitizeKeySegment(input.medicineId),
    "images",
    randomUUID(),
  ].join("/")
}

function resolveLocalStorageDirectory(config?: LocalMedicineImageStorageConfig) {
  const configured = config?.directory?.trim() || process.env.MEDICINE_IMAGE_STORAGE_DIR?.trim()

  return path.resolve(configured && configured.length > 0 ? configured : DEFAULT_STORAGE_DIR)
}

function getLocalMedicineImagePaths(storageDirectory: string, imageKey: string) {
  const safeKey = imageKey.replaceAll(path.sep, "/")
  const dataPath = path.join(storageDirectory, `${safeKey}.bin`)
  const metadataPath = path.join(storageDirectory, `${safeKey}.json`)

  return { dataPath, metadataPath }
}

async function ensureParentDirectory(filePath: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
}

async function readBodyToBytes(body: unknown) {
  if (!body) {
    throw new Error("未找到药品原图。")
  }

  if (body instanceof Uint8Array) {
    return new Uint8Array(body)
  }

  if (Buffer.isBuffer(body)) {
    return new Uint8Array(body)
  }

  const maybeTransform = body as { transformToByteArray?: () => Promise<Uint8Array> }

  if (typeof maybeTransform.transformToByteArray === "function") {
    return new Uint8Array(await maybeTransform.transformToByteArray())
  }

  if (typeof (body as ReadableStream).getReader === "function") {
    const response = new Response(body as BodyInit)
    return new Uint8Array(await response.arrayBuffer())
  }

  throw new Error("未找到药品原图。")
}

function isNotFoundError(error: unknown) {
  return (
    error instanceof Error &&
    ((error as { code?: string; name?: string }).code === "ENOENT" ||
      (error as { code?: string; name?: string }).code === "NoSuchKey" ||
      (error as { code?: string; name?: string }).name === "NoSuchKey" ||
      (error as { code?: string; name?: string }).name === "NotFound")
  )
}

function isMetadataError(error: unknown) {
  return error instanceof SyntaxError
}

function resolveDefaultStorageConfig(): MedicineImageStorageConfig {
  const provider = process.env.MEDICINE_IMAGE_STORAGE_PROVIDER?.trim().toLowerCase()

  if (provider === "s3") {
    const bucket = process.env.MEDICINE_IMAGE_STORAGE_BUCKET?.trim()
    const region = process.env.MEDICINE_IMAGE_STORAGE_REGION?.trim()
    const accessKeyId = process.env.MEDICINE_IMAGE_STORAGE_ACCESS_KEY_ID?.trim()
    const accessKeySecret = process.env.MEDICINE_IMAGE_STORAGE_ACCESS_KEY_SECRET?.trim()

    if (!bucket || !region || !accessKeyId || !accessKeySecret) {
      throw new Error("选择 S3 对象存储时，需要配置存储桶、地域和访问密钥。")
    }

    return {
      provider: "s3",
      bucket,
      region,
      endpoint: process.env.MEDICINE_IMAGE_STORAGE_ENDPOINT?.trim() || undefined,
      accessKeyId,
      accessKeySecret,
      forcePathStyle: process.env.MEDICINE_IMAGE_STORAGE_FORCE_PATH_STYLE?.trim() !== "false",
    }
  }

  return {
    provider: "local",
    directory: process.env.MEDICINE_IMAGE_STORAGE_DIR?.trim() || undefined,
  }
}

function createLocalMedicineImageStorage(config?: LocalMedicineImageStorageConfig): MedicineImageStorageAdapter {
  const storageDirectory = resolveLocalStorageDirectory(config)

  return {
    async storeMedicineImage(input) {
      const imageKey = buildMedicineImageKey(input)
      const { dataPath, metadataPath } = getLocalMedicineImagePaths(storageDirectory, imageKey)
      const metadata: MedicineImageMetadata = {
        imageKey,
        userId: input.userId,
        medicineId: input.medicineId,
        imageMimeType: input.imageMimeType,
        imageName: input.imageName,
        createdAt: new Date().toISOString(),
      }

      await ensureParentDirectory(dataPath)
      await fs.writeFile(dataPath, Buffer.from(input.imageBytes))
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))

      return {
        imageKey,
        imageMimeType: input.imageMimeType,
        imageName: input.imageName,
      }
    },

    async readMedicineImage(imageKey) {
      const { dataPath, metadataPath } = getLocalMedicineImagePaths(storageDirectory, imageKey)

      try {
        const [metadataRaw, imageBytes] = await Promise.all([
          fs.readFile(metadataPath, "utf8"),
          fs.readFile(dataPath),
        ])

        const metadata = JSON.parse(metadataRaw) as MedicineImageMetadata

        return {
          imageKey: metadata.imageKey,
          imageBytes: new Uint8Array(imageBytes),
          imageMimeType: metadata.imageMimeType,
          imageName: metadata.imageName,
        }
      } catch (error) {
        if (isNotFoundError(error)) {
          throw new Error("未找到药品原图。")
        }

        if (isMetadataError(error)) {
          throw new Error("药品原图元数据已损坏。")
        }

        throw error
      }
    },

    async deleteMedicineImage(imageKey) {
      const { dataPath, metadataPath } = getLocalMedicineImagePaths(storageDirectory, imageKey)

      await Promise.allSettled([fs.unlink(dataPath), fs.unlink(metadataPath)])
    },
  }
}

function createS3MedicineImageStorage(config: S3CompatibleMedicineImageStorageConfig): MedicineImageStorageAdapter {
  const client =
    config.client ??
    new S3Client({
      region: config.region,
      endpoint: config.endpoint || undefined,
      forcePathStyle: config.forcePathStyle ?? true,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.accessKeySecret,
      },
    } satisfies S3ClientConfig)

  return {
    async storeMedicineImage(input) {
      const imageKey = buildMedicineImageKey(input)

      await client.send(
        new PutObjectCommand({
          Bucket: config.bucket,
          Key: imageKey,
          Body: Buffer.from(input.imageBytes),
          ContentType: input.imageMimeType,
          Metadata: {
            "user-id": input.userId,
            "medicine-id": input.medicineId,
            "image-name": input.imageName,
            "created-at": new Date().toISOString(),
          },
        })
      )

      return {
        imageKey,
        imageMimeType: input.imageMimeType,
        imageName: input.imageName,
      }
    },

    async readMedicineImage(imageKey) {
      try {
        const response = (await client.send(
          new GetObjectCommand({
            Bucket: config.bucket,
            Key: imageKey,
          })
        )) as {
          Body?: unknown
          ContentType?: string
          Metadata?: Record<string, string | undefined>
        }

        const imageBytes = await readBodyToBytes(response.Body)
        const fallbackName = path.basename(imageKey).trim() || "medicine-image.jpg"

        return {
          imageKey,
          imageBytes,
          imageMimeType: response.ContentType ?? response.Metadata?.["content-type"] ?? "image/jpeg",
          imageName: response.Metadata?.["image-name"] ?? fallbackName,
        }
      } catch (error) {
        if (isNotFoundError(error)) {
          throw new Error("未找到药品原图。")
        }

        throw error
      }
    },

    async deleteMedicineImage(imageKey) {
      await client.send(
        new DeleteObjectCommand({
          Bucket: config.bucket,
          Key: imageKey,
        })
      )
    },
  }
}

export function createMedicineImageStorage(config: MedicineImageStorageConfig = resolveDefaultStorageConfig()) {
  if (config.provider === "s3") {
    return createS3MedicineImageStorage(config)
  }

  return createLocalMedicineImageStorage(config)
}

function getDefaultMedicineImageStorage() {
  const config = resolveDefaultStorageConfig()
  const cacheKey = JSON.stringify({
    provider: config.provider,
    directory: config.provider === "local" ? config.directory ?? null : null,
    bucket: config.provider === "s3" ? config.bucket : null,
    region: config.provider === "s3" ? config.region : null,
    endpoint: config.provider === "s3" ? config.endpoint ?? null : null,
    forcePathStyle: config.provider === "s3" ? config.forcePathStyle ?? null : null,
    accessKeyId: config.provider === "s3" ? config.accessKeyId : null,
  })

  if (cachedDefaultStorage?.cacheKey === cacheKey) {
    return cachedDefaultStorage.storage
  }

  const storage = createMedicineImageStorage(config)
  cachedDefaultStorage = {
    cacheKey,
    storage,
  }

  return storage
}

export async function storeMedicineImage(input: MedicineImageInput) {
  return getDefaultMedicineImageStorage().storeMedicineImage(input)
}

export async function readMedicineImage(imageKey: string) {
  return getDefaultMedicineImageStorage().readMedicineImage(imageKey)
}

export async function deleteMedicineImage(imageKey: string) {
  return getDefaultMedicineImageStorage().deleteMedicineImage(imageKey)
}
