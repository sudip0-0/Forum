import { redirect, notFound } from "next/navigation";
import { auth } from "@/server/auth/config";
import { appRouter } from "@/server/api/root";
import { db } from "@/server/db/prisma";
import { NewThreadForm } from "./client";

export default async function NewThreadPage({
  params,
}: {
  params: Promise<{ categorySlug: string }>;
}) {
  const { categorySlug } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const caller = appRouter.createCaller({
    db,
    session: {
      user: {
        id: session.user.id,
        email: session.user.email ?? "",
        name: session.user.name ?? null,
        role: session.user.role,
      },
      expires: session.expires,
    },
  });

  let forum;
  try {
    forum = await caller.forum.getBySlug({ slug: categorySlug });
  } catch {
    notFound();
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold">New Thread in {forum.name}</h1>
      <div className="mt-6">
        <NewThreadForm categorySlug={categorySlug} forumId={forum.id} />
      </div>
    </main>
  );
}
