# 任务 12：药品图片存储抽象与本地文件落盘

## 目标

把药品图片从数据库大字段中拆出来，改为“数据库只保存 `imageKey`，图片内容保存在本地文件系统”的结构，同时兼容旧数据里的 `imageBytes`。

## 已完成内容

- 新增 `features/medicine-vault/medicine-image-storage.ts`
  - `storeMedicineImage(...)`：把图片写入本地文件并返回 `imageKey`
  - `readMedicineImage(...)`：按 `imageKey` 读取图片内容和元数据
  - `deleteMedicineImage(...)`：删除图片文件和元数据
- 新增 `Medicine.imageKey`
  - `prisma/schema.prisma` 已补字段
  - 新迁移 `20260506183000_medicine_image_key_storage`
- 仓库层改造
  - 新建药品时，图片先写文件，再把 `imageKey` 存到数据库
  - 编辑药品时，如有新图片，先写文件，再更新 `imageKey`
  - 删除药品时，顺手清理对应图片文件
  - 查询药品原图时，优先按 `imageKey` 读文件，旧数据继续回退读 `imageBytes`
- 中文文档补充
  - `README.md` 已说明本地图片存储目录和兼容策略

## 兼容策略

- 新数据：优先使用 `imageKey`
- 旧数据：仍然支持数据库里的 `imageBytes`
- 如果图片文件丢失，读取接口会优先回退到旧字段，避免历史数据直接失效
- 仓库层在读取旧图片时会尽量自动回填到文件存储

## 默认存储位置

默认使用：

```bash
.tmp/medicine-images
```

也可以通过环境变量调整：

```bash
MEDICINE_IMAGE_STORAGE_DIR=".tmp/medicine-images"
```

## 验证

- `npx tsx --test features/medicine-vault/medicine-image-storage.test.ts features/medicine-vault/repository.test.ts`
- `npm run build`

## 后续可继续演进

- 把本地文件存储替换为阿里云 OSS、Cloudflare R2 或 S3 兼容对象存储
- 给图片加上传进度和更明确的失败提示
- 增加药品图片预览的缩略图缓存策略
- 使用 `npm run medicine:backfill-images` 批量迁移历史图片数据
