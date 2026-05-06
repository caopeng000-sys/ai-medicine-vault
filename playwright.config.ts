import { defineConfig, devices } from "@playwright/test"

import { TEST_APP_URL } from "./tests/e2e/helpers/test-db"

export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  timeout: 30_000,
  workers: 1,
  fullyParallel: false,
  expect: {
    timeout: 5_000,
  },
  reporter: "list",
  use: {
    baseURL: TEST_APP_URL,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
})
