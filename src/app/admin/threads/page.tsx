import { requireModeratorOrAbove } from "@/server/auth/guards";
import { makeServerCaller } from "@/server/api/caller";
import { AdminHeader } from "@/components/admin/admin-header";
import { buildCursorHref } from "@/lib/pagination";
import { ThreadManagement } from "./client";

export default async function ThreadManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; forumId?: string; status?: "all" | "locked" | "pinned"; cursor?: string }>;
}) {
  await requireModeratorOrAbove();
  const filters = await searchParams;
  const caller = await makeServerCaller();
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
