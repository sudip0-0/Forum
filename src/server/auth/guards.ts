import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { auth } from "@/server/auth/config";
import { isAdmin, isModeratorOrAbove } from "@/server/auth/permissions";

export async function requireSession(): Promise<Session> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session;
}

export async function requireAdmin(): Promise<Session> {
  const session = await requireSession();
  if (!isAdmin(session.user.role)) {
    redirect("/");
  }
  return session;
}

export async function requireModeratorOrAbove(): Promise<Session> {
  const session = await requireSession();
  if (!isModeratorOrAbove(session.user.role)) {
    redirect("/");
  }
  return session;
}
