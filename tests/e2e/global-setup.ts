import fs from "node:fs"
import path from "node:path"
import os from "node:os"
import { spawn } from "node:child_process"
import { execFileSync } from "node:child_process"
import { fileURLToPath } from "node:url"

import type { FullConfig } from "@playwright/test"

import {
  TEST_APP_PORT,
  TEST_APP_URL,
  TEST_DATABASE_NAME,
  TEST_DATABASE_PORT,
  TEST_DATABASE_URL,
  USE_EXTERNAL_TEST_DATABASE,
  resetMedicineVaultTestData,
} from "./helpers/test-db"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repositoryRoot = path.resolve(__dirname, "../..")
const tempRoot = path.join(repositoryRoot, ".tmp")
const playwrightAppRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ai-medicine-vault-e2e-"))
const postgresDataDir = path.join(tempRoot, "playwright-postgres")
const postgresLogPath = path.join(tempRoot, "playwright-postgres.log")
const nextLogPath = path.join(tempRoot, "playwright-next.log")

function runCommand(command: string, args: string[], extraEnv: Partial<NodeJS.ProcessEnv> = {}) {
  execFileSync(command, args, {
    cwd: repositoryRoot,
    env: { ...process.env, ...extraEnv },
    stdio: "inherit",
  })
}

function canConnectToPostgres() {
  try {
    execFileSync(
      "psql",
      ["-h", "127.0.0.1", "-p", String(TEST_DATABASE_PORT), "-U", "postgres", "-d", "postgres", "-tAc", "SELECT 1"],
      {
        cwd: repositoryRoot,
        env: process.env,
        stdio: "ignore",
      },
    )
    return true
  } catch {
    return false
  }
}

function ensurePostgresDataDir() {
  fs.mkdirSync(tempRoot, { recursive: true })

  if (fs.existsSync(path.join(postgresDataDir, "PG_VERSION"))) {
    return
  }

  runCommand("initdb", ["-D", postgresDataDir, "-U", "postgres", "--auth=trust"])
}

function startPostgres() {
  if (USE_EXTERNAL_TEST_DATABASE) {
    return
  }

  if (canConnectToPostgres()) {
    return
  }

  ensurePostgresDataDir()
  runCommand("pg_ctl", [
    "-D",
    postgresDataDir,
    "-l",
    postgresLogPath,
    "-o",
    `-p ${TEST_DATABASE_PORT}`,
    "start",
  ])
}

function ensureDatabaseExists() {
  if (USE_EXTERNAL_TEST_DATABASE) {
    return
  }

  const exists = execFileSync(
    "psql",
    [
      "-h",
      "127.0.0.1",
      "-p",
      String(TEST_DATABASE_PORT),
      "-U",
      "postgres",
      "-d",
      "postgres",
      "-tAc",
      `SELECT 1 FROM pg_database WHERE datname = '${TEST_DATABASE_NAME}'`,
    ],
    {
      cwd: repositoryRoot,
      env: process.env,
      encoding: "utf8",
    },
  ).trim()

  if (exists === "1") {
    return
  }

  runCommand("createdb", ["-h", "127.0.0.1", "-p", String(TEST_DATABASE_PORT), "-U", "postgres", TEST_DATABASE_NAME])
}

function preparePlaywrightAppWorkspace() {
  fs.mkdirSync(tempRoot, { recursive: true })
  fs.rmSync(playwrightAppRoot, { recursive: true, force: true })

  fs.cpSync(repositoryRoot, playwrightAppRoot, {
    recursive: true,
    filter(source) {
      const absoluteSource = path.resolve(source)
      const excludedPaths = [
        path.join(repositoryRoot, ".git"),
        path.join(repositoryRoot, ".next"),
        path.join(repositoryRoot, ".tmp"),
        path.join(repositoryRoot, "node_modules"),
        path.join(repositoryRoot, "test-results"),
      ]

      return !excludedPaths.some((excludedPath) => absoluteSource === excludedPath || absoluteSource.startsWith(`${excludedPath}${path.sep}`))
    },
  })

  const workspaceNodeModules = path.join(playwrightAppRoot, "node_modules")

  try {
    fs.cpSync(path.join(repositoryRoot, "node_modules"), workspaceNodeModules, { recursive: true })
  } catch (error) {
    throw new Error(`Failed to prepare the Playwright workspace copy at ${playwrightAppRoot}: ${String(error)}`)
  }
}

async function waitForHttp(url: string, timeoutMs: number) {
  const startedAt = Date.now()

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url)
      if (response.ok) {
        return
      }
    } catch {
      // Server is still booting.
    }

    await new Promise((resolve) => setTimeout(resolve, 1_000))
  }

  throw new Error(`Timed out waiting for ${url}`)
}

export default async function globalSetup(_config: FullConfig) {
  startPostgres()
  ensureDatabaseExists()

  runCommand("npx", ["prisma", "generate"], { DATABASE_URL: TEST_DATABASE_URL })
  runCommand("npx", ["prisma", "migrate", "deploy"], { DATABASE_URL: TEST_DATABASE_URL })
  await resetMedicineVaultTestData()
  preparePlaywrightAppWorkspace()

  const nextLog = fs.openSync(nextLogPath, "a")
  const nextProcess = spawn("npm", ["run", "dev", "--", "--hostname", "127.0.0.1", "--port", String(TEST_APP_PORT)], {
    cwd: playwrightAppRoot,
    env: {
      ...process.env,
      DATABASE_URL: TEST_DATABASE_URL,
      PORT: String(TEST_APP_PORT),
    },
    stdio: ["ignore", nextLog, nextLog],
    detached: true,
  })

  try {
    await waitForHttp(`${TEST_APP_URL}/medicines`, 90_000)
  } catch (error) {
    try {
      process.kill(-nextProcess.pid!, "SIGTERM")
    } catch {
      // Ignore teardown races.
    }

    throw error
  }

  return async () => {
    try {
      process.kill(-nextProcess.pid!, "SIGTERM")
    } catch {
      // Ignore teardown races.
    }

    if (!USE_EXTERNAL_TEST_DATABASE) {
      try {
        runCommand("pg_ctl", ["-D", postgresDataDir, "stop", "-m", "fast"])
      } catch {
        // Ignore teardown races.
      }
    }

    try {
      fs.rmSync(playwrightAppRoot, { recursive: true, force: true })
    } catch {
      // Ignore teardown races.
    }
  }
}
