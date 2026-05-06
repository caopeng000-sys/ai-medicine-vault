# Task 01 API Safety Hardening

## 做了什么

- 将以下 4 个写接口统一接入现有 `features/medicine-vault/api-errors.ts` 的错误响应模式：
  - `POST /api/allergies`
  - `POST /api/medicines`
  - `POST /api/members`
  - `POST /api/records`
- 为每个 route 增加了可注入的 `create...Handler` 工厂，便于在不修改其他 route 的前提下做精确测试。
- 统一了三类核心错误返回：
  - 未登录：`401`
  - Zod 参数校验失败：`400`
  - 内部错误：`500`，且不透出堆栈或敏感信息
- 保留了现有业务校验行为：
  - 当仓储层返回“成员不存在或不属于当前用户。”时，仍然返回 `400`

## 覆盖接口

### `app/api/allergies/route.ts`

- 成功创建保持原样
- 未登录改为统一 `401`
- `createAllergyRecordSchema` 校验失败改为统一 `400`
- 仓储层成员归属错误保持 `400`
- 其他异常改为统一 `500`

### `app/api/medicines/route.ts`

- 成功创建保持原样
- 未登录改为统一 `401`
- `parseMedicineSubmission` / `createMedicineSchema` 校验失败统一为 `400`
- 仓储层成员归属错误保持 `400`
- 其他异常改为统一 `500`
- 对明显的 JSON 解析异常返回 `400` 通用提示，避免将请求体格式错误误判为服务内部故障

### `app/api/members/route.ts`

- 成功创建保持原样
- 未登录改为统一 `401`
- `createMemberSchema` 校验失败改为统一 `400`
- 其他异常改为统一 `500`

### `app/api/records/route.ts`

- 成功创建保持原样
- 未登录改为统一 `401`
- `createMedicalRecordSchema` 校验失败改为统一 `400`
- 仓储层成员归属错误保持 `400`
- 其他异常改为统一 `500`

## 新增测试

新增测试文件：

- `app/api/write-routes-safety.test.ts`

覆盖点：

- 4 个接口未登录返回 `401`
- 4 个接口 Zod 校验失败返回 `400`
- 4 个接口内部错误返回 `500` 且不泄露敏感信息
- `allergies` / `medicines` / `records` 的成员归属业务错误继续返回 `400`

## 如何验证

已执行：

```bash
npx tsx --test app/api/write-routes-safety.test.ts
npx tsx --test "app/api/**/*.test.ts"
```

结果：

- 新增安全测试：15/15 通过
- `app/api` 相关测试：24/24 通过

## 剩余限制

- 这次只处理了你指定的 4 个写接口；`members/[memberId]`、`medicines/[medicineId]` 等其他写接口仍保留各自原有错误处理逻辑。
- 由于写入范围受限，没有修改 `features/medicine-vault/api-errors.ts` 本身，因此“成员归属错误保持 400”的分类逻辑目前仍放在各自 route 内部。
- `medicines` 路由当前对 JSON 解析异常采用字符串特征判断；如果后续要把请求体格式错误完全标准化，最好在公共错误层再统一收口。
