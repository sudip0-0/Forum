import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { appRouter } from "@/server/api/root";
import { auth } from "@/server/auth/config";
import { db } from "@/server/db/prisma";
import { createMetadata } from "@/lib/seo";
import { buildCursorHref } from "@/lib/pagination";
import { ProfileEditForm } from "./client";
import { Calendar, MessageSquare } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;

  const caller = appRouter.createCaller({ db, session: null });
  try {
    const profile = await caller.user.getPublicProfile({ username });
    const description = profile.bio ?? `${profile.displayName ?? profile.username}'s profile`;
    return createMetadata({
      title: profile.displayName ?? profile.username,
      description,
      path: `/u/${profile.username}`,
      index: false,
    });
  } catch {
    return createMetadata({
      title: "Profile",
      description: "Public forum profile.",
      path: `/u/${username}`,
      index: false,
    });
  }
}

export default async function UserProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ cursor?: string }>;
}) {
  const { username } = await params;
  const { cursor } = await searchParams;
  const session = await auth();

  const caller = appRouter.createCaller({
    db,
    session: session?.user
      ? {
          user: {
            id: session.user.id,
            email: session.user.email ?? "",
            name: session.user.name ?? null,
            role: session.user.role,
          },
          expires: session.expires,
        }
      : null,
  });

  let profile;
  try {
    profile = await caller.user.getPublicProfile({
      username,
      cursor,
      limit: 20,
      tab: "threads",
    });
  } catch {
    notFound();
  }

  const isOwner = session?.user?.id === profile.id;

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      {/* Profile Header */}
      <div className="page-header-hero">
        <div className="flex items-start gap-5">
          {profile.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.image}
              alt=""
              className="h-16 w-16 shrink-0 rounded-full border-2 border-border object-cover shadow-[2px_2px_0px_var(--border)] sm:h-20 sm:w-20"
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-border bg-primary/15 text-2xl font-bold text-primary shadow-[2px_2px_0px_var(--border)] sm:h-20 sm:w-20 sm:text-3xl">
              {(profile.displayName ?? profile.username).slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="heading-xl">
              {profile.displayName ?? profile.username}
            </h1>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
            <p className="mt-1 text-sm font-semibold">{profile.reputation} reputation</p>
            {profile.role !== "MEMBER" && (
              <span className={profile.role === "ADMIN" ? "badge-orange mt-2" : "badge-blue mt-2"}>
                {profile.role === "ADMIN" ? "Admin" : "Moderator"}
              </span>
            )}
            {profile.badges.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {profile.badges.map((ub) => (
                  <span
                    key={ub.id}
                    className="rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-semibold"
                  >
                    {ub.badge.name}
                  </span>
                ))}
              </div>
            )}
            {profile.bio && (
              <p className="mt-2 text-sm max-w-lg">{profile.bio}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Joined {new Date(profile.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {isOwner && (
        <div className="mb-8">
          <ProfileEditForm
            username={username}
            initialDisplayName={profile.displayName ?? ""}
            initialBio={profile.bio ?? ""}
          />
        </div>
      )}

      {/* Recent Threads */}
      <div>
        <div className="section-panel-header rounded-t-md text-xs text-muted-foreground uppercase tracking-wider font-semibold">
          Recent Threads
        </div>
        <div className="section-panel">
          {profile.threads.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <MessageSquare className="h-10 w-10" />
              </div>
              <p className="empty-state-title">No threads yet</p>
              <p className="empty-state-text">
                {isOwner
                  ? "No public threads yet. Browse a forum when you are ready to start one."
                  : "No public threads yet."}
              </p>
              {isOwner && (
                <Link
                  href="/forums"
                  className="mt-4 inline-flex items-center rounded-md border-2 border-border bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[2px_2px_0px_var(--border)] hover:no-underline"
                >
                  Browse forums
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {profile.threads.map((thread) => (
                <div key={thread.id} className="row-dense">
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/forum/${thread.forum.slug}/${thread.slug}`}
                      className="text-sm font-semibold hover:text-link hover:no-underline leading-snug"
                    >
                      {thread.title}
                    </Link>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      in {thread.forum.name} · {new Date(thread.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {profile.nextThreadCursor && (
          <div className="border-t border-border px-4 py-3 text-center">
            <Link
              href={buildCursorHref(`/u/${profile.username}`, {}, profile.nextThreadCursor)}
              className="inline-flex min-h-[44px] items-center rounded-md border-2 border-border bg-background px-4 py-2 text-sm font-semibold shadow-[2px_2px_0px_var(--border)] hover:no-underline"
            >
              Next page
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
