# 任务 03：自动化回归测试

日期：2026-04-29

## 做了什么

- 引入 `@playwright/test`
- 新增 `playwright.config.ts`
- 新增 `npm run test:e2e` 与 `npm run test:e2e:headed`
- 新增独立 E2E 测试数据库与种子重置：
  - `tests/e2e/global-setup.ts`
  - `tests/e2e/helpers/test-db.ts`
- 新增药品管理回归测试：
  - `tests/e2e/medicines.spec.ts`
  - `tests/e2e/medicine-management.spec.ts`

## 当前自动化覆盖

- 打开 `/medicines`
- 搜索真实药品数据：`布洛芬`
- 校验药品卡片中的图片内联显示
- 打开药品编辑弹窗并检查原始值是否正确预填
- 校验顶部导出入口 `JSON / CSV`
- 使用隔离测试库执行新增、编辑、删除的完整药品主链路

## 当前边界

- 新增、编辑、删除已经放进隔离测试库里执行，不会污染日常开发数据
- AI 图片识别依赖真实外部模型，不适合做成默认每次执行的稳定 E2E，所以当前仍以非 AI 主链路为主

## 运行方式

```bash
npm run test:e2e
```

首次运行如缺少浏览器，可执行：

```bash
npx playwright install chromium
```

## 后续建议

- AI 识别链路建议拆成 mock 测试和少量人工验收，不建议默认每次全量跑真实模型
- 后续可把成员管理、病历管理、AI 助手问答也接入同一套隔离 E2E 数据环境
