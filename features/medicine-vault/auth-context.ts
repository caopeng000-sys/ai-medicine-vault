export type RepositoryContext = Readonly<{
  userId: string
}>

export type CurrentUser = Readonly<{
  id: string
  name: string
  email?: string
  image?: string
}>

type AuthSession = Readonly<{
  user?: Readonly<{
    id?: string | null
    name?: string | null
    email?: string | null
    image?: string | null
  }>
}>

type AuthContextOptions = Readonly<{
  readSession?: () => Promise<AuthSession | null>
}>

export const DEFAULT_DEVELOPMENT_USER: CurrentUser = {
  id: "user-development",
  name: "开发环境用户",
  email: "dev@medicine-vault.local",
}

export class UnauthorizedError extends Error {
  readonly status = 401

  constructor(message = "未登录，已拒绝访问家庭健康资料。") {
    super(message)
    this.name = "UnauthorizedError"
  }
}

function isProduction() {
  return process.env.NODE_ENV === "production"
}

function shouldAllowDevelopmentFallback() {
  return process.env.PLAYWRIGHT_E2E === "1" || process.env.NODE_ENV !== "production"
}

function mapSessionUser(session: AuthSession | null): CurrentUser | null {
  const sessionUser = session?.user
  const id = sessionUser?.id?.trim()

  if (!sessionUser || !id) {
    return null
  }

  return {
    id,
    name: sessionUser.name?.trim() || sessionUser.email?.trim() || "已登录用户",
    ...(sessionUser.email ? { email: sessionUser.email } : {}),
    ...(sessionUser.image ? { image: sessionUser.image } : {}),
  }
}

async function readAuthSession() {
  const { auth } = await import("../../auth")

  return auth()
}

export function createAuthContext(options: AuthContextOptions = {}) {
  const readSession = options.readSession ?? readAuthSession

  return {
    async getCurrentUser(): Promise<CurrentUser | null> {
      try {
        const user = mapSessionUser(await readSession())

        if (user) {
          return user
        }
      } catch (error) {
        if (isProduction()) {
          throw new UnauthorizedError("无法读取登录会话，已拒绝访问家庭健康资料。")
        }
      }

      if (!shouldAllowDevelopmentFallback()) {
        return null
      }

      return DEFAULT_DEVELOPMENT_USER
    },

    async requireCurrentUser(): Promise<RepositoryContext> {
      const user = await this.getCurrentUser()

      if (!user) {
        throw new UnauthorizedError()
      }

      return { userId: user.id }
    },
  }
}

const defaultAuthContext = createAuthContext()

export async function getCurrentUser(): Promise<CurrentUser | null> {
  return defaultAuthContext.getCurrentUser()
}

export async function requireCurrentUser(): Promise<RepositoryContext> {
  return defaultAuthContext.requireCurrentUser()
}
