import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { Client } from "pg"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repositoryRoot = path.resolve(__dirname, "../../..")
const defaultBaseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3100"
const baseUrl = new URL(defaultBaseUrl)

export const TEST_APP_PORT = Number(baseUrl.port || process.env.PLAYWRIGHT_PORT || 3000)
export const TEST_APP_URL = defaultBaseUrl
export const TEST_DATABASE_PORT = 55432
export const TEST_DATABASE_NAME = "ai_medicine_vault_e2e"
export const TEST_DATABASE_URL = `postgresql://postgres@127.0.0.1:${TEST_DATABASE_PORT}/${TEST_DATABASE_NAME}`

const seededUserId = "user-development"
const seededMemberId = "member-cp"

async function readSeedImageBytes() {
  const imagePath = path.join(repositoryRoot, "docs", "medicine-label-test.svg")
  return fs.readFile(imagePath)
}

async function withClient<T>(callback: (client: Client) => Promise<T>) {
  const client = new Client({ connectionString: TEST_DATABASE_URL })
  await client.connect()

  try {
    return await callback(client)
  } finally {
    await client.end()
  }
}

export async function resetMedicineVaultTestData() {
  const imageBytes = await readSeedImageBytes()

  await withClient(async (client) => {
    await client.query("BEGIN")

    try {
      await client.query(`
        TRUNCATE TABLE
          "AiCallLog",
          "VisitPreparation",
          "AllergyRecord",
          "Medicine",
          "MedicalRecord",
          "Member",
          "Session",
          "Account",
          "VerificationToken",
          "User"
        RESTART IDENTITY CASCADE
      `)

      await client.query(
        `
          INSERT INTO "User" ("id", "name", "email", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, NOW(), NOW())
        `,
        [seededUserId, "开发环境用户", "dev@medicine-vault.local"],
      )

      await client.query(
        `
          INSERT INTO "Member" (
            "id",
            "userId",
            "name",
            "relationship",
            "birthYear",
            "gender",
            "allergySummary",
            "note",
            "createdAt",
            "updatedAt"
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        `,
        [seededMemberId, seededUserId, "曹鹏", "本人", 1990, "男", "暂无明确过敏摘要。", "E2E 测试成员"],
      )

      await client.query(
        `
          INSERT INTO "Medicine" (
            "id",
            "userId",
            "memberId",
            "name",
            "category",
            "dosage",
            "instructions",
            "purpose",
            "specification",
            "quantity",
            "expiresAt",
            "storageLocation",
            "usageNote",
            "safetyNote",
            "imageBytes",
            "imageMimeType",
            "imageName",
            "createdAt",
            "updatedAt"
          )
          VALUES
            (
              'medicine-ibuprofen',
              $1,
              $2,
              '布洛芬缓释胶囊',
              '止痛退烧',
              '0.3g/粒',
              '口服，按说明或医嘱使用。',
              '缓解发热、肌肉酸痛和轻中度疼痛。',
              '0.3g * 20 粒',
              '1 盒',
              DATE '2026-09-30',
              '客厅药箱',
              '发热或疼痛时查看说明并咨询医生或药师。',
              '胃部不适、重复退烧药叠加需谨慎。',
              $3,
              'image/svg+xml',
              'medicine-label-test.svg',
              NOW(),
              NOW()
            ),
            (
              'medicine-loratadine',
              $1,
              $2,
              '氯雷他定片',
              '抗过敏',
              '10mg/片',
              '口服，每次 1 片，每日 1 次。',
              '缓解过敏性鼻炎、打喷嚏和流清涕。',
              '10mg * 12 片',
              '2 盒',
              DATE '2027-02-28',
              '卧室抽屉',
              '过敏性鼻炎发作时按说明或医嘱使用。',
              '若症状持续或加重，应咨询医生。',
              NULL,
              NULL,
              NULL,
              NOW(),
              NOW()
            )
        `,
        [seededUserId, seededMemberId, imageBytes],
      )

      await client.query("COMMIT")
    } catch (error) {
      await client.query("ROLLBACK")
      throw error
    }
  })
}
