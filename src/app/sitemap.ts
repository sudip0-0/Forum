import type { MetadataRoute } from "next";
import { db } from "@/server/db/prisma";

export const revalidate = 3600;
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const entries: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/forums`,
      lastModified: new Date(),
    },
  ];

  const forums = await db.forum.findMany({
    where: { isPublic: true },
    select: { slug: true, updatedAt: true },
  });

  for (const forum of forums) {
    entries.push({
      url: `${baseUrl}/forum/${forum.slug}`,
      lastModified: forum.updatedAt,
    });
  }

  const threads = await db.thread.findMany({
    where: {
      isDeleted: false,
      forum: { isPublic: true },
    },
    select: {
      slug: true,
      updatedAt: true,
      forum: { select: { slug: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 5000,
  });

  for (const t of threads) {
    entries.push({
      url: `${baseUrl}/forum/${t.forum.slug}/${t.slug}`,
      lastModified: t.updatedAt,
    });
  }

  return entries;
}
