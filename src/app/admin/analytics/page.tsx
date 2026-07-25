import { requireAdmin } from "@/server/auth/guards";
import { makeServerCaller } from "@/server/api/caller";
import { AdminHeader } from "@/components/admin/admin-header";

export default async function AdminAnalyticsPage() {
  await requireAdmin();
  const caller = await makeServerCaller();
  const summary = await caller.analytics.summary();

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <AdminHeader
        title="Analytics"
        description="7-day and 30-day activity snapshots."
        backHref="/admin"
      />
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-md border-2 border-border bg-card p-4 shadow-[2px_2px_0px_var(--border)]">
          <p className="stat-label">Threads (7d)</p>
          <p className="text-2xl font-bold">{summary.threads7}</p>
        </div>
        <div className="rounded-md border-2 border-border bg-card p-4 shadow-[2px_2px_0px_var(--border)]">
          <p className="stat-label">Posts (7d)</p>
          <p className="text-2xl font-bold">{summary.posts7}</p>
        </div>
        <div className="rounded-md border-2 border-border bg-card p-4 shadow-[2px_2px_0px_var(--border)]">
          <p className="stat-label">Signups (7d)</p>
          <p className="text-2xl font-bold">{summary.users7}</p>
        </div>
      </div>
      <div className="mt-8 space-y-3">
        {Object.entries(summary.events).map(([name, counts]) => (
          <div
            key={name}
            className="flex items-center justify-between rounded-md border-2 border-border bg-card px-4 py-3 text-sm"
          >
            <span className="font-medium">{name}</span>
            <span className="text-muted-foreground">
              7d: {counts.d7} · 30d: {counts.d30}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
