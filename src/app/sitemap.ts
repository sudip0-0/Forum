import type { MetadataRoute } from "next";
import { db } from "@/server/db/prisma";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const entries: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/forums`,
      lastModified: new Date(),
    },
  ];

  const categories = await db.category.findMany({
    where: { isPublic: true },
    select: { slug: true, updatedAt: true },
  });

  for (const cat of categories) {
    entries.push({
      url: `${baseUrl}/forum/${cat.slug}`,
      lastModified: cat.updatedAt,
    });
  }

  const threads = await db.thread.findMany({
    where: {
      isDeleted: false,
      category: { isPublic: true },
    },
    select: {
      slug: true,
      updatedAt: true,
      category: { select: { slug: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 5000,
  });

  for (const t of threads) {
    entries.push({
      url: `${baseUrl}/forum/${t.category.slug}/${t.slug}`,
      lastModified: t.updatedAt,
    });
  }

  return entries;
}
