import NextAuth from "next-auth"

import authConfig from "@/auth.config"

const { auth } = NextAuth(authConfig)

const protectedPagePrefixes = [
  "/",
  "/members",
  "/records",
  "/medicines",
  "/allergies",
  "/assistant",
  "/visit-prep",
  "/settings",
]

const protectedApiPrefixes = [
  "/api/members",
  "/api/records",
  "/api/medicines",
  "/api/allergies",
  "/api/assistant",
  "/api/search",
  "/api/visit-prep",
  "/api/health-index",
  "/api/export",
]

function isProtectedPath(pathname: string) {
  if (pathname.startsWith("/api/auth") || pathname === "/api/health") {
    return false
  }

  if (pathname === "/login" || pathname === "/privacy" || pathname === "/disclaimer") {
    return false
  }

  if (protectedApiPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return true
  }

  return protectedPagePrefixes.some((prefix) => {
    if (prefix === "/") {
      return pathname === "/"
    }

    return pathname === prefix || pathname.startsWith(`${prefix}/`)
  })
}

export default auth((request) => {
  if (process.env.NODE_ENV !== "production") {
    return
  }

  const { pathname } = request.nextUrl

  if (!isProtectedPath(pathname) || request.auth) {
    return
  }

  if (pathname.startsWith("/api/")) {
    return Response.json({ error: "未授权" }, { status: 401 })
  }

  const loginUrl = request.nextUrl.clone()
  loginUrl.pathname = "/login"
  loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname + request.nextUrl.search)

  return Response.redirect(loginUrl)
})

export const config = {
  matcher: [
    "/",
    "/login",
    "/members/:path*",
    "/records/:path*",
    "/medicines/:path*",
    "/allergies/:path*",
    "/assistant/:path*",
    "/visit-prep/:path*",
    "/settings/:path*",
    "/privacy",
    "/disclaimer",
    "/api/:path*",
  ],
}
