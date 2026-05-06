import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { createExportHandler } from "./route"

describe("export route", () => {
  const fixedNow = () => new Date("2026-04-29T08:30:00.000Z")

  it("exports the current user's health vault data as JSON by default", async () => {
    const handler = createExportHandler(
      {
        listMembers: async () => [
          {
            id: "member-1",
            userId: "user-current",
            name: "曹鹏",
            relationship: "本人",
            birthYear: 1990,
            gender: "男",
            allergySummary: "青霉素过敏",
            note: "",
          },
        ],
        listMedicalRecords: async () => [],
        listMedicines: async () => [],
        listAllergyRecords: async () => [],
      },
      async () => ({ userId: "user-current" }),
      fixedNow,
    )

    const response = await handler(new Request("http://localhost/api/export"))
    const payload = (await response.json()) as {
      exportedAt: string
      userId: string
      data: { members: Array<{ userId: string; name: string }> }
    }

    assert.equal(response.status, 200)
    assert.equal(response.headers.get("Content-Type"), "application/json")
    assert.equal(payload.userId, "user-current")
    assert.equal(payload.data.members[0]?.userId, "user-current")
    assert.equal(
      response.headers.get("Content-Disposition"),
      'attachment; filename="medicine-vault-user-current-2026-04-29.json"',
    )
    assert.equal(payload.exportedAt, "2026-04-29T08:30:00.000Z")
  })

  it("exports only the selected member's data when memberId is provided", async () => {
    const handler = createExportHandler(
      {
        getMemberById: async (_ctx, memberId) =>
          memberId === "member-1"
            ? {
                id: "member-1",
                userId: "user-current",
                name: "曹鹏",
                relationship: "本人",
                birthYear: 1990,
                gender: "男",
                allergySummary: "青霉素过敏",
                note: "晨间记录",
              }
            : undefined,
        listMembers: async () => [
          {
            id: "member-1",
            userId: "user-current",
            name: "曹鹏",
            relationship: "本人",
            birthYear: 1990,
            gender: "男",
            allergySummary: "青霉素过敏",
            note: "晨间记录",
          },
          {
            id: "member-2",
            userId: "user-current",
            name: "李梅",
            relationship: "配偶",
            birthYear: 1991,
            gender: "女",
            allergySummary: "暂无",
            note: "",
          },
        ],
        listMedicalRecords: async (_ctx, memberId) =>
          [
            {
              id: "record-1",
              userId: "user-current",
              memberId: "member-1",
              visitedAt: "2026-04-28",
              hospitalName: "协和医院",
              department: "内科",
              symptoms: "感冒",
              diagnosis: "上呼吸道感染",
              doctorAdvice: "多喝水",
              prescriptionNote: "",
              note: "",
            },
            {
              id: "record-2",
              userId: "user-current",
              memberId: "member-2",
              visitedAt: "2026-04-27",
              hospitalName: "协和医院",
              department: "皮肤科",
              symptoms: "皮疹",
              diagnosis: "过敏",
              doctorAdvice: "观察",
              prescriptionNote: "",
              note: "",
            },
          ].filter((record) => (memberId ? record.memberId === memberId : true)),
        listMedicines: async (_ctx, memberId) =>
          [
            {
              id: "medicine-1",
              userId: "user-current",
              memberId: "member-1",
              name: "布洛芬",
              category: "止痛退烧",
              dosage: "0.3g",
              instructions: "必要时使用",
              purpose: "缓解疼痛",
              specification: "12 片",
              quantity: "1 盒",
              expiresAt: "2027-05-01",
              storageLocation: "客厅药箱",
              usageNote: "饭后",
              safetyNote: "避免重复用药",
              hasImage: false,
            },
            {
              id: "medicine-2",
              userId: "user-current",
              memberId: "member-2",
              name: "氯雷他定",
              category: "抗过敏",
              dosage: "10mg",
              instructions: "每日一次",
              purpose: "缓解过敏",
              specification: "12 片",
              quantity: "1 盒",
              expiresAt: "2027-06-01",
              storageLocation: "卧室抽屉",
              usageNote: "饭后",
              safetyNote: "避免超量",
              hasImage: false,
            },
          ].filter((medicine) => (memberId ? medicine.memberId === memberId : true)),
        listAllergyRecords: async (_ctx, memberId) =>
          [
            {
              id: "allergy-1",
              userId: "user-current",
              memberId: "member-1",
              allergen: "青霉素",
              reaction: "皮疹",
              severity: "轻微",
              discoveredAt: "2026-04-01",
              note: "",
            },
            {
              id: "allergy-2",
              userId: "user-current",
              memberId: "member-2",
              allergen: "海鲜",
              reaction: "过敏",
              severity: "中等",
              discoveredAt: "2026-04-02",
              note: "",
            },
          ].filter((record) => (memberId ? record.memberId === memberId : true)),
      },
      async () => ({ userId: "user-current" }),
      fixedNow,
    )

    const response = await handler(new Request("http://localhost/api/export?format=json&memberId=member-1"))
    const payload = JSON.parse(await response.text()) as {
      exportedAt: string
      userId: string
      data: {
        members: Array<{ id: string; name: string }>
        medicalRecords: Array<{ memberId: string }>
        medicines: Array<{ memberId: string }>
        allergyRecords: Array<{ memberId: string }>
      }
    }

    assert.equal(response.status, 200)
    assert.equal(payload.userId, "user-current")
    assert.deepEqual(payload.data.members.map((item) => item.id), ["member-1"])
    assert.deepEqual(payload.data.medicalRecords.map((item) => item.memberId), ["member-1"])
    assert.deepEqual(payload.data.medicines.map((item) => item.memberId), ["member-1"])
    assert.deepEqual(payload.data.allergyRecords.map((item) => item.memberId), ["member-1"])
  })

  it("exports CSV when format=csv is requested", async () => {
    const handler = createExportHandler(
      {
        listMembers: async () => [
          {
            id: "member-1",
            userId: "user-current",
            name: "曹鹏",
            relationship: "本人",
            birthYear: 1990,
            gender: "男",
            allergySummary: "青霉素过敏",
            note: "晨间记录",
          },
        ],
        listMedicalRecords: async () => [],
        listMedicines: async () => [
          {
            id: "medicine-1",
            userId: "user-current",
            memberId: "member-1",
            name: "布洛芬",
            category: "止痛退烧",
            dosage: "0.3g",
            instructions: "必要时使用",
            purpose: "缓解疼痛",
            specification: "12 片",
            quantity: "1 盒",
            expiresAt: "2027-05-01",
            storageLocation: "客厅药箱",
            usageNote: "饭后",
            safetyNote: "避免重复用药",
            hasImage: false,
          },
        ],
        listAllergyRecords: async () => [],
      },
      async () => ({ userId: "user-current" }),
      fixedNow,
    )

    const response = await handler(new Request("http://localhost/api/export?format=csv"))
    const csv = await response.text()

    assert.equal(response.status, 200)
    assert.equal(response.headers.get("Content-Type"), "text/csv; charset=utf-8")
    assert.equal(
      response.headers.get("Content-Disposition"),
      'attachment; filename="medicine-vault-user-current-2026-04-29.csv"',
    )
    assert.match(csv, /section,id,userId,name,relationship/)
    assert.match(csv, /members,member-1,user-current,曹鹏,本人/)
    assert.match(csv, /medicines,medicine-1,user-current,布洛芬/)
    assert.match(csv, /exportedAt,2026-04-29T08:30:00.000Z/)
  })

  it("returns a 404 when memberId does not belong to the current user", async () => {
    const handler = createExportHandler(
      {
        getMemberById: async () => undefined,
        listMembers: async () => [],
        listMedicalRecords: async () => [],
        listMedicines: async () => [],
        listAllergyRecords: async () => [],
      },
      async () => ({ userId: "user-current" }),
      fixedNow,
    )

    const response = await handler(new Request("http://localhost/api/export?format=json&memberId=member-missing"))
    const payload = (await response.json()) as { message: string }

    assert.equal(response.status, 404)
    assert.equal(payload.message, "成员不存在。")
  })

  it("returns a validation error for unsupported export formats", async () => {
    const handler = createExportHandler(
      {
        listMembers: async () => [],
        listMedicalRecords: async () => [],
        listMedicines: async () => [],
        listAllergyRecords: async () => [],
      },
      async () => ({ userId: "user-current" }),
      fixedNow,
    )

    const response = await handler(new Request("http://localhost/api/export?format=xml"))
    const payload = (await response.json()) as { message: string }

    assert.equal(response.status, 400)
    assert.equal(payload.message, "暂不支持该导出格式，请使用 json 或 csv。")
  })
})
