import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"

declare global {
  var __prisma: PrismaClient | undefined
}

function resolveDatabaseUrl() {
  const url = process.env.DATABASE_URL?.trim()

  if (!url) {
    return null
  }

  if (url.includes("johndoe:randompassword") || url.includes("localhost:5432/mydb")) {
    return null
  }

  return url
}

export function getPrismaClient() {
  const databaseUrl = resolveDatabaseUrl()

  if (!databaseUrl) {
    return null
  }

  try {
    if (!globalThis.__prisma) {
      globalThis.__prisma = new PrismaClient({
        adapter: new PrismaPg({ connectionString: databaseUrl }),
      })
    }
  } catch {
    return null
  }

  return globalThis.__prisma
}
