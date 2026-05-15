import { redirect } from "next/navigation";
import { auth } from "@/server/auth/config";
import { isModeratorOrAbove } from "@/server/auth/permissions";
import { appRouter } from "@/server/api/root";
import { db } from "@/server/db/prisma";
import { ModerationHistoryList } from "./client";

export default async function ModerationHistoryPage() {
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

  const { logs } = await caller.moderation.listHistory({ limit: 50 });

  const serializedLogs = logs.map((log) => ({
    ...log,
    createdAt: log.createdAt.toISOString(),
  }));

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Moderation History</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Audit trail of recent moderation actions.
      </p>
      <ModerationHistoryList logs={serializedLogs} />
    </main>
  );
}
