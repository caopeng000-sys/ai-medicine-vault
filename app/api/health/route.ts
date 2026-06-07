import { NextResponse } from "next/server"

import { getPrismaClient } from "@/lib/db"
import { isObjectStorageConfigured } from "@/lib/storage/object-storage"

export const dynamic = "force-dynamic"

export async function GET() {
  const checks = {
    databaseConfigured: Boolean(process.env.DATABASE_URL?.trim()),
    databaseConnected: false,
    authConfigured: Boolean(process.env.AUTH_SECRET?.trim()),
    githubOAuthConfigured: Boolean(process.env.GITHUB_ID?.trim() && process.env.GITHUB_SECRET?.trim()),
    dashscopeConfigured: Boolean(process.env.DASHSCOPE_API_KEY?.trim()),
    objectStorageConfigured: isObjectStorageConfigured(),
  }

  const prisma = getPrismaClient()

  if (prisma) {
    try {
      await prisma.$queryRaw`SELECT 1`
      checks.databaseConnected = true
    } catch {
      checks.databaseConnected = false
    }
  }

  const ok =
    checks.databaseConfigured &&
    checks.databaseConnected &&
    checks.authConfigured &&
    checks.githubOAuthConfigured &&
    checks.dashscopeConfigured

  return NextResponse.json(
    {
      status: ok ? "ok" : "degraded",
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: ok ? 200 : 503 },
  )
}
