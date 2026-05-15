import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { UserRole } from "@prisma/client";
import { db } from "@/server/db/prisma";
import { verifyPassword } from "@/server/auth/password";
import { checkRateLimit, RL_LOGIN } from "@/server/api/rate-limit";
import { z } from "zod";

declare module "next-auth" {
  interface User {
    role: UserRole;
    isSuspended: boolean;
  }
  interface Session {
    user: {
      id: string;
      role: UserRole;
      isSuspended: boolean;
    } & import("next-auth").DefaultSession["user"];
  }
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        try {
          checkRateLimit(`login:${email}`, RL_LOGIN);
        } catch {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email },
        });

        if (!user?.passwordHash) return null;

        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.displayName ?? user.username,
          role: user.role,
          isSuspended: user.isSuspended,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        (token as Record<string, unknown>).id = user.id;
        (token as Record<string, unknown>).role = user.role;
        (token as Record<string, unknown>).isSuspended = user.isSuspended;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token as Record<string, unknown>).id as string;
        session.user.role = (token as Record<string, unknown>).role as UserRole;
        session.user.isSuspended = (token as Record<string, unknown>).isSuspended as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
});
