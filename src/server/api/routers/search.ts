import { z } from "zod";
import { Prisma } from "@prisma/client";
import { publicProcedure, router } from "@/server/api/trpc";
import { checkRateLimit, RL_SEARCH } from "@/server/api/rate-limit";

const querySchema = z.object({
  q: z.string().min(1).max(100),
  forumSlug: z.string().max(100).optional(),
  tagSlug: z.string().max(100).optional(),
  authorUsername: z.string().max(50).optional(),
  dateFrom: z.string().date().optional(),
  dateTo: z.string().date().optional(),
  cursor: z
    .object({
      createdAt: z.string().datetime(),
      id: z.string().min(1),
    })
    .optional(),
  limit: z.number().int().min(1).max(50).default(20),
});

type SearchRow = {
  id: string;
  title: string;
  slug: string;
  createdAt: Date;
  authorUsername: string;
  authorDisplayName: string | null;
  forumSlug: string;
  forumName: string;
  tags: { id: string; name: string; slug: string }[];
  snippet: string;
  matchedPostId: string;
};

export const searchRouter = router({
  query: publicProcedure.input(querySchema).query(async ({ ctx, input }) => {
    const rateLimitKey = ctx.session?.user.id ?? ctx.clientIp ?? "127.0.0.1";
    await checkRateLimit(rateLimitKey, RL_SEARCH);

    const q = input.q.trim();
    const { trackEvent } = await import("@/server/analytics/track");
    void trackEvent(ctx.db, {
      name: "search",
      userId: ctx.session?.user.id,
      meta: { q },
    });

    const { searchMeili } = await import("@/server/search/meili");
    if (
      !input.forumSlug &&
      !input.tagSlug &&
      !input.authorUsername &&
      !input.dateFrom &&
      !input.dateTo &&
      !input.cursor
    ) {
      const meiliHits = await searchMeili(q, input.limit);
      if (meiliHits && meiliHits.length > 0) {
        const threadIds = [...new Set(meiliHits.map((h) => h.threadId))];
        const threads = await ctx.db.thread.findMany({
          where: { id: { in: threadIds }, isDeleted: false },
          include: {
            author: { select: { username: true, displayName: true } },
            forum: { select: { slug: true, name: true } },
            tags: { select: { id: true, name: true, slug: true } },
            posts: {
              where: { isDeleted: false },
              orderBy: { createdAt: "asc" },
              take: 1,
              select: { id: true, content: true },
            },
          },
        });
        const byId = new Map(threads.map((t) => [t.id, t]));
        const results: SearchRow[] = meiliHits
          .map((hit) => {
            const t = byId.get(hit.threadId);
            if (!t) return null;
            return {
              id: t.id,
              title: t.title,
              slug: t.slug,
              createdAt: t.createdAt,
              authorUsername: t.author.username,
              authorDisplayName: t.author.displayName,
              forumSlug: t.forum.slug,
              forumName: t.forum.name,
              tags: t.tags,
              snippet: (hit.content || t.posts[0]?.content || "").slice(0, 200),
              matchedPostId: hit.id.startsWith("thread-")
                ? (t.posts[0]?.id ?? t.id)
                : hit.id,
            };
          })
          .filter((x): x is SearchRow => Boolean(x));
        if (results.length > 0) {
          return { results, nextCursor: null };
        }
      }
    }

    const conditions: Prisma.Sql[] = [
      Prisma.sql`t."isDeleted" = false`,
      Prisma.sql`f."isPublic" = true`,
      Prisma.sql`f."isDeleted" = false`,
      Prisma.sql`c."isPublic" = true`,
      Prisma.sql`c."isDeleted" = false`,
      Prisma.sql`s."isPublic" = true`,
      Prisma.sql`s."isDeleted" = false`,
    ];

    if (input.forumSlug) {
      conditions.push(Prisma.sql`f.slug = ${input.forumSlug}`);
    }
    if (input.authorUsername) {
      conditions.push(Prisma.sql`u.username ILIKE ${`%${input.authorUsername}%`}`);
    }
    if (input.dateFrom) {
      conditions.push(Prisma.sql`t."createdAt" >= ${`${input.dateFrom}T00:00:00.000Z`}::timestamptz`);
    }
    if (input.dateTo) {
      const nextDay = new Date(`${input.dateTo}T00:00:00.000Z`);
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);
      conditions.push(Prisma.sql`t."createdAt" < ${nextDay.toISOString()}::timestamptz`);
    }
    if (input.tagSlug) {
      conditions.push(Prisma.sql`EXISTS (
        SELECT 1 FROM "_TagToThread" tt
        JOIN "Tag" tg ON tg.id = tt."A"
        WHERE tt."B" = t.id AND tg.slug = ${input.tagSlug}
      )`);
    }
    if (input.cursor) {
      conditions.push(Prisma.sql`(
        t."createdAt" < ${input.cursor.createdAt}::timestamptz
        OR (t."createdAt" = ${input.cursor.createdAt}::timestamptz AND t.id < ${input.cursor.id})
      )`);
    }

    const whereClause = Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}`;
    const take = input.limit + 1;

    const results = await ctx.db.$queryRaw<SearchRow[]>(Prisma.sql`
      WITH matched AS (
        SELECT DISTINCT ON (t."lastActivityAt", t.id)
          t.id, t.title, t.slug, t."createdAt",
          u.username AS "authorUsername",
          u."displayName" AS "authorDisplayName",
          f.slug AS "forumSlug",
          f.name AS "forumName"
        FROM "Thread" t
        JOIN "User" u ON u.id = t."authorId"
        JOIN "Forum" f ON f.id = t."forumId"
        JOIN "Category" c ON c.id = f."categoryId"
        JOIN "Section" s ON s.id = c."sectionId"
        LEFT JOIN "Post" p ON p."threadId" = t.id AND p."isDeleted" = false
        ${whereClause}
           AND (
             to_tsvector('english', t.title) @@ websearch_to_tsquery('english', ${q})
             OR to_tsvector('english', p.content) @@ websearch_to_tsquery('english', ${q})
           )
        ORDER BY
          GREATEST(
            ts_rank(to_tsvector('english', t.title), websearch_to_tsquery('english', ${q})),
            COALESCE(ts_rank(to_tsvector('english', p.content), websearch_to_tsquery('english', ${q})), 0)
          ) DESC,
          t."lastActivityAt" DESC,
          t.id DESC
        LIMIT ${take}
      )
      SELECT
        m.*,
        COALESCE(
          (SELECT json_agg(
             json_build_object('id', tg.id, 'name', tg.name, 'slug', tg.slug)
             ORDER BY tg.name
           )
           FROM "_TagToThread" tt
           JOIN "Tag" tg ON tg.id = tt."A"
           WHERE tt."B" = m.id), '[]'::json
        ) AS tags,
        COALESCE(
          (SELECT p2.id FROM "Post" p2
           WHERE p2."threadId" = m.id AND p2."isDeleted" = false
             AND to_tsvector('english', p2.content) @@ websearch_to_tsquery('english', ${q})
           ORDER BY p2."createdAt" ASC LIMIT 1),
          (SELECT p2.id FROM "Post" p2
           WHERE p2."threadId" = m.id AND p2."isDeleted" = false
           ORDER BY p2."createdAt" ASC LIMIT 1)
        ) AS "matchedPostId",
        COALESCE(
          (SELECT LEFT(p2.content, 200) FROM "Post" p2
           WHERE p2.id = COALESCE(
             (SELECT p3.id FROM "Post" p3
              WHERE p3."threadId" = m.id AND p3."isDeleted" = false
                AND to_tsvector('english', p3.content) @@ websearch_to_tsquery('english', ${q})
              ORDER BY p3."createdAt" ASC LIMIT 1),
             (SELECT p3.id FROM "Post" p3
              WHERE p3."threadId" = m.id AND p3."isDeleted" = false
              ORDER BY p3."createdAt" ASC LIMIT 1)
           ) AND p2."isDeleted" = false),
          ''
        ) AS snippet
      FROM matched m
      ORDER BY m."createdAt" DESC
    `);

    let nextCursor: { createdAt: string; id: string } | null = null;
    if (results.length > input.limit) {
      const last = results.pop()!;
      nextCursor = {
        createdAt: last.createdAt.toISOString(),
        id: last.id,
      };
    }

    return { results, nextCursor };
  }),
});
