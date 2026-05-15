import { redirect } from "next/navigation";
import { auth } from "@/server/auth/config";
import { isModeratorOrAbove } from "@/server/auth/permissions";
import { appRouter } from "@/server/api/root";
import { db } from "@/server/db/prisma";
import { AdminHeader } from "@/components/admin/admin-header";
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
      <AdminHeader title="Moderation Queue" description="Review and resolve open reports." backHref="/admin" />
      <ModerationQueue reports={reports} />
    </main>
  );
}
