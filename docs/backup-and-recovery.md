# 备份与恢复

本文档说明 ai-medicine-vault 生产环境的备份与恢复流程，对应 P0 4.6。

## 1. 需要备份的资产

| 资产 | 位置 | 优先级 |
|------|------|--------|
| 业务数据 | PostgreSQL（成员、病历、药品、过敏、AI 对话等） | P0 |
| 药品图片 | S3 兼容对象存储（`imageKey`）或 PostgreSQL `imageBytes` | P0 |
| Auth 会话 | PostgreSQL `Session` / `Account` | P1 |
| 环境变量 | Vercel / 托管平台 | P0 |

## 2. 数据库备份

### 托管 PostgreSQL（推荐）

若使用 Neon / Supabase / Railway / RDS，开启**自动每日备份**并设置保留期（建议 ≥ 7 天）。

### 手动备份（演练或迁移前）

```bash
# 从 .env.local 或生产环境读取 DATABASE_URL
set -a && source .env.local && set +a

pg_dump "$DATABASE_URL" \
  --format=custom \
  --file="backups/ai-medicine-vault-$(date +%Y%m%d-%H%M%S).dump"

# 或纯 SQL
pg_dump "$DATABASE_URL" > "backups/ai-medicine-vault-$(date +%Y%m%d).sql"
```

备份文件不要提交到 Git；存放于加密存储或运维桶。

### 迁移前备份（必做）

每次在生产执行 `npm run prisma:deploy` **之前**：

1. 触发托管平台快照，或执行 `pg_dump`
2. 记录当前 migration 版本（`prisma migrate status`）
3. 确认备份可下载/可恢复后再部署

## 3. 对象存储备份

配置 S3 后，药品图片位于 `medicines/{userId}/{medicineId}/...`。

建议：

- 开启 bucket **版本控制**（Versioning）
- 或配置跨 region / 跨 bucket 复制
- 定期列出 `medicines/` 前缀对象数量，与 DB 中有 `imageKey` 的记录数对照

若仍使用 PostgreSQL `imageBytes`（未配置 S3），图片随数据库备份一并覆盖。

### 历史图片迁到对象存储后

```bash
npm run migrate:medicine-images
```

迁移完成后再次 `pg_dump`，并确认对象存储中已有对应 key。

## 4. 恢复流程

### 4.1 恢复数据库

```bash
# custom format
pg_restore --clean --if-exists --dbname="$DATABASE_URL" backups/ai-medicine-vault-YYYYMMDD.dump

# 或 SQL
psql "$DATABASE_URL" < backups/ai-medicine-vault-YYYYMMDD.sql
```

恢复后：

```bash
npx prisma migrate status
npm run prisma:deploy   # 若 schema 落后于代码
```

### 4.2 恢复对象存储

- 若启用版本控制：在控制台或使用 CLI 恢复被删对象
- 若仅从 DB 恢复而 bucket 为空：对有 `imageKey` 但对象缺失的记录，需从 DB 备份中恢复 `imageBytes` 或让用户重新上传

### 4.3 恢复顺序（推荐）

1. 恢复 PostgreSQL 到目标时间点
2. 确认 `prisma migrate status` 与代码一致
3. 恢复 / 验证对象存储图片
4. 重新部署应用（Vercel 最新 main）
5.  smoke test：登录 → 成员列表 → 药品图片 → 助手查询

## 5. 恢复演练（验收）

至少每季度一次，或在重大 schema 变更前：

1. 在**隔离环境**（staging DB + staging bucket）还原最近备份
2. 执行 `npm run prisma:deploy`（如需要）
3. 用测试账号验证登录与数据读取
4. 记录耗时与问题到运维日志

**验收标准（P0 4.6）**

- [ ] 能从最近备份恢复数据库
- [ ] 能恢复或重新关联药品图片
- [ ] 有书面恢复步骤（本文档）
- [ ] 完成至少一次演练并记录结果

## 6. 用户数据导出（后续）

第一版可在应用内增加「导出 JSON」API（P1 5.4）。备份恢复与用户导出互补：备份供灾难恢复，导出供用户自持副本。

## 7. 相关文档

- [production-database-setup.md](./production-database-setup.md)
- [object-storage-setup.md](./object-storage-setup.md)
- [production-readiness-roadmap.md](./production-readiness-roadmap.md)
