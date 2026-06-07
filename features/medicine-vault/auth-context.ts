import { UnauthorizedError } from "./api-errors"

export type RepositoryContext = Readonly<{
  userId: string
}>

export type CurrentUser = Readonly<{
  id: string
  name: string
  email?: string
}>

export const DEFAULT_DEVELOPMENT_USER: CurrentUser = {
  id: "user-development",
  name: "开发环境用户",
  email: "dev@medicine-vault.local",
}

type AuthSession = Readonly<{
  user?: Readonly<{
    id?: string
    name?: string | null
    email?: string | null
  }>
}> | null

type SessionReader = () => Promise<AuthSession>

let sessionReaderOverride: SessionReader | null = null

export function __setSessionReaderForTests(reader: SessionReader | null) {
  sessionReaderOverride = reader
}

function isProduction() {
  return process.env.NODE_ENV === "production"
}

async function readAuthSession(): Promise<AuthSession> {
  if (sessionReaderOverride) {
    return sessionReaderOverride()
  }

  const { auth } = await import("@/auth")
  return auth()
}

function mapSessionUser(session: AuthSession): CurrentUser | null {
  const userId = session?.user?.id

  if (!userId) {
    return null
  }

  return {
    id: userId,
    name: session.user?.name?.trim() || "用户",
    email: session.user?.email ?? undefined,
  }
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const sessionUser = mapSessionUser(await readAuthSession())

  if (sessionUser) {
    return sessionUser
  }

  if (!isProduction()) {
    return DEFAULT_DEVELOPMENT_USER
  }

  return null
}

export async function requireCurrentUser(): Promise<RepositoryContext> {
  const user = await getCurrentUser()

  if (!user) {
    throw new UnauthorizedError()
  }

  return { userId: user.id }
}
