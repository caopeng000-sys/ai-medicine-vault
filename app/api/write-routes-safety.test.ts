import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { createAllergiesHandler } from "./allergies/route"
import { createAssistantQueryHandler } from "./assistant/query/route"
import { createMedicineImageHandler } from "./medicines/[medicineId]/image/route"
import { createMedicineDetailHandlers } from "./medicines/[medicineId]/route"
import { createMedicinesHandler } from "./medicines/route"
import { createMemberDetailHandlers } from "./members/[memberId]/route"
import { createMembersHandler } from "./members/route"
import { createRecordsHandler } from "./records/route"

type RouteHandler = (request: Request) => Promise<Response>

const AUTH_ERROR = new Error("未登录，已拒绝访问家庭健康资料。")
const INTERNAL_ERROR = new Error("DATABASE_URL=secret stack trace")

function createJsonRequest(body: unknown) {
  return new Request("http://localhost/api/test", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
}

function createGetRequest(url: string) {
  return new Request(url, { method: "GET" })
}

async function readPayload(response: Response) {
  return (await response.json()) as { message: string; data?: unknown }
}

function runUnauthorizedScenario(createHandler: (getContext: () => Promise<{ userId: string }>) => RouteHandler) {
  return async () => {
    const handler = createHandler(async () => {
      throw AUTH_ERROR
    })

    const response = await handler(createJsonRequest({}))
    const payload = await readPayload(response)

    assert.equal(response.status, 401)
    assert.match(payload.message, /请先登录|拒绝访问/)
  }
}

function runInternalErrorScenario(
  createHandler: (
    createFn: (...args: unknown[]) => Promise<unknown>,
    getContext: () => Promise<{ userId: string }>,
  ) => RouteHandler,
  body: unknown,
) {
  return async () => {
    const handler = createHandler(
      async () => {
        throw INTERNAL_ERROR
      },
      async () => ({ userId: "user-1" }),
    )

    const response = await handler(createJsonRequest(body))
    const payload = await readPayload(response)

    assert.equal(response.status, 500)
    assert.doesNotMatch(payload.message, /DATABASE_URL|stack trace|secret/)
  }
}

describe("write route safety hardening", () => {
  describe("members route", () => {
    it("returns 401 when unauthenticated", runUnauthorizedScenario((getContext) => createMembersHandler(undefined, getContext)))

    it("returns 400 for zod validation failures", async () => {
      const handler = createMembersHandler(undefined, async () => ({ userId: "user-1" }))

      const response = await handler(
        createJsonRequest({ name: "", relationship: "", gender: "", birthYear: "", note: "" }),
      )
      const payload = await readPayload(response)

      assert.equal(response.status, 400)
      assert.match(payload.message, /请填写成员姓名|成员关系|成员性别|出生年份/)
    })

    it(
      "returns 500 for internal errors without leaking details",
      runInternalErrorScenario(
        (createFn, getContext) => createMembersHandler(createFn as never, getContext),
        { name: "张三", relationship: "本人", gender: "男", birthYear: "1990", note: "" },
      ),
    )
  })

  describe("records route", () => {
    it("returns 401 when unauthenticated", runUnauthorizedScenario((getContext) => createRecordsHandler(undefined, getContext)))

    it("returns 400 for zod validation failures", async () => {
      const handler = createRecordsHandler(undefined, async () => ({ userId: "user-1" }))

      const response = await handler(
        createJsonRequest({
          memberId: "",
          visitedAt: "",
          hospital: "",
          diagnosis: "",
          symptoms: "",
          advice: "",
        }),
      )
      const payload = await readPayload(response)

      assert.equal(response.status, 400)
      assert.match(payload.message, /缺少成员信息|请填写就诊日期|医院与科室|诊断结论|症状描述|医生建议/)
    })

    it(
      "keeps member ownership errors as 400",
      async () => {
        const handler = createRecordsHandler(
          async () => {
            throw new Error("成员不存在或不属于当前用户。")
          },
          async () => ({ userId: "user-1" }),
        )

        const response = await handler(
          createJsonRequest({
            memberId: "member-1",
            visitedAt: "2026-04-29",
            hospital: "协和医院/内科",
            diagnosis: "感冒",
            symptoms: "发热",
            advice: "多喝水",
          }),
        )
        const payload = await readPayload(response)

        assert.equal(response.status, 400)
        assert.equal(payload.message, "成员不存在或不属于当前用户。")
      },
    )

    it(
      "returns 500 for internal errors without leaking details",
      runInternalErrorScenario(
        (createFn, getContext) => createRecordsHandler(createFn as never, getContext),
        {
          memberId: "member-1",
          visitedAt: "2026-04-29",
          hospital: "协和医院/内科",
          diagnosis: "感冒",
          symptoms: "发热",
          advice: "多喝水",
        },
      ),
    )
  })

  describe("allergies route", () => {
    it(
      "returns 401 when unauthenticated",
      runUnauthorizedScenario((getContext) => createAllergiesHandler(undefined, getContext)),
    )

    it("returns 400 for zod validation failures", async () => {
      const handler = createAllergiesHandler(undefined, async () => ({ userId: "user-1" }))

      const response = await handler(
        createJsonRequest({
          memberId: "",
          allergen: "",
          discoveredAt: "",
          severity: "",
          reaction: "",
          note: "",
        }),
      )
      const payload = await readPayload(response)

      assert.equal(response.status, 400)
      assert.match(payload.message, /缺少成员信息|请填写过敏原|请填写发现时间|严重程度|请填写反应描述/)
    })

    it(
      "keeps member ownership errors as 400",
      async () => {
        const handler = createAllergiesHandler(
          async () => {
            throw new Error("成员不存在或不属于当前用户。")
          },
          async () => ({ userId: "user-1" }),
        )

        const response = await handler(
          createJsonRequest({
            memberId: "member-1",
            allergen: "花生",
            discoveredAt: "2026-04-29",
            severity: "轻微",
            reaction: "起疹",
            note: "",
          }),
        )
        const payload = await readPayload(response)

        assert.equal(response.status, 400)
        assert.equal(payload.message, "成员不存在或不属于当前用户。")
      },
    )

    it(
      "returns 500 for internal errors without leaking details",
      runInternalErrorScenario(
        (createFn, getContext) => createAllergiesHandler(createFn as never, getContext),
        {
          memberId: "member-1",
          allergen: "花生",
          discoveredAt: "2026-04-29",
          severity: "轻微",
          reaction: "起疹",
          note: "",
        },
      ),
    )
  })

  describe("medicines route", () => {
    it("returns 401 when unauthenticated", runUnauthorizedScenario((getContext) => createMedicinesHandler(undefined, getContext)))

    it("returns 400 for zod validation failures", async () => {
      const handler = createMedicinesHandler(undefined, async () => ({ userId: "user-1" }))

      const response = await handler(
        createJsonRequest({
          memberId: "",
          name: "",
          category: "",
          dosage: "",
          specification: "",
          quantity: "",
          storageLocation: "",
          expiresAt: "",
          instructions: "",
          purpose: "",
          usageNote: "",
          safetyNote: "",
        }),
      )
      const payload = await readPayload(response)

      assert.equal(response.status, 400)
      assert.match(payload.message, /缺少成员信息|请填写药品名称|请填写药品分类|请填写剂量/)
    })

    it(
      "keeps member ownership errors as 400",
      async () => {
        const handler = createMedicinesHandler(
          async () => {
            throw new Error("成员不存在或不属于当前用户。")
          },
          async () => ({ userId: "user-1" }),
        )

        const response = await handler(
          createJsonRequest({
            memberId: "member-1",
            name: "阿司匹林",
            category: "止痛药",
            dosage: "100mg",
            specification: "片剂",
            quantity: "",
            storageLocation: "",
            expiresAt: "2026-12-31",
            instructions: "每日一次",
            purpose: "止痛",
            usageNote: "",
            safetyNote: "",
          }),
        )
        const payload = await readPayload(response)

        assert.equal(response.status, 400)
        assert.equal(payload.message, "成员不存在或不属于当前用户。")
      },
    )

    it(
      "returns 500 for internal errors without leaking details",
      runInternalErrorScenario(
        (createFn, getContext) => createMedicinesHandler(createFn as never, getContext),
        {
          memberId: "member-1",
          name: "阿司匹林",
          category: "止痛药",
          dosage: "100mg",
          specification: "片剂",
          quantity: "",
          storageLocation: "",
          expiresAt: "2026-12-31",
          instructions: "每日一次",
          purpose: "止痛",
          usageNote: "",
          safetyNote: "",
        },
      ),
    )
  })

  describe("member detail routes", () => {
    const context = { params: Promise.resolve({ memberId: "member-1" }) }

    it("returns 401 for unauthenticated member updates", async () => {
      const { PATCH } = createMemberDetailHandlers({
        getContext: async () => {
          throw AUTH_ERROR
        },
      })

      const response = await PATCH(
        createJsonRequest({
          name: "张三",
          relationship: "本人",
          gender: "男",
          birthYear: "1990",
          note: "",
        }),
        context as Parameters<typeof PATCH>[1],
      )
      const payload = await readPayload(response)

      assert.equal(response.status, 401)
      assert.match(payload.message, /请先登录|拒绝访问/)
    })

    it("returns 400 for invalid member update payloads", async () => {
      const { PATCH } = createMemberDetailHandlers({
        getContext: async () => ({ userId: "user-1" }),
        getMemberById: async () => ({
          id: "member-1",
          userId: "user-1",
          name: "张三",
          relationship: "本人",
          birthYear: 1990,
          gender: "男",
          allergySummary: "",
          note: "",
        }),
      })

      const response = await PATCH(
        createJsonRequest({ name: "", relationship: "", gender: "", birthYear: "", note: "" }),
        context as Parameters<typeof PATCH>[1],
      )
      const payload = await readPayload(response)

      assert.equal(response.status, 400)
      assert.match(payload.message, /请填写成员姓名|成员关系|成员性别|出生年份/)
    })

    it("returns 500 for member delete failures without leaking details", async () => {
      const { DELETE } = createMemberDetailHandlers({
        getContext: async () => ({ userId: "user-1" }),
        getMemberById: async () => ({
          id: "member-1",
          userId: "user-1",
          name: "张三",
          relationship: "本人",
          birthYear: 1990,
          gender: "男",
          allergySummary: "",
          note: "",
        }),
        deleteMember: async () => {
          throw INTERNAL_ERROR
        },
      })

      const response = await DELETE(createJsonRequest({}), context as Parameters<typeof DELETE>[1])
      const payload = await readPayload(response)

      assert.equal(response.status, 500)
      assert.doesNotMatch(payload.message, /DATABASE_URL|stack trace|secret/)
    })
  })

  describe("medicine detail routes", () => {
    const context = { params: Promise.resolve({ medicineId: "medicine-1" }) }

    it("returns 401 for unauthenticated medicine deletes", async () => {
      const { DELETE } = createMedicineDetailHandlers({
        getContext: async () => {
          throw AUTH_ERROR
        },
      })

      const response = await DELETE(createJsonRequest({}), context as Parameters<typeof DELETE>[1])
      const payload = await readPayload(response)

      assert.equal(response.status, 401)
      assert.match(payload.message, /请先登录|拒绝访问/)
    })

    it("returns 400 for member ownership errors during medicine updates", async () => {
      const { PATCH } = createMedicineDetailHandlers({
        getContext: async () => ({ userId: "user-1" }),
        getMedicineById: async () => ({
          id: "medicine-1",
          userId: "user-1",
          memberId: "member-1",
          name: "阿司匹林",
          category: "止痛药",
          dosage: "100mg",
          instructions: "每日一次",
          purpose: "止痛",
          specification: "片剂",
          quantity: "1 盒",
          expiresAt: "2026-12-31",
          storageLocation: "药柜",
          usageNote: "",
          safetyNote: "",
          hasImage: false,
        }),
        parseMedicineSubmission: async () => ({
          input: {
            memberId: "member-1",
            name: "阿司匹林",
            category: "止痛药",
            dosage: "100mg",
            specification: "片剂",
            quantity: "1 盒",
            storageLocation: "药柜",
            expiresAt: "2026-12-31",
            instructions: "每日一次",
            purpose: "止痛",
            usageNote: "",
            safetyNote: "",
          },
        }),
        updateMedicine: async () => {
          throw new Error("成员不存在或不属于当前用户。")
        },
      })

      const response = await PATCH(createJsonRequest({}), context as Parameters<typeof PATCH>[1])
      const payload = await readPayload(response)

      assert.equal(response.status, 400)
      assert.equal(payload.message, "成员不存在或不属于当前用户。")
    })

    it("returns 500 for medicine delete failures without leaking details", async () => {
      const { DELETE } = createMedicineDetailHandlers({
        getContext: async () => ({ userId: "user-1" }),
        getMedicineById: async () => ({
          id: "medicine-1",
          userId: "user-1",
          memberId: "member-1",
          name: "阿司匹林",
          category: "止痛药",
          dosage: "100mg",
          instructions: "每日一次",
          purpose: "止痛",
          specification: "片剂",
          quantity: "1 盒",
          expiresAt: "2026-12-31",
          storageLocation: "药柜",
          usageNote: "",
          safetyNote: "",
          hasImage: false,
        }),
        deleteMedicine: async () => {
          throw INTERNAL_ERROR
        },
      })

      const response = await DELETE(createJsonRequest({}), context as Parameters<typeof DELETE>[1])
      const payload = await readPayload(response)

      assert.equal(response.status, 500)
      assert.doesNotMatch(payload.message, /DATABASE_URL|stack trace|secret/)
    })
  })

  describe("medicine image route", () => {
    it("returns 401 when the medicine image is requested without a session", async () => {
      const handler = createMedicineImageHandler({
        getContext: async () => {
          throw AUTH_ERROR
        },
      })

      const response = await handler(
        createGetRequest("http://localhost/api/medicines/medicine-1/image"),
        { params: Promise.resolve({ medicineId: "medicine-1" }) },
      )
      const payload = await readPayload(response)

      assert.equal(response.status, 401)
      assert.match(payload.message, /请先登录|拒绝访问/)
    })

    it("returns 500 for image loading failures without leaking details", async () => {
      const handler = createMedicineImageHandler({
        getContext: async () => ({ userId: "user-1" }),
        getMedicineImageById: async () => {
          throw INTERNAL_ERROR
        },
      })

      const response = await handler(
        createGetRequest("http://localhost/api/medicines/medicine-1/image"),
        { params: Promise.resolve({ medicineId: "medicine-1" }) },
      )
      const payload = await readPayload(response)

      assert.equal(response.status, 500)
      assert.doesNotMatch(payload.message, /DATABASE_URL|stack trace|secret/)
    })
  })

  describe("assistant query route", () => {
    it("returns 401 when unauthenticated", async () => {
      const handler = createAssistantQueryHandler(
        async () => ({
          intent: "unsupported",
          answer: "",
          message: "不会被调用",
          sources: [],
        }),
        async () => {
          throw AUTH_ERROR
        },
      )

      const response = await handler(
        new Request("http://localhost/api/assistant/query", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ question: "家里有哪些药" }),
        }),
      )
      const payload = (await response.json()) as { message: string }

      assert.equal(response.status, 401)
      assert.match(payload.message, /请先登录|拒绝访问/)
    })

    it("returns a friendly validation error for malformed JSON", async () => {
      const handler = createAssistantQueryHandler(
        async () => ({
          intent: "unsupported",
          answer: "",
          message: "不会被调用",
          sources: [],
        }),
        async () => ({ userId: "user-1" }),
      )

      const response = await handler(
        new Request("http://localhost/api/assistant/query", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: "{",
        }),
      )
      const payload = (await response.json()) as { message: string }

      assert.equal(response.status, 400)
      assert.equal(payload.message, "请求参数格式不正确。")
    })
  })
})
