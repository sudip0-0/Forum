import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/server/auth/config";
import { isAdmin } from "@/server/auth/permissions";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { appRouter } from "@/server/api/root";
import { db } from "@/server/db/prisma";

export default async function AdminPage() {
  const session = await auth();

  if (!session) redirect("/login");
  if (!isAdmin(session.user.role)) redirect("/");

  const caller = appRouter.createCaller({
    db,
    session: {
      user: { id: session.user.id, email: session.user.email ?? "", name: session.user.name ?? null, role: session.user.role },
      expires: session.expires,
    },
  });

  const stats = await caller.moderation.adminStats();
  const recentReports = await caller.moderation.listQueue({ limit: 5 });

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Welcome, {session.user.name ?? session.user.email}.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">Total Users</p>
          <p className="mt-1 text-2xl font-semibold">{stats.totalUsers}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">Visible Threads</p>
          <p className="mt-1 text-2xl font-semibold">{stats.totalVisibleThreads}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">Open Reports</p>
          <p className="mt-1 text-2xl font-semibold">{stats.openReports}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">Visible Forums</p>
          <p className="mt-1 text-2xl font-semibold">{stats.visibleForums}</p>
        </div>
      </div>

      {recentReports.reports.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold">Recent Reports</h2>
          <ul className="mt-3 divide-y rounded-lg border">
            {recentReports.reports.map((report) => (
              <li key={report.id} className="px-4 py-2.5 text-xs">
                <span className="rounded bg-primary/10 px-1.5 py-0.5 font-medium">{report.reason}</span>
                <span className="ml-2 text-muted-foreground">
                  by {report.reporter.displayName ?? report.reporter.username}
                </span>
                <span className="ml-2">
                  {report.post
                    ? `on post in "${report.post.thread?.title ?? "unknown"}"`
                    : report.thread
                      ? `on thread "${report.thread.title}"`
                      : ""}
                </span>
                <span className="ml-2 text-muted-foreground">
                  {new Date(report.createdAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-sm font-semibold">Quick Actions</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-5">
          <Link href="/admin/structure" className="rounded-lg border p-4 hover:bg-muted transition-colors">
            <p className="text-sm font-medium">Structure Manager</p>
            <p className="mt-1 text-xs text-muted-foreground">Sections, categories, forums</p>
          </Link>
          <Link href="/admin/threads" className="rounded-lg border p-4 hover:bg-muted transition-colors">
            <p className="text-sm font-medium">Thread Management</p>
            <p className="mt-1 text-xs text-muted-foreground">Lock, pin, move threads</p>
          </Link>
          <Link href="/admin/mod" className="rounded-lg border p-4 hover:bg-muted transition-colors">
            <p className="text-sm font-medium">Moderation Queue</p>
            <p className="mt-1 text-xs text-muted-foreground">Review reports</p>
          </Link>
          <Link href="/admin/mod/history" className="rounded-lg border p-4 hover:bg-muted transition-colors">
            <p className="text-sm font-medium">Moderation History</p>
            <p className="mt-1 text-xs text-muted-foreground">Past actions</p>
          </Link>
          <Link href="/admin/users" className="rounded-lg border p-4 hover:bg-muted transition-colors">
            <p className="text-sm font-medium">Manage Users</p>
            <p className="mt-1 text-xs text-muted-foreground">Roles, suspensions</p>
          </Link>
        </div>
      </div>

      <div className="mt-8">
        <SignOutButton />
      </div>
    </main>
  );
}
