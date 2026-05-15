import { redirect } from "next/navigation";
import { auth } from "@/server/auth/config";
import { isModeratorOrAbove } from "@/server/auth/permissions";
import { appRouter } from "@/server/api/root";
import { db } from "@/server/db/prisma";
import { ThreadManagement } from "./client";

export default async function ThreadManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; forumId?: string; status?: "all" | "locked" | "pinned" }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  if (!isModeratorOrAbove(session.user.role)) redirect("/");
  const filters = await searchParams;
  const caller = appRouter.createCaller({
    db,
    session: { user: { id: session.user.id, email: session.user.email ?? "", name: session.user.name ?? null, role: session.user.role }, expires: session.expires },
  });
  const [threads, forums] = await Promise.all([
    caller.moderation.listThreads({ q: filters.q, forumId: filters.forumId, status: filters.status ?? "all" }),
    caller.forum.listForModeration(),
  ]);
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Thread Management</h1>
      <p className="mt-1 text-sm text-muted-foreground">Find and act on threads directly, without waiting for reports.</p>
      <ThreadManagement threads={threads} forums={forums} />
    </main>
  );
}
