import type { NextAuthConfig } from "next-auth"
import GitHub from "next-auth/providers/github"

const providers = []

if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
  )
}

export default {
  providers,
  pages: {
    signIn: "/login",
  },
  trustHost: true,
} satisfies NextAuthConfig
