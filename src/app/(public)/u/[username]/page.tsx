import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { appRouter } from "@/server/api/root";
import { auth } from "@/server/auth/config";
import { db } from "@/server/db/prisma";
import { ProfileEditForm } from "./client";

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
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold">
        {profile.displayName ?? profile.username}
      </h1>
      <p className="text-sm text-muted-foreground">@{profile.username}</p>
      {profile.bio && <p className="mt-2 text-sm">{profile.bio}</p>}
      <p className="mt-1 text-xs text-muted-foreground">
        Joined {new Date(profile.createdAt).toLocaleDateString()}
      </p>

      {isOwner && (
        <div className="mt-4">
          <ProfileEditForm
            username={username}
            initialDisplayName={profile.displayName ?? ""}
            initialBio={profile.bio ?? ""}
          />
        </div>
      )}

      <h2 className="mt-8 text-lg font-medium">Recent Threads</h2>
      {profile.threads.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">No threads yet.</p>
      ) : (
        <ul className="mt-3 divide-y rounded-lg border">
          {profile.threads.map((thread) => (
            <li key={thread.id} className="px-4 py-3">
              <Link
                href={`/forum/${thread.forum.slug}/${thread.slug}`}
                className="text-sm font-medium hover:underline"
              >
                {thread.title}
              </Link>
              <div className="mt-1 text-xs text-muted-foreground">
                in {thread.forum.name} · {new Date(thread.createdAt).toLocaleDateString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
