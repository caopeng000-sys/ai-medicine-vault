# 任务 15：GitHub Actions CI 和 E2E 门禁

## 目标

让仓库在每次 `pull_request` 和推送到 `main` 时自动执行核心质量检查，并把 E2E 回归也纳入 GitHub Actions。

## 已完成内容

- `.github/workflows/ci.yml`
  - 保留 Prisma 校验
  - 保留单元测试
  - 保留构建检查
  - 新增 E2E job
- `tests/e2e/helpers/test-db.ts`
  - 支持通过 `PLAYWRIGHT_TEST_DATABASE_URL` 覆盖测试库
- `tests/e2e/global-setup.ts`
  - 在外部测试数据库模式下跳过本地 `initdb` / `pg_ctl`

## CI 运行内容

当前 CI 会做：

1. `npx prisma validate`
2. `npx tsx --test "features/**/*.test.ts" "app/api/**/*.test.ts"`
3. `npm run build`
4. `npm run test:e2e`

## E2E 数据库策略

E2E job 使用 GitHub Actions 的 PostgreSQL service，并通过：

```bash
PLAYWRIGHT_TEST_DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:55432/ai_medicine_vault_e2e"
```

来驱动 Playwright 测试数据库。

## 验证

- `npx tsx --test tests/e2e/helpers/test-db.test.ts`
- `npm run build`

## 后续可继续演进

- 给 CI 增加环境变量缺失检查
- 继续扩 E2E 覆盖范围
- 视需要增加缓存和并行策略
