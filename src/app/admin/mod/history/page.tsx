import { requireModeratorOrAbove } from "@/server/auth/guards";
import { makeServerCaller } from "@/server/api/caller";
import { AdminHeader } from "@/components/admin/admin-header";
import { ModerationHistoryList } from "./client";

export default async function ModerationHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string }>;
}) {
  const { cursor } = await searchParams;
  await requireModeratorOrAbove();
  const caller = await makeServerCaller();
  const { logs, nextCursor } = await caller.moderation.listHistory({ limit: 25, cursor });

  const serializedLogs = logs.map((log) => ({
    ...log,
    createdAt: log.createdAt.toISOString(),
  }));

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <AdminHeader title="Moderation History" description="Audit trail of recent moderation actions." backHref="/admin" />
      <ModerationHistoryList logs={serializedLogs} nextCursor={nextCursor} />
    </main>
  );
}
