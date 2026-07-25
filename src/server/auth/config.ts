import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import type { UserRole } from "@prisma/client";
import { db } from "@/server/db/prisma";
import { verifyPassword } from "@/server/auth/password";
import {
  checkRateLimit,
  hashRateLimitIdentifier,
  resetRateLimit,
  RL_LOGIN,
} from "@/server/api/rate-limit";
import { edgeAuthConfig } from "@/server/auth/auth.config";
import { z } from "zod";

const oauthProviders = [
  ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
    ? [
        Google({
          clientId: process.env.AUTH_GOOGLE_ID,
          clientSecret: process.env.AUTH_GOOGLE_SECRET,
          allowDangerousEmailAccountLinking: true,
        }),
      ]
    : []),
  ...(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET
    ? [
        GitHub({
          clientId: process.env.AUTH_GITHUB_ID,
          clientSecret: process.env.AUTH_GITHUB_SECRET,
          allowDangerousEmailAccountLinking: true,
        }),
      ]
    : []),
];

declare module "next-auth" {
  interface User {
    role: UserRole;
    isSuspended: boolean;
    username: string;
    tokenVersion: number;
  }
  interface Session {
    user: {
      id: string;
      role: UserRole;
      isSuspended: boolean;
      username: string;
      tokenVersion: number;
    } & import("next-auth").DefaultSession["user"];
  }
}

/** Custom claims we persist on the JWT for forum authorization. */
export interface ForumTokenClaims {
  id: string;
  role: UserRole;
  isSuspended: boolean;
  username: string;
  tokenVersion: number;
  lastRefreshedAt: number;
}

export const JWT_REFRESH_INTERVAL_MS = 60_000;

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const authConfig = {
  ...edgeAuthConfig,
  providers: [
    ...oauthProviders,
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
        if (user.isSuspended) return null;

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
          tokenVersion: user.tokenVersion,
        };
      },
    }),
  ],
  callbacks: {
    ...edgeAuthConfig.callbacks,
    async signIn({ user }) {
      if (!user?.email) return false;
      const dbUser = await db.user.findUnique({
        where: { email: user.email },
        select: { isSuspended: true },
      });
      if (dbUser?.isSuspended) return false;
      return true;
    },
    async jwt({ token, user, account }) {
      if (account && (account.provider === "google" || account.provider === "github")) {
        const email = token.email ?? user?.email;
        if (!email) return {};
        let dbUser = await db.user.findUnique({ where: { email } });
        if (!dbUser) {
          const base =
            (email.split("@")[0] ?? "user").replace(/[^a-zA-Z0-9_]/g, "").slice(0, 20) ||
            "user";
          let username = base;
          let i = 0;
          while (await db.user.findUnique({ where: { username } })) {
            i += 1;
            username = `${base}${i}`;
          }
          dbUser = await db.user.create({
            data: {
              email,
              username,
              displayName: user?.name ?? username,
              image: user?.image,
              emailVerified: new Date(),
              passwordHash: null,
            },
          });
        }
        return {
          ...token,
          id: dbUser.id,
          role: dbUser.role,
          isSuspended: dbUser.isSuspended,
          username: dbUser.username,
          tokenVersion: dbUser.tokenVersion,
          lastRefreshedAt: Date.now(),
        };
      }
      if (user) {
        const claims: ForumTokenClaims = {
          id: user.id ?? "",
          role: user.role,
          isSuspended: user.isSuspended,
          username: user.username,
          tokenVersion: user.tokenVersion ?? 0,
          lastRefreshedAt: Date.now(),
        };
        return { ...token, ...claims };
      }

      const claims = token as Partial<ForumTokenClaims> & typeof token;
      const userId = claims.id;
      if (!userId) {
        return {};
      }

      const lastRefreshedAt =
        typeof claims.lastRefreshedAt === "number" ? claims.lastRefreshedAt : 0;
      const needsRefresh =
        !lastRefreshedAt || Date.now() - lastRefreshedAt > JWT_REFRESH_INTERVAL_MS;

      if (!needsRefresh) {
        return token;
      }

      const dbUser = await db.user.findUnique({
        where: { id: userId },
        select: {
          role: true,
          isSuspended: true,
          username: true,
          tokenVersion: true,
        },
      });

      if (!dbUser || dbUser.tokenVersion !== (claims.tokenVersion ?? 0)) {
        // Force re-authentication when the user is gone or sessions were revoked.
        return {};
      }

      return {
        ...token,
        id: userId,
        role: dbUser.role,
        isSuspended: dbUser.isSuspended,
        username: dbUser.username,
        tokenVersion: dbUser.tokenVersion,
        lastRefreshedAt: Date.now(),
      };
    },
    session({ session, token }) {
      if (session.user) {
        const claims = token as Partial<ForumTokenClaims>;
        if (!claims.id) {
          // Empty token after invalidation — leave session without usable claims.
          session.user.id = "";
          return session;
        }
        session.user.id = claims.id;
        session.user.role = claims.role ?? "MEMBER";
        session.user.isSuspended = claims.isSuspended ?? false;
        session.user.username = claims.username ?? "";
        session.user.tokenVersion = claims.tokenVersion ?? 0;
      }
      return session;
    },
  },
} satisfies Parameters<typeof NextAuth>[0];

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
