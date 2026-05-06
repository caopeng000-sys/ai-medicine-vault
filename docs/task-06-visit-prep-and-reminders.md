# 任务 06：就医准备联动与药品提醒

## 本次完成内容

### 1. AI 助手联动就医准备页

- AI 助手当前支持 `recent_cold_record`、`medicine_query`、`visit_preparation` 三个意图。
- 当识别到“就医准备”类问题时，会返回对应成员的来源信息。
- 助手面板会根据来源中的 `memberId` 直接生成 `/visit-prep?memberId=...` 链接。
- 就医准备页支持按成员聚焦展示，不再只看默认第一条记录。

### 2. 药品管理页新增紧急提醒区

- 药品页增加了独立的“紧急药品提醒”区域。
- 统一复用现有的药品状态判断逻辑，整理出三类提醒：
  - 已过期
  - 库存不足
  - 即将过期
- 提醒卡片展示了成员、分类、原因、到期日期和库存信息。
- 每条提醒都提供了“聚焦此药”入口，方便快速跳回药品筛选视图。

## 验证结果

- `npm run build` 通过
- `npx tsx --test features/medicine-vault/medicine-reminders.test.ts app/visit-prep/page.test.ts features/medicine-vault/assistant-service.test.ts features/medicine-vault/assistant-routing.test.ts app/api/assistant/query/route.test.ts` 通过

## 相关文件

- `/Users/cp/Downloads/个人项目/前端/ai-medicine-vault/features/medicine-vault/assistant-service.ts`
- `/Users/cp/Downloads/个人项目/前端/ai-medicine-vault/components/medicine-vault/assistant-panel.tsx`
- `/Users/cp/Downloads/个人项目/前端/ai-medicine-vault/app/visit-prep/page.tsx`
- `/Users/cp/Downloads/个人项目/前端/ai-medicine-vault/app/medicines/page.tsx`
- `/Users/cp/Downloads/个人项目/前端/ai-medicine-vault/features/medicine-vault/medicine-reminders.ts`
- `/Users/cp/Downloads/个人项目/前端/ai-medicine-vault/components/medicine-vault/medicine-reminder-panel.tsx`

## 后续可继续的方向

- 把更多 AI 意图接进来，比如过敏查询、用药注意事项。
- 把提醒能力扩展到过期通知、库存补货和问诊前清单联动。
- 如果后面接生产环境，可以再把提醒数据接到定时任务里。
