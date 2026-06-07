import "dotenv/config"

import { existsSync } from "node:fs"

import { config } from "dotenv"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"

import { persistMedicineImage } from "@/features/medicine-vault/medicine-image-storage"
import { isObjectStorageConfigured } from "@/lib/storage/object-storage"

config()

if (existsSync(".env.local")) {
  config({ path: ".env.local", override: true })
}

async function main() {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error("缺少 DATABASE_URL，无法迁移药品图片。")
  }

  if (!isObjectStorageConfigured()) {
    throw new Error("缺少 S3 环境变量，无法迁移药品图片到对象存储。")
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  })

  const medicines = await prisma.medicine.findMany({
    where: {
      imageBytes: {
        not: null,
      },
    },
    select: {
      id: true,
      userId: true,
      imageBytes: true,
      imageMimeType: true,
      imageName: true,
    },
  })

  let migrated = 0

  for (const medicine of medicines) {
    if (!medicine.imageBytes?.length) {
      continue
    }

    const imageData = await persistMedicineImage(medicine.userId, medicine.id, {
      bytes: new Uint8Array(medicine.imageBytes),
      mimeType: medicine.imageMimeType ?? "image/jpeg",
      name: medicine.imageName ?? `${medicine.id}.jpg`,
    })

    await prisma.medicine.update({
      where: { id: medicine.id },
      data: {
        imageKey: imageData.imageKey,
        imageBytes: imageData.imageBytes as Uint8Array<ArrayBuffer> | null,
        imageMimeType: imageData.imageMimeType,
        imageName: imageData.imageName,
      },
    })

    migrated += 1
    console.info(`migrated medicine image: ${medicine.id}`)
  }

  console.info(`done. migrated ${migrated} medicine image(s).`)
  await prisma.$disconnect()
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
