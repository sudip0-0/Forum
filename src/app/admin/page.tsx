import Link from "next/link";
import { requireAdmin } from "@/server/auth/guards";
import { makeServerCaller } from "@/server/api/caller";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { LayoutDashboard, GitBranch, MessageSquare, Shield, Clock, Users, ArrowRight, AlertTriangle } from "lucide-react";

export default async function AdminDashboard() {
  const session = await requireAdmin();
  const caller = await makeServerCaller();

  const stats = await caller.moderation.adminStats();
  const recentReports = await caller.moderation.listQueue({ limit: 5 });

  const statCards = [
    { label: "Users", value: stats.totalUsers, href: "/admin/users" },
    { label: "Threads", value: stats.totalVisibleThreads, href: "/admin/threads" },
    { label: "Open Reports", value: stats.openReports, href: "/admin/mod", dangerous: true },
    { label: "Forums", value: stats.visibleForums, href: "/admin/structure" },
  ];

  const quickActions = [
    { label: "Structure Manager", description: "Manage sections, categories, and forums", href: "/admin/structure", icon: GitBranch },
    { label: "Thread Management", description: "Search, lock, pin, or move threads", href: "/admin/threads", icon: MessageSquare },
    { label: "Moderation Queue", description: "Review and act on reports", href: "/admin/mod", icon: Shield },
    { label: "Moderation History", description: "View all past moderator actions", href: "/admin/mod/history", icon: Clock },
    { label: "User Management", description: "Manage users, roles, and suspensions", href: "/admin/users", icon: Users },
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="page-header-hero">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
              <LayoutDashboard className="h-3.5 w-3.5" />
              Admin
            </div>
            <h1 className="heading-xl">Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Welcome back, {session.user.name ?? session.user.email}.
            </p>
          </div>
          <SignOutButton />
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="stat-card hover:translate-y-[-2px] transition-transform hover:no-underline"
          >
            <div className={`stat-value ${stat.dangerous ? "text-destructive" : ""}`}>
              {stat.value}
            </div>
            <div className="stat-label">{stat.label}</div>
          </Link>
        ))}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div>
          <div className="section-panel-header rounded-t-md">
            <span>Quick Actions</span>
          </div>
          <div className="section-panel divide-y divide-border">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-accent/40 hover:no-underline"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border-2 border-border bg-background shadow-[1px_1px_0px_var(--border)]">
                  <action.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">{action.label}</div>
                  <div className="text-xs text-muted-foreground">{action.description}</div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>

        <div>
          <div className="section-panel-header rounded-t-md">
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Recent Reports
            </span>
          </div>
          <div className="section-panel">
            {recentReports.reports.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-muted-foreground">No open reports. The queue is clear.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentReports.reports.map((report) => (
                  <div key={report.id} className="px-4 py-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="badge-red text-[10px]">{report.reason}</span>
                      <span>by {report.reporter.displayName ?? report.reporter.username}</span>
                    </div>
                    <div className="mt-1 text-xs">
                      {report.post ? (
                        <span className="line-clamp-1">{report.post.content.slice(0, 80)}</span>
                      ) : report.thread ? (
                        <span>{report.thread.title}</span>
                      ) : (
                        <span className="italic">(deleted)</span>
                      )}
                    </div>
                    <div className="mt-0.5 text-[10px] text-muted-foreground">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
                <Link
                  href="/admin/mod"
                  className="flex items-center justify-center gap-1 px-4 py-2.5 text-xs font-semibold text-primary hover:bg-accent/40 transition-colors hover:no-underline"
                >
                  View all reports
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
