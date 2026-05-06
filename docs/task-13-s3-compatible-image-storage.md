# 任务 13：S3 兼容药品图片对象存储后端

## 目标

在已有本地文件存储抽象的基础上，补充一个 S3 兼容对象存储后端，让药品图片可以直接切到阿里云 OSS、Cloudflare R2、AWS S3 或其他兼容服务。

## 已完成内容

- `features/medicine-vault/medicine-image-storage.ts`
  - 新增 `createMedicineImageStorage(...)`
  - 支持 `provider: "local"` 和 `provider: "s3"`
  - 支持通过环境变量默认选择后端
- `npm run medicine:backfill-images`
  - 可以把历史 `imageBytes` 批量迁移到当前图片存储后端
- `README.md`
  - 已补充图片后端环境变量说明
- `docs/user-required-services.md`
  - 已补充 S3 兼容对象存储的用户准备项

## S3 后端能力

当前 S3 兼容后端支持：

- 上传图片到 bucket
- 按 `imageKey` 读取图片内容和元数据
- 删除图片对象

对象 key 采用分层结构：

```text
users/<userId>/medicines/<medicineId>/images/<uuid>
```

## 环境变量

如果使用 S3 兼容对象存储，需要配置：

```bash
MEDICINE_IMAGE_STORAGE_PROVIDER="s3"
MEDICINE_IMAGE_STORAGE_BUCKET="..."
MEDICINE_IMAGE_STORAGE_REGION="..."
MEDICINE_IMAGE_STORAGE_ENDPOINT="..."
MEDICINE_IMAGE_STORAGE_ACCESS_KEY_ID="..."
MEDICINE_IMAGE_STORAGE_ACCESS_KEY_SECRET="..."
MEDICINE_IMAGE_STORAGE_FORCE_PATH_STYLE="true"
```

如果暂时只想本地开发，可以继续使用：

```bash
MEDICINE_IMAGE_STORAGE_PROVIDER="local"
MEDICINE_IMAGE_STORAGE_DIR=".tmp/medicine-images"
```

## 验证

- `npx tsx --test features/medicine-vault/medicine-image-backfill.test.ts features/medicine-vault/medicine-image-storage.test.ts features/medicine-vault/medicine-image-storage-s3.test.ts features/medicine-vault/repository.test.ts`
- `npm run build`

## 后续可继续演进

- 接入阿里云 OSS 的生产桶
- 接入 Cloudflare R2 或 AWS S3
- 为图片访问加缩略图或 CDN 缓存策略
- 进一步优化历史数据回填脚本的进度展示和容错信息
