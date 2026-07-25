import { requireModeratorOrAbove } from "@/server/auth/guards";
import { makeServerCaller } from "@/server/api/caller";
import { AdminHeader } from "@/components/admin/admin-header";
import { ModerationQueue } from "./client";

export default async function ModQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string }>;
}) {
  const { cursor } = await searchParams;
  await requireModeratorOrAbove();
  const caller = await makeServerCaller();
  const { reports, nextCursor } = await caller.moderation.listQueue({ limit: 25, cursor });

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <AdminHeader title="Moderation Queue" description="Review and resolve open reports." backHref="/admin" />
      <ModerationQueue reports={reports} nextCursor={nextCursor} />
    </main>
  );
}
