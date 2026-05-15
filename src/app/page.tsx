import Link from "next/link";
import { appRouter } from "@/server/api/root";
import { db } from "@/server/db/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  const caller = appRouter.createCaller({ db, session: null });
  const data = await caller.discovery.home();
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-12 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Community forum</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Latest discussions</h1>
          <div className="mt-8 space-y-4">
            {data.activeThreads.map((thread) => (
              <article key={thread.id} className="rounded-lg border p-4">
                <Link href={`/forum/${thread.forum.slug}/${thread.slug}`} className="text-base font-medium hover:underline">
                  {thread.title}
                </Link>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>{thread.forum.name}</span>
                  <span>{thread.replyCount} replies</span>
                  <span>{thread.viewCount} views</span>
                </div>
                {thread.tags.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{thread.tags.map((tag) => <span key={tag.id} className="rounded bg-muted px-2 py-0.5 text-xs">#{tag.name}</span>)}</div>}
              </article>
            ))}
          </div>
        </div>
        <aside className="space-y-5">
          <section className="rounded-lg border p-4">
            <h2 className="text-sm font-semibold">Latest messages</h2>
            <div className="mt-3 space-y-3">
              {data.latestMessages.map((message) => (
                <Link key={message.id} href={`/forum/${message.thread.forum.slug}/${message.thread.slug}#post-${message.id}`} className="block text-sm hover:underline">
                  <div className="line-clamp-2">{message.content}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {message.author.displayName ?? message.author.username} in {message.thread.title}
                  </div>
                </Link>
              ))}
            </div>
          </section>
          <section className="rounded-lg border p-4">
            <h2 className="text-sm font-semibold">Popular threads</h2>
            <div className="mt-3 space-y-2">
              {data.popularThreads.map((thread) => (
                <Link key={thread.id} href={`/forum/${thread.forum.slug}/${thread.slug}`} className="block text-sm hover:underline">
                  {thread.title}
                </Link>
              ))}
            </div>
          </section>
          <section className="rounded-lg border p-4">
            <h2 className="text-sm font-semibold">Popular tags</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {data.popularTags.map((tag) => <span key={tag.id} className="rounded bg-muted px-2 py-1 text-xs">#{tag.name} · {tag._count.threads}</span>)}
            </div>
          </section>
          <section className="rounded-lg border p-4 text-sm">
            <h2 className="font-semibold">Community stats</h2>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div><div className="text-lg font-semibold">{data.stats.users}</div><div className="text-xs text-muted-foreground">users</div></div>
              <div><div className="text-lg font-semibold">{data.stats.threads}</div><div className="text-xs text-muted-foreground">threads</div></div>
              <div><div className="text-lg font-semibold">{data.stats.messages}</div><div className="text-xs text-muted-foreground">messages</div></div>
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}
