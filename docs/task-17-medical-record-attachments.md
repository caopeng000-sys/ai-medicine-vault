# 任务 17：病历附件归档

## 背景

病历记录已经支持就诊日期、诊断、诊疗摘要、检查结果和复诊时间，但真实使用时，处方单、检查报告、就诊照片往往比文字更关键。本轮补齐病历附件能力，让每条病历可以关联实际文件。

## 本轮目标

- 给病历增加附件数据模型。
- 支持上传处方单、检查报告、就诊照片和 PDF。
- 附件跟随病历记录展示和访问。
- 附件文件落到本地存储目录，数据库只保存文件 key 和元数据。
- 不接入新的生产环境服务。

## 实现范围

数据库：

- 新增 `MedicalRecordAttachment` 模型。
- 新增迁移 `20260507103000_medical_record_attachments`。

存储：

- 新增 `features/medicine-vault/medical-record-attachment-storage.ts`。
- 默认存储目录为 `.tmp/medical-record-attachments`。

接口：

- `POST /api/records/[recordId]/attachments`
- `GET /api/records/[recordId]/attachments/[attachmentId]`

页面：

- 病历页增加附件总数统计。
- 每条病历卡片支持上传附件。
- 已上传附件会在病历卡片中展示，并可点击查看。
- 已上传附件支持删除。
- 图片附件上传前可调用 AI 摘要，识别检查报告、处方单或就诊照片的关键内容。

## 文件限制

当前支持：

- JPG
- PNG
- WebP
- PDF

单个附件最大 8MB。

## AI 摘要

新增接口：

- `POST /api/records/attachments/extract`

当前 AI 摘要仅支持图片附件。PDF 可以先保存归档，后续再接文本解析或 OCR 服务。AI 摘要只做资料整理，不做诊断，不替代医生判断。

## 后续可扩展

- 增加附件分类筛选。
- 增加 PDF 文本解析或 OCR。
- 后续接入对象存储后，将附件存储从本地目录切换到 OSS / R2 / S3。
