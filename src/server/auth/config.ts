import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { UserRole } from "@prisma/client";
import { db } from "@/server/db/prisma";
import { verifyPassword } from "@/server/auth/password";
import {
  checkRateLimit,
  hashRateLimitIdentifier,
  resetRateLimit,
  RL_LOGIN,
} from "@/server/api/rate-limit";
import { z } from "zod";

declare module "next-auth" {
  interface User {
    role: UserRole;
    isSuspended: boolean;
    username: string;
  }
  interface Session {
    user: {
      id: string;
      role: UserRole;
      isSuspended: boolean;
      username: string;
    } & import("next-auth").DefaultSession["user"];
  }
}

/** Custom claims we persist on the JWT for forum authorization. */
interface ForumTokenClaims {
  id: string;
  role: UserRole;
  isSuspended: boolean;
  username: string;
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const authConfig = {
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
        const loginLimitKey = hashRateLimitIdentifier(email);

        try {
          await checkRateLimit(loginLimitKey, RL_LOGIN);
        } catch {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email },
        });

        if (!user?.passwordHash) return null;

        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) return null;
        await resetRateLimit(loginLimitKey, RL_LOGIN);

        return {
          id: user.id,
          email: user.email,
          name: user.displayName ?? user.username,
          username: user.username,
          role: user.role,
          isSuspended: user.isSuspended,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        const claims: ForumTokenClaims = {
          id: user.id ?? "",
          role: user.role,
          isSuspended: user.isSuspended,
          username: user.username,
        };
        return { ...token, ...claims };
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        const claims = token as Partial<ForumTokenClaims>;
        session.user.id = claims.id ?? "";
        session.user.role = claims.role ?? "MEMBER";
        session.user.isSuspended = claims.isSuspended ?? false;
        session.user.username = claims.username ?? "";
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
} satisfies Parameters<typeof NextAuth>[0];

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
