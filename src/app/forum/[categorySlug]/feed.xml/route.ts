import { db } from "@/server/db/prisma";
import { isPublicForumVisible } from "@/server/db/visibility";

export async function GET(
  _request: Request,
  context: { params: Promise<{ categorySlug: string }> },
) {
  const { categorySlug } = await context.params;
  const forum = await db.forum.findUnique({
    where: { slug: categorySlug },
    include: { category: { include: { section: true } } },
  });
  if (!forum || !isPublicForumVisible(forum)) {
    return new Response("Not found", { status: 404 });
  }

  const threads = await db.thread.findMany({
    where: { forumId: forum.id, isDeleted: false },
    orderBy: { lastActivityAt: "desc" },
    take: 40,
    select: { title: true, slug: true, createdAt: true },
  });

  const site = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const items = threads
    .map(
      (t) => `
    <item>
      <title><![CDATA[${t.title}]]></title>
      <link>${site}/forum/${forum.slug}/${t.slug}</link>
      <guid>${site}/forum/${forum.slug}/${t.slug}</guid>
      <pubDate>${t.createdAt.toUTCString()}</pubDate>
    </item>`,
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title><![CDATA[${forum.name} — Forum]]></title>
    <link>${site}/forum/${forum.slug}</link>
    <description><![CDATA[${forum.description ?? forum.name}]]></description>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
