# 任务 07：用药说明与服药方法意图

## 本次完成内容

- 新增 `medicine_usage` 意图，用来回答“怎么吃 / 怎么用 / 饭前饭后 / 注意事项 / 用法用量”这类问题。
- 复用现有药品库数据，优先整理药品名称、分类、剂量、用法说明、用途和安全提示。
- AI 助手面板的意图数量和提示文案已同步更新。
- 推荐问题里增加了“布洛芬缓释胶囊怎么吃？”这个例子，方便快速测试。

## 行为规则

- 如果问题明显在问药品如何服用，会优先进入 `medicine_usage`。
- 如果问题是在问“家里有哪些药”，仍然走 `medicine_query`。
- 如果查不到对应药品，会返回友好提示，不会硬编答案。

## 验证结果

- `npm run build` 通过
- `npx tsx --test features/medicine-vault/assistant-routing.test.ts features/medicine-vault/assistant-service.test.ts app/api/assistant/query/route.test.ts` 通过

## 相关文件

- `/Users/cp/Downloads/个人项目/前端/ai-medicine-vault/features/medicine-vault/assistant-routing.ts`
- `/Users/cp/Downloads/个人项目/前端/ai-medicine-vault/features/medicine-vault/assistant-service.ts`
- `/Users/cp/Downloads/个人项目/前端/ai-medicine-vault/components/medicine-vault/assistant-panel.tsx`
- `/Users/cp/Downloads/个人项目/前端/ai-medicine-vault/features/medicine-vault/assistant-routing.test.ts`
- `/Users/cp/Downloads/个人项目/前端/ai-medicine-vault/features/medicine-vault/assistant-service.test.ts`
- `/Users/cp/Downloads/个人项目/前端/ai-medicine-vault/app/api/assistant/query/route.test.ts`

## 后续可继续的方向

- 把“药品相互作用 / 不能同服”也做成一个独立意图。
- 把用药说明页面和药品详情页再连紧一点，支持一键跳转查看。
