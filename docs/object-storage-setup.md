# 药品图片对象存储

当配置了 S3 兼容对象存储后，新上传的药品图片会写入对象存储，数据库只保存 `imageKey` 与元数据；未配置时继续写入 PostgreSQL `imageBytes` 字段。

## 环境变量

```bash
S3_BUCKET="medicine-vault-images"
S3_ACCESS_KEY_ID="..."
S3_SECRET_ACCESS_KEY="..."
# 可选：Cloudflare R2 / MinIO 等 S3 兼容服务
S3_ENDPOINT="https://<account-id>.r2.cloudflarestorage.com"
S3_REGION="auto"
```

## 对象 Key 规则

```
medicines/{userId}/{medicineId}/{fileName}
```

图片仍通过 `/api/medicines/[medicineId]/image` 受控读取，未授权用户无法访问他人图片。

## 迁移已有数据库图片

若历史数据仍在 `imageBytes` 中，可在配置好对象存储后执行：

```bash
set -a && source .env.local && set +a
npm run migrate:medicine-images
```

脚本会将仍有 `imageBytes` 的记录上传到对象存储，写入 `imageKey` 并清空 `imageBytes`。

## 验收

- 配置 S3 后，新上传图片不再增大 PostgreSQL 体积
- 药品卡片与详情页图片正常显示
- 删除药品时会尝试清理对象存储中的图片
