import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, roleProcedure, router } from "@/server/api/trpc";

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const createSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().default(true),
  isLocked: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
});

const updateSchema = createSchema.partial().extend({ id: z.string().min(1) });
const reorderSchema = z.object({
  items: z.array(z.object({ id: z.string().min(1), sortOrder: z.number().int().min(0) })).min(1),
});

export const forumRouter = router({
  getBySlug: publicProcedure.input(z.object({ slug: z.string().min(1) })).query(async ({ ctx, input }) => {
    const forum = await ctx.db.forum.findUnique({
      where: { slug: input.slug },
      include: {
        category: { include: { section: true } },
      },
    });
    if (!forum || !forum.isPublic || !forum.category.isPublic || !forum.category.section.isPublic) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Forum not found." });
    }
    return forum;
  }),

  listAll: roleProcedure(["ADMIN"]).query(({ ctx }) =>
    ctx.db.forum.findMany({
      orderBy: { sortOrder: "asc" },
      include: { category: { select: { id: true, name: true } } },
    }),
  ),

  listForModeration: roleProcedure(["MODERATOR", "ADMIN"]).query(({ ctx }) =>
    ctx.db.forum.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, slug: true },
    }),
  ),

  create: roleProcedure(["ADMIN"]).input(createSchema).mutation(async ({ ctx, input }) => {
    const slug = slugify(input.name);
    const existing = await ctx.db.forum.findUnique({ where: { slug } });
    if (existing) throw new TRPCError({ code: "CONFLICT", message: "Forum slug already exists." });
    return ctx.db.forum.create({ data: { ...input, slug, description: input.description ?? null } });
  }),

  update: roleProcedure(["ADMIN"]).input(updateSchema).mutation(async ({ ctx, input }) => {
    const forum = await ctx.db.forum.findUnique({ where: { id: input.id } });
    if (!forum) throw new TRPCError({ code: "NOT_FOUND", message: "Forum not found." });
    return ctx.db.forum.update({
      where: { id: input.id },
      data: {
        categoryId: input.categoryId,
        name: input.name,
        slug: input.name ? slugify(input.name) : undefined,
        description: input.description,
        isPublic: input.isPublic,
        isLocked: input.isLocked,
        sortOrder: input.sortOrder,
      },
    });
  }),

  reorder: roleProcedure(["ADMIN"]).input(reorderSchema).mutation(async ({ ctx, input }) => {
    await ctx.db.$transaction(
      input.items.map((item) =>
        ctx.db.forum.update({ where: { id: item.id }, data: { sortOrder: item.sortOrder } }),
      ),
    );
    return { success: true };
  }),
});
