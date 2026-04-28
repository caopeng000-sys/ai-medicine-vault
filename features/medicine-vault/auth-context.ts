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

function isProduction() {
  return process.env.NODE_ENV === "production"
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (isProduction()) {
    return null
  }

  return DEFAULT_DEVELOPMENT_USER
}

export async function requireCurrentUser(): Promise<RepositoryContext> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error("生产环境缺少真实登录会话，已拒绝访问家庭健康资料。请先接入 Auth.js session。")
  }

  return { userId: user.id }
}
