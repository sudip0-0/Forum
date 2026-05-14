import { z } from "zod";
import { publicProcedure, router } from "@/server/api/trpc";

const querySchema = z.object({
  q: z.string().min(1).max(100),
  cursor: z.string().regex(/^[a-z0-9]+$/, "Invalid cursor").optional(),
  limit: z.number().min(1).max(50).default(20),
});

export const searchRouter = router({
  query: publicProcedure
    .input(querySchema)
    .query(async ({ ctx, input }) => {
      const results = await ctx.db.$queryRawUnsafe<
        {
          id: string;
          title: string;
          slug: string;
          createdAt: Date;
          authorUsername: string;
          authorDisplayName: string | null;
          categorySlug: string;
          categoryName: string;
        }[]
      >(
        `SELECT DISTINCT ON (t."lastActivityAt", t.id)
          t.id, t.title, t.slug, t."createdAt",
          u.username AS "authorUsername",
          u."displayName" AS "authorDisplayName",
          c.slug AS "categorySlug",
          c.name AS "categoryName"
        FROM "Thread" t
        JOIN "User" u ON u.id = t."authorId"
        JOIN "Category" c ON c.id = t."categoryId"
        LEFT JOIN "Post" p ON p."threadId" = t.id AND p."isDeleted" = false
        WHERE t."isDeleted" = false
          AND (
            to_tsvector('english', t.title) @@ websearch_to_tsquery('english', $1)
            OR to_tsvector('english', p.content) @@ websearch_to_tsquery('english', $1)
          )
          ${input.cursor ? `AND t.id < $3` : ""}
        ORDER BY t."lastActivityAt" DESC, t.id DESC
        LIMIT $2`,
        ...(input.cursor
          ? [input.q.trim(), input.limit + 1, input.cursor]
          : [input.q.trim(), input.limit + 1]),
      );

      let nextCursor: string | undefined;
      if (results.length > input.limit) {
        nextCursor = results.pop()!.id;
      }

      return { results, nextCursor };
    }),
});
