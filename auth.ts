import { PrismaAdapter } from "@auth/prisma-adapter"
import NextAuth, { type DefaultSession } from "next-auth"
import GitHub from "next-auth/providers/github"

import { getPrismaClient } from "@/lib/db"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
    } & DefaultSession["user"]
  }
}

const prisma = getPrismaClient()
const hasGitHubProvider = Boolean(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET)

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: prisma ? PrismaAdapter(prisma) : undefined,
  providers: hasGitHubProvider ? [GitHub] : [],
  session: {
    strategy: prisma ? "database" : "jwt",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id
      }

      return token
    },
    session({ session, token, user }) {
      if (session.user) {
        session.user.id = user?.id ?? token.sub ?? ""
      }

      return session
    },
  },
})
