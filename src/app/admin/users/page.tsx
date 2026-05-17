import { redirect } from "next/navigation";
import { auth } from "@/server/auth/config";
import { isAdmin } from "@/server/auth/permissions";
import { appRouter } from "@/server/api/root";
import { db } from "@/server/db/prisma";
import { AdminHeader } from "@/components/admin/admin-header";
import { UserList } from "./client";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string }>;
}) {
  const { cursor } = await searchParams;
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (!isAdmin(session.user.role)) {
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

  const { users, nextCursor } = await caller.moderation.listUsers({ limit: 25, cursor });

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <AdminHeader title="Manage Users" description="View users and manage roles." backHref="/admin" />
      <UserList users={users} nextCursor={nextCursor} />
    </main>
  );
}
