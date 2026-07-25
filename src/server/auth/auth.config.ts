import type { NextAuthConfig } from "next-auth";

type StaffRole = "MEMBER" | "MODERATOR" | "ADMIN";

/**
 * Edge-compatible Auth.js config (no Prisma / Redis / Node-only imports).
 * Used by middleware. Full credentials + JWT refresh live in config.ts.
 */
export const edgeAuthConfig = {
  providers: [],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt" as const,
  },
  callbacks: {
    session({ session, token }) {
      if (session.user) {
        const claims = token as {
          id?: string;
          role?: StaffRole;
          isSuspended?: boolean;
          username?: string;
          tokenVersion?: number;
          sub?: string;
        };
        session.user.id = claims.id ?? claims.sub ?? "";
        // Custom claims; full typing lives in config.ts module augmentation.
        (session.user as { role?: StaffRole }).role = claims.role;
        (session.user as { isSuspended?: boolean }).isSuspended = Boolean(
          claims.isSuspended,
        );
        (session.user as { username?: string }).username = claims.username ?? "";
        (session.user as { tokenVersion?: number }).tokenVersion =
          claims.tokenVersion ?? 0;
      }
      return session;
    },
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      if (!pathname.startsWith("/admin")) {
        return true;
      }
      if (!auth?.user?.id) {
        return false;
      }
      const role = (auth.user as { role?: StaffRole }).role;
      const isModeratorPath =
        pathname === "/admin/mod" ||
        pathname.startsWith("/admin/mod/") ||
        pathname === "/admin/threads" ||
        pathname.startsWith("/admin/threads/");
      if (isModeratorPath) {
        return role === "MODERATOR" || role === "ADMIN";
      }
      return role === "ADMIN";
    },
  },
} satisfies NextAuthConfig;
