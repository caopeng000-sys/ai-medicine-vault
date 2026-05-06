# 任务 14：图片对象存储环境变量模板补齐

## 目标

把药品图片存储相关的环境变量模板补齐到本地和生产示例文件里，并把需要用户准备的对象存储信息整理成中文说明。

## 已完成内容

- `.env.local.example`
  - 增加 `MEDICINE_IMAGE_STORAGE_PROVIDER="local"`
  - 增加 `MEDICINE_IMAGE_STORAGE_DIR=".tmp/medicine-images"`
- `.env.production.example`
  - 增加 S3 兼容对象存储示例变量
- `docs/user-required-services.md`
  - 改成图片对象存储实际使用的变量名
  - 补充阿里云 OSS 的说明

## 本地开发建议

本地默认继续使用：

```bash
MEDICINE_IMAGE_STORAGE_PROVIDER="local"
MEDICINE_IMAGE_STORAGE_DIR=".tmp/medicine-images"
```

## 生产环境建议

如果图片要进入云端对象存储，建议直接使用：

```bash
MEDICINE_IMAGE_STORAGE_PROVIDER="s3"
MEDICINE_IMAGE_STORAGE_BUCKET="..."
MEDICINE_IMAGE_STORAGE_REGION="..."
MEDICINE_IMAGE_STORAGE_ENDPOINT="..."
MEDICINE_IMAGE_STORAGE_ACCESS_KEY_ID="..."
MEDICINE_IMAGE_STORAGE_ACCESS_KEY_SECRET="..."
MEDICINE_IMAGE_STORAGE_FORCE_PATH_STYLE="true"
```

## 验证

- 本次主要是配置模板和文档补齐，没有改业务逻辑
- 之前已通过：
  - `npm run build`
  - `npx tsx --test features/medicine-vault/medicine-image-backfill.test.ts features/medicine-vault/medicine-image-storage.test.ts features/medicine-vault/medicine-image-storage-s3.test.ts features/medicine-vault/repository.test.ts`

## 后续可继续演进

- 把阿里云 OSS 的真实 bucket 配置写入部署文档
- 为生产环境再补一份对象存储检查清单
