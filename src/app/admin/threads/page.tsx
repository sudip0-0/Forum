import { redirect } from "next/navigation";
import { auth } from "@/server/auth/config";
import { isModeratorOrAbove } from "@/server/auth/permissions";
import { appRouter } from "@/server/api/root";
import { db } from "@/server/db/prisma";
import { AdminHeader } from "@/components/admin/admin-header";
import { buildCursorHref } from "@/lib/pagination";
import { ThreadManagement } from "./client";

export default async function ThreadManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; forumId?: string; status?: "all" | "locked" | "pinned"; cursor?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  if (!isModeratorOrAbove(session.user.role)) redirect("/");
  const filters = await searchParams;
  const caller = appRouter.createCaller({
    db,
    session: { user: { id: session.user.id, email: session.user.email ?? "", name: session.user.name ?? null, role: session.user.role }, expires: session.expires },
  });
  const [threadPage, forums] = await Promise.all([
    caller.moderation.listThreads({
      q: filters.q,
      forumId: filters.forumId,
      status: filters.status ?? "all",
      cursor: filters.cursor,
      limit: 25,
    }),
    caller.forum.listForModeration(),
  ]);
  const nextHref = threadPage.nextCursor
    ? buildCursorHref(
        "/admin/threads",
        {
          q: filters.q,
          forumId: filters.forumId,
          status: filters.status && filters.status !== "all" ? filters.status : undefined,
        },
        threadPage.nextCursor,
      )
    : null;
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <AdminHeader title="Thread Management" description="Find and act on threads directly, without waiting for reports." backHref="/admin" />
      <ThreadManagement threads={threadPage.threads} forums={forums} nextHref={nextHref} filters={filters} />
    </main>
  );
}
