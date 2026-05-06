import { expect, test } from "@playwright/test"

test.describe("medicine management regression", () => {
  test("searches real medicine data and keeps inline images visible", async ({ page }) => {
    await page.goto("/medicines")

    await page.getByPlaceholder("搜索药品名称、成分、用途...").fill("布洛芬")
    await page.getByRole("button", { name: "搜索" }).click()

    await expect(page.getByText("布洛芬缓释胶囊")).toBeVisible()
    await expect(page.getByText("当前正在搜索 “布洛芬”。")).toBeVisible()
    await expect(page.getByText("已保存图片")).toBeVisible()

    const image = page.getByAltText(/布洛芬缓释胶囊/)
    await expect(image).toBeVisible()
    await expect(image).toHaveAttribute("src", /\/api\/medicines\/.*\/image/)
  })

  test("opens edit dialog with the existing medicine values prefilled", async ({ page }) => {
    await page.goto("/medicines?q=%E5%B8%83%E6%B4%9B%E8%8A%AC")

    const card = page.locator("article, div").filter({ hasText: "布洛芬缓释胶囊" }).first()
    await card.getByRole("button", { name: "编辑" }).click()

    await expect(page.getByRole("dialog")).toBeVisible()
    await expect(page.getByLabel("药品名称")).toHaveValue("布洛芬缓释胶囊")
    await expect(page.getByLabel("分类")).toHaveValue("止痛退烧")
    await expect(page.getByLabel("剂量")).toHaveValue(/0\.3g/)
    await expect(page.getByLabel("使用说明")).not.toHaveValue("")

    await page.getByRole("button", { name: "取消" }).click()
    await expect(page.getByRole("dialog")).toBeHidden()
  })

  test("shows json and csv export links in the shell", async ({ page }) => {
    await page.goto("/medicines")

    await expect(page.getByRole("link", { name: "导出 JSON" })).toHaveAttribute("href", "/api/export?format=json")
    await expect(page.getByRole("link", { name: "导出 CSV" })).toHaveAttribute("href", "/api/export?format=csv")
  })
})
