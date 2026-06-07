import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"

export type StoredObjectPayload = Readonly<{
  bytes: Uint8Array
  mimeType: string
}>

function readRequiredEnv(name: string) {
  const value = process.env[name]?.trim()
  return value || null
}

export function isObjectStorageConfigured() {
  return Boolean(
    readRequiredEnv("S3_BUCKET") &&
      readRequiredEnv("S3_ACCESS_KEY_ID") &&
      readRequiredEnv("S3_SECRET_ACCESS_KEY"),
  )
}

function createS3Client() {
  const endpoint = readRequiredEnv("S3_ENDPOINT")

  return new S3Client({
    region: readRequiredEnv("S3_REGION") ?? "auto",
    endpoint: endpoint ?? undefined,
    credentials: {
      accessKeyId: readRequiredEnv("S3_ACCESS_KEY_ID")!,
      secretAccessKey: readRequiredEnv("S3_SECRET_ACCESS_KEY")!,
    },
    forcePathStyle: Boolean(endpoint),
  })
}

export function buildMedicineImageObjectKey(userId: string, medicineId: string, fileName: string) {
  const safeName = fileName.replace(/[^\w.-]+/g, "_").replace(/^_+/, "") || "medicine-image"
  return `medicines/${userId}/${medicineId}/${safeName}`
}

async function streamToUint8Array(body: unknown) {
  if (!body) {
    return null
  }

  if (body instanceof Uint8Array) {
    return body
  }

  if (typeof body === "object" && body !== null && Symbol.asyncIterator in body) {
    const chunks: Uint8Array[] = []

    for await (const chunk of body as AsyncIterable<Uint8Array | string>) {
      chunks.push(typeof chunk === "string" ? new TextEncoder().encode(chunk) : chunk)
    }

    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
    const merged = new Uint8Array(totalLength)
    let offset = 0

    for (const chunk of chunks) {
      merged.set(chunk, offset)
      offset += chunk.length
    }

    return merged
  }

  return null
}

export async function uploadObject(key: string, payload: StoredObjectPayload) {
  const client = createS3Client()

  await client.send(
    new PutObjectCommand({
      Bucket: readRequiredEnv("S3_BUCKET")!,
      Key: key,
      Body: payload.bytes,
      ContentType: payload.mimeType,
    }),
  )
}

export async function getObject(key: string) {
  const client = createS3Client()

  try {
    const response = await client.send(
      new GetObjectCommand({
        Bucket: readRequiredEnv("S3_BUCKET")!,
        Key: key,
      }),
    )

    const bytes = await streamToUint8Array(response.Body)

    if (!bytes?.length) {
      return null
    }

    return {
      bytes,
      mimeType: response.ContentType ?? "application/octet-stream",
    } satisfies StoredObjectPayload
  } catch {
    return null
  }
}

export async function deleteObject(key: string) {
  const client = createS3Client()

  await client.send(
    new DeleteObjectCommand({
      Bucket: readRequiredEnv("S3_BUCKET")!,
      Key: key,
    }),
  )
}
