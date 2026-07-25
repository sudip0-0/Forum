import { requireAdmin } from "@/server/auth/guards";
import { makeServerCaller } from "@/server/api/caller";
import { AdminHeader } from "@/components/admin/admin-header";
import { UserList } from "./client";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string }>;
}) {
  const { cursor } = await searchParams;
  await requireAdmin();
  const caller = await makeServerCaller();
  const { users, nextCursor } = await caller.moderation.listUsers({ limit: 25, cursor });

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <AdminHeader title="Manage Users" description="View users and manage roles." backHref="/admin" />
      <UserList users={users} nextCursor={nextCursor} />
    </main>
  );
}
