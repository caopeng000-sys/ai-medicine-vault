import { auth } from "@/auth"
import { NextResponse } from "next/server"

const publicPathPrefixes = ["/api/auth", "/login", "/privacy", "/disclaimer", "/_next", "/favicon.ico"]

function isPublicPath(pathname: string) {
  return publicPathPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

function isApiPath(pathname: string) {
  return pathname.startsWith("/api/")
}

export default auth((request) => {
  if (process.env.NODE_ENV !== "production" || isPublicPath(request.nextUrl.pathname)) {
    return NextResponse.next()
  }

  if (request.auth) {
    return NextResponse.next()
  }

  if (isApiPath(request.nextUrl.pathname)) {
    return NextResponse.json({ message: "请先登录后再访问家庭健康资料。" }, { status: 401 })
  }

  const loginUrl = new URL("/login", request.nextUrl.origin)
  loginUrl.searchParams.set("from", `${request.nextUrl.pathname}${request.nextUrl.search}`)

  return NextResponse.redirect(loginUrl)
})

export const config = {
  matcher: [
    "/",
    "/members/:path*",
    "/records/:path*",
    "/medicines/:path*",
    "/allergies/:path*",
    "/assistant/:path*",
    "/visit-prep/:path*",
    "/api/members/:path*",
    "/api/records/:path*",
    "/api/medicines/:path*",
    "/api/allergies/:path*",
    "/api/assistant/:path*",
    "/api/export/:path*",
  ],
}
