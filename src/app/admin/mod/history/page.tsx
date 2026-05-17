import { redirect } from "next/navigation";
import { auth } from "@/server/auth/config";
import { isModeratorOrAbove } from "@/server/auth/permissions";
import { appRouter } from "@/server/api/root";
import { db } from "@/server/db/prisma";
import { AdminHeader } from "@/components/admin/admin-header";
import { ModerationHistoryList } from "./client";

export default async function ModerationHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string }>;
}) {
  const { cursor } = await searchParams;
  const session = await auth();
  if (!session) redirect("/login");
  if (!isModeratorOrAbove(session.user.role)) redirect("/");

  const caller = appRouter.createCaller({
    db,
    session: {
      user: {
        id: session.user.id,
        email: session.user.email ?? "",
        name: session.user.name ?? null,
        role: session.user.role,
      },
      expires: session.expires,
    },
  });

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
