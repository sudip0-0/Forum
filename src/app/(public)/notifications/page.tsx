import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/server/auth/guards";
import { makeServerCaller } from "@/server/api/caller";
import { markAllNotificationsRead } from "./actions";

export default async function NotificationsPage() {
  await requireSession();
  const caller = await makeServerCaller();
  const { items } = await caller.notification.list({ limit: 40 });

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="heading-lg">Notifications</h1>
        <form action={markAllNotificationsRead}>
          <button type="submit" className="text-sm font-semibold text-primary">
            Mark all read
          </button>
        </form>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">You’re all caught up.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((n) => {
            const href =
              n.thread?.forum?.slug && n.thread.slug
                ? `/forum/${n.thread.forum.slug}/${n.thread.slug}`
                : "/notifications";
            return (
              <li
                key={n.id}
                className={`rounded-md border-2 border-border px-4 py-3 shadow-[2px_2px_0px_var(--border)] ${
                  n.readAt ? "bg-card" : "bg-primary/5"
                }`}
              >
                <Link href={href} className="hover:no-underline">
                  <p className="text-sm font-medium">
                    {n.actor?.displayName ?? n.actor?.username ?? "Someone"} · {n.type}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {n.thread?.title ?? "Activity"}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
