import path from "node:path"

import { expect, test, type Page } from "@playwright/test"

import { resetMedicineVaultTestData } from "./helpers/test-db"

async function searchMedicine(page: Page, keyword: string) {
  const searchBox = page.getByRole("searchbox")
  await searchBox.fill(keyword)
  await page.getByRole("button", { name: "搜索" }).click()
}

test.beforeEach(async () => {
  await resetMedicineVaultTestData()
})

test("opens the medicines page and searches seeded data", async ({ page }) => {
  await page.goto("/medicines")

  await expect(page.getByRole("heading", { name: "药物管理" })).toBeVisible()
  await expect(page.getByText("2 条药品记录")).toBeVisible()

  await searchMedicine(page, "布洛芬")
  await expect(page).toHaveURL(/\/medicines\?(?:.*&)?q=%E5%B8%83%E6%B4%9B%E8%8A%AC(?:&.*)?/)
  await expect(page.getByText("布洛芬缓释胶囊", { exact: true })).toBeVisible()

  await searchMedicine(page, "不存在的药名123")
  await expect(page.getByText("没有找到匹配的药品记录，请换一个关键词试试。")).toBeVisible()
})

test("adds, edits, deletes, and displays an inline medicine image", async ({ page }) => {
  const medicineName = "自动化回归测试药品A"
  const updatedQuantity = "2 盒"
  const updatedLocation = "卧室抽屉"
  const imagePath = path.resolve(process.cwd(), "docs/medicine-label-test.svg")

  await page.goto("/medicines")
  await page.getByRole("button", { name: "新增药物记录" }).click()

  await page.locator("#medicine-image").setInputFiles(imagePath)
  await expect(page.getByRole("img", { name: "medicine-label-test.svg" })).toBeVisible()

  await page.getByLabel("药品名称").fill(medicineName)
  await page.getByLabel("分类").fill("止痛退烧")
  await page.getByLabel("剂量").fill("0.1g/片")
  await page.getByLabel("规格").fill("0.1g * 10 片")
  await page.getByLabel("库存数量").fill("1 盒")
  await page.getByLabel("存放位置").fill("客厅药箱")
  await page.getByLabel("治疗疾病").fill("用于验证自动化回归")
  await page.getByLabel("有效期").fill("2027-01-31")
  await page.getByLabel("使用说明").fill("每日一次")
  await page.getByLabel("补充说明").fill("Playwright 自动化新增")
  await page.getByLabel("安全提醒").fill("仅用于自动化测试")
  await page.getByRole("button", { name: "保存药品" }).click()

  await expect(page.getByRole("dialog")).toHaveCount(0)

  await searchMedicine(page, medicineName)
  await expect(page.getByText(medicineName, { exact: true })).toBeVisible()
  await expect(page.getByText("已保存图片")).toBeVisible()
  await expect(page.getByRole("img", { name: new RegExp(medicineName) })).toBeVisible()
  await expect(page).toHaveURL(/\/medicines\?(?:.*&)?q=/)

  await page.getByRole("button", { name: "编辑" }).click()
  await page.getByLabel("库存数量").fill(updatedQuantity)
  await page.getByLabel("存放位置").fill(updatedLocation)
  await page.getByRole("button", { name: "保存修改" }).click()

  await page.reload()
  await page.getByRole("button", { name: "编辑" }).click()
  await expect(page.getByLabel("库存数量")).toHaveValue(updatedQuantity)
  await expect(page.getByLabel("存放位置")).toHaveValue(updatedLocation)
  await page.getByRole("button", { name: "取消" }).click()

  page.once("dialog", (dialog) => dialog.accept())
  await page.getByRole("button", { name: "删除" }).click()

  await expect(page.getByText(medicineName, { exact: true })).toHaveCount(0)
  await expect(page.getByText("没有找到匹配的药品记录，请换一个关键词试试。")).toBeVisible()
})
