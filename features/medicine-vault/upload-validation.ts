export const MAX_IMAGE_FILE_SIZE = 8 * 1024 * 1024

const allowedImageMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
])

export function assertValidImageUpload(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("当前只支持上传图片文件。")
  }

  if (!allowedImageMimeTypes.has(file.type)) {
    throw new Error("仅支持 JPG、PNG、WebP 或 GIF 图片。")
  }

  if (file.size > MAX_IMAGE_FILE_SIZE) {
    throw new Error("图片不能超过 8MB。")
  }
}
