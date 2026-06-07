import { PrismaAdapter } from "@auth/prisma-adapter"
import NextAuth from "next-auth"

import authConfig from "@/auth.config"
import { getPrismaClient } from "@/lib/db"

const prisma = getPrismaClient()

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET,
  adapter: prisma ? PrismaAdapter(prisma) : undefined,
  session: {
    strategy: prisma ? "database" : "jwt",
  },
  callbacks: {
    session({ session, user, token }) {
      if (session.user) {
        session.user.id = user?.id ?? token.sub ?? session.user.id
      }

      return session
    },
  },
})
