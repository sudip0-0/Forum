import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { appRouter } from "@/server/api/root";
import { auth } from "@/server/auth/config";
import { db } from "@/server/db/prisma";
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
    return {
      title: profile.displayName ?? profile.username,
      description,
    };
  } catch {
    return { title: "Profile" };
  }
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
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
    profile = await caller.user.getPublicProfile({ username });
  } catch {
    notFound();
  }

  const isOwner = session?.user?.id === profile.id;

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      {/* Profile Header */}
      <div className="page-header-hero">
        <div className="flex items-start gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-border bg-primary/15 text-2xl font-bold text-primary shadow-[2px_2px_0px_var(--border)] sm:h-20 sm:w-20 sm:text-3xl">
            {(profile.displayName ?? profile.username).slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="heading-xl">
              {profile.displayName ?? profile.username}
            </h1>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
            {profile.role !== "MEMBER" && (
              <span className={profile.role === "ADMIN" ? "badge-orange mt-2" : "badge-blue mt-2"}>
                {profile.role === "ADMIN" ? "Admin" : "Moderator"}
              </span>
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
                  ? "You haven&apos;t created any threads yet."
                  : "This user hasn&apos;t created any threads yet."}
              </p>
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
      </div>
    </div>
  );
}
