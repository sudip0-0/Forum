import { redirect } from "next/navigation";
import { auth } from "@/server/auth/config";
import { isModeratorOrAbove } from "@/server/auth/permissions";
import { appRouter } from "@/server/api/root";
import { db } from "@/server/db/prisma";
import { ModerationQueue } from "./client";

export default async function ModQueuePage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (!isModeratorOrAbove(session.user.role)) {
    redirect("/");
  }

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

  const { reports } = await caller.moderation.listQueue({ limit: 50 });

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Moderation Queue</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Review and resolve open reports.
      </p>
      <ModerationQueue reports={reports} />
    </main>
  );
}
