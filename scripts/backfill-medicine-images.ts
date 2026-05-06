import { backfillLegacyMedicineImage } from "@/features/medicine-vault/medicine-image-backfill"
import { deleteMedicineImage, storeMedicineImage } from "@/features/medicine-vault/medicine-image-storage"
import { getPrismaClient } from "@/lib/db"

async function main() {
  const prisma = getPrismaClient()

  if (!prisma) {
    throw new Error("请先配置 DATABASE_URL，再执行药品图片回填脚本。")
  }

  const candidates = await prisma.medicine.findMany({
    where: {
      imageKey: null,
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
      imageKey: true,
    },
  })

  if (candidates.length === 0) {
    console.log("没有需要回填的药品图片。")
    return
  }

  let migrated = 0

  for (const medicine of candidates) {
    await backfillLegacyMedicineImage(medicine, {
      storeMedicineImage,
      updateMedicineImageKey: async (medicineId, imageKey) => {
        await prisma.medicine.update({
          where: { id: medicineId },
          data: {
            imageKey,
            imageBytes: null,
            imageMimeType: null,
            imageName: null,
          },
        })
      },
      deleteMedicineImage,
    })

    migrated += 1
    console.log(`已回填药品图片：${medicine.id}`)
  }

  console.log(`回填完成，共处理 ${migrated} 条药品图片。`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
