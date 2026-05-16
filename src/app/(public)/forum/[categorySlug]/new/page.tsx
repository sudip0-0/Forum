import { redirect, notFound } from "next/navigation";
import { auth } from "@/server/auth/config";
import { appRouter } from "@/server/api/root";
import { db } from "@/server/db/prisma";
import { NewThreadForm } from "./client";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";

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
      <Breadcrumbs
        items={[
          { label: "Forums", href: "/forums" },
          { label: forum.category.section.name },
          { label: forum.category.name, href: `/category/${forum.category.slug}` },
          { label: forum.name, href: `/forum/${forum.slug}` },
          { label: "New thread" },
        ]}
        className="mb-4"
      />
      <div className="page-header">
        <h1 className="heading-xl">New Thread in {forum.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          You are posting in <span className="font-medium text-foreground">{forum.name}</span>.
          Use a clear title and enough detail for others to understand the discussion.
        </p>
      </div>
      <div className="mt-6">
        <NewThreadForm categorySlug={categorySlug} forumId={forum.id} forumName={forum.name} />
      </div>
    </main>
  );
}
