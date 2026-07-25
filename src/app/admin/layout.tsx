import Link from "next/link";
import { requireModeratorOrAbove } from "@/server/auth/guards";
import { isAdmin } from "@/server/auth/permissions";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireModeratorOrAbove();
  const admin = isAdmin(session.user.role);

  return (
    <div>
      <div className="border-b-2 border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-6 py-3 text-sm">
          <span className="mr-2 text-xs font-semibold uppercase tracking-wider text-primary">
            Staff
          </span>
          {admin && (
            <Link
              href="/admin"
              className="rounded-md px-2.5 py-1.5 font-medium text-muted-foreground hover:bg-accent hover:text-foreground hover:no-underline"
            >
              Dashboard
            </Link>
          )}
          <Link
            href="/admin/mod"
            className="rounded-md px-2.5 py-1.5 font-medium text-muted-foreground hover:bg-accent hover:text-foreground hover:no-underline"
          >
            Mod queue
          </Link>
          <Link
            href="/admin/threads"
            className="rounded-md px-2.5 py-1.5 font-medium text-muted-foreground hover:bg-accent hover:text-foreground hover:no-underline"
          >
            Threads
          </Link>
          {admin && (
            <>
              <Link
                href="/admin/structure"
                className="rounded-md px-2.5 py-1.5 font-medium text-muted-foreground hover:bg-accent hover:text-foreground hover:no-underline"
              >
                Structure
              </Link>
              <Link
                href="/admin/users"
                className="rounded-md px-2.5 py-1.5 font-medium text-muted-foreground hover:bg-accent hover:text-foreground hover:no-underline"
              >
                Users
              </Link>
            </>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}
