import { NextResponse } from "next/server"

import { crossCheckMedicineForMember } from "@/features/medicine-vault/allergy-cross-check"
import { requireCurrentUser } from "@/features/medicine-vault/auth-context"
import { extractMedicineFromImage } from "@/features/medicine-vault/medicine-image-extractor"
import { listAllergyRecords } from "@/features/medicine-vault/repository"

const MAX_FILE_SIZE = 8 * 1024 * 1024

function isImageFile(file: File) {
  return file.type.startsWith("image/")
}

function toDataUrl(file: File, buffer: Buffer) {
  const mimeType = file.type || "image/jpeg"
  return `data:${mimeType};base64,${buffer.toString("base64")}`
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("image")
    const memberIdValue = formData.get("memberId")
    const memberId = typeof memberIdValue === "string" ? memberIdValue.trim() : ""

    if (!(file instanceof File)) {
      throw new Error("请先上传药品图片。")
    }

    if (!isImageFile(file)) {
      throw new Error("当前只支持上传图片文件。")
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error("图片不能超过 8MB。")
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const extracted = await extractMedicineFromImage(toDataUrl(file, buffer))

    let allergyCrossCheck = null

    if (memberId) {
      const ctx = await requireCurrentUser()
      const allergies = await listAllergyRecords(ctx, memberId)
      allergyCrossCheck = crossCheckMedicineForMember(memberId, extracted, allergies)
    }

    return NextResponse.json({
      message: "图片识别完成。",
      data: extracted,
      allergyCrossCheck,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "图片识别失败。"
    return NextResponse.json({ message }, { status: 400 })
  }
}
