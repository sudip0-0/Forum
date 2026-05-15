import type { Metadata } from "next";
import Link from "next/link";
import { appRouter } from "@/server/api/root";
import { db } from "@/server/db/prisma";
import { TagPill } from "@/components/forum/tag-pill";
import { MessageSquare, Users, TrendingUp, Hash, ArrowRight, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Home",
  description: "A focused community forum for questions and discussion.",
};

export default async function Home() {
  const caller = appRouter.createCaller({ db, session: null });
  const data = await caller.discovery.home();

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* ── Hero Header ── */}
      <div className="page-header-hero">
        <div className="flex items-start justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary mb-2">
              <Sparkles className="h-4 w-4" />
              <span>Community Forum</span>
            </div>
            <h1 className="heading-xl">Welcome to the Forums</h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-xl">
              A focused space for questions, ideas, and thoughtful discussion.
              Browse conversations, share your knowledge, and connect with the community.
            </p>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/forums"
              className="inline-flex items-center gap-2 rounded-md border-2 border-border bg-background px-5 py-2.5 text-sm font-semibold shadow-[2px_2px_0px_var(--border)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_var(--border)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:no-underline"
            >
              Browse All Forums
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* ── Main Content ── */}
        <div>
          {/* Latest Discussions */}
          <section>
            <div className="section-panel-header rounded-t-md">
              <span className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Latest discussions
              </span>
            </div>
            <div className="section-panel">
              {data.activeThreads.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <MessageSquare className="h-10 w-10" />
                  </div>
                  <p className="empty-state-title">No discussions yet</p>
                  <p className="empty-state-text">Be the first to start a conversation.</p>
                </div>
              ) : (
                <div>
                  {data.activeThreads.map((thread) => (
                    <div key={thread.id} className="row-dense">
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/forum/${thread.forum.slug}/${thread.slug}`}
                          className="text-sm font-semibold hover:text-link hover:no-underline leading-snug"
                        >
                          {thread.title}
                        </Link>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>{thread.forum.name}</span>
                          <span className="text-border">·</span>
                          <Link
                            href={`/forum/${thread.forum.slug}`}
                            className="hover:text-foreground hover:no-underline"
                          >
                            {thread.forum.name}
                          </Link>
                          <span className="text-border">·</span>
                          <span>{new Date(thread.lastActivityAt).toLocaleDateString()}</span>
                        </div>
                        {thread.tags.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {thread.tags.slice(0, 3).map((tag) => (
                              <TagPill key={tag.id} tag={tag} />
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="hidden shrink-0 items-center gap-3 text-xs text-muted-foreground sm:flex">
                        <span title="Replies">{thread.replyCount} replies</span>
                        <span title="Views">{thread.viewCount} views</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Latest Messages */}
          <section className="mt-6">
            <div className="section-panel-header rounded-t-md">
              <span className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Latest messages
              </span>
            </div>
            <div className="section-panel">
              {data.latestMessages.length === 0 ? (
                <div className="empty-state">
                  <p className="empty-state-text">No messages yet.</p>
                </div>
              ) : (
                <div>
                  {data.latestMessages.map((message) => (
                    <div key={message.id} className="row-dense">
                      <div className="flex-1 min-w-0">
                        <span className="text-xs text-muted-foreground">
                          {message.author.displayName ?? message.author.username}
                        </span>
                        <Link
                          href={`/forum/${message.thread.forum.slug}/${message.thread.slug}?postId=${message.id}#post-${message.id}`}
                          className="ml-1.5 text-xs text-link hover:underline"
                        >
                          replied in &ldquo;{message.thread.title}&rdquo;
                        </Link>
                        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                          {message.content.slice(0, 120)}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {new Date(message.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* ── Sidebar ── */}
        <aside className="space-y-6">
          {/* Popular Threads */}
          <section className="card-elevated">
            <div className="border-b-2 border-border px-4 py-2.5">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <TrendingUp className="h-4 w-4 text-primary" />
                Popular threads
              </span>
            </div>
            <div className="divide-y divide-border">
              {data.popularThreads.length === 0 ? (
                <p className="px-4 py-6 text-sm text-muted-foreground text-center">
                  No trending threads yet.
                </p>
              ) : (
                data.popularThreads.map((thread) => (
                  <div key={thread.id} className="px-4 py-2.5">
                    <Link
                      href={`/forum/${thread.forum.slug}/${thread.slug}`}
                      className="text-sm font-medium hover:text-link hover:no-underline leading-snug"
                    >
                      {thread.title}
                    </Link>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {thread.replyCount} replies · {thread.viewCount} views
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Popular Tags */}
          <section className="card-elevated">
            <div className="border-b-2 border-border px-4 py-2.5">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Hash className="h-4 w-4 text-primary" />
                Popular tags
              </span>
            </div>
            <div className="px-4 py-3">
              {data.popularTags.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tags yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {data.popularTags.map((tag) => (
                    <TagPill key={tag.id} tag={tag} showCount count={tag._count.threads} />
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Community Stats */}
          <section className="card-elevated">
            <div className="border-b-2 border-border px-4 py-2.5">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Users className="h-4 w-4 text-primary" />
                Community stats
              </span>
            </div>
            <div className="grid grid-cols-3 divide-x-2 divide-border">
              <div className="px-4 py-3 text-center">
                <div className="text-xl font-extrabold tracking-tight">{data.stats.users}</div>
                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-0.5">Users</div>
              </div>
              <div className="px-4 py-3 text-center">
                <div className="text-xl font-extrabold tracking-tight">{data.stats.threads}</div>
                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-0.5">Threads</div>
              </div>
              <div className="px-4 py-3 text-center">
                <div className="text-xl font-extrabold tracking-tight">{data.stats.messages}</div>
                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-0.5">Messages</div>
              </div>
            </div>
          </section>

          {/* Mobile CTA */}
          <Link
            href="/forums"
            className="flex items-center justify-center gap-2 rounded-md border-2 border-border bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[3px_3px_0px_var(--border)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_var(--border)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none md:hidden hover:no-underline"
          >
            Browse All Forums
            <ArrowRight className="h-4 w-4" />
          </Link>
        </aside>
      </div>
    </div>
  );
}
