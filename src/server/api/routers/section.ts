import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, roleProcedure, router } from "@/server/api/trpc";
import { slugify } from "@/lib/slug";

const createSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().default(true),
  isLocked: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
});

const updateSchema = createSchema.partial().extend({ id: z.string().min(1) });
const idSchema = z.object({ id: z.string().min(1) });
const reorderSchema = z.object({
  items: z.array(z.object({ id: z.string().min(1), sortOrder: z.number().int().min(0) })).min(1),
});

export const sectionRouter = router({
  listPublicTree: publicProcedure.query(({ ctx }) =>
    ctx.db.section.findMany({
      where: { isPublic: true },
      orderBy: { sortOrder: "asc" },
      include: {
        categories: {
          where: { isPublic: true },
          orderBy: { sortOrder: "asc" },
          include: {
            forums: {
              where: { isPublic: true },
              orderBy: { sortOrder: "asc" },
            },
          },
        },
      },
    }),
  ),

  listAll: roleProcedure(["ADMIN"]).query(({ ctx }) =>
    ctx.db.section.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        categories: {
          orderBy: { sortOrder: "asc" },
          include: { forums: { orderBy: { sortOrder: "asc" } } },
        },
      },
    }),
  ),

  create: roleProcedure(["ADMIN"]).input(createSchema).mutation(async ({ ctx, input }) => {
    const slug = slugify(input.name);
    const existing = await ctx.db.section.findUnique({ where: { slug } });
    if (existing) throw new TRPCError({ code: "CONFLICT", message: "Section slug already exists." });
    return ctx.db.section.create({ data: { ...input, slug, description: input.description ?? null } });
  }),

  update: roleProcedure(["ADMIN"]).input(updateSchema).mutation(async ({ ctx, input }) => {
    const section = await ctx.db.section.findUnique({ where: { id: input.id } });
    if (!section) throw new TRPCError({ code: "NOT_FOUND", message: "Section not found." });
    const slug = input.name ? slugify(input.name) : undefined;
    if (slug && slug !== section.slug) {
      const existing = await ctx.db.section.findUnique({ where: { slug } });
      if (existing && existing.id !== section.id) {
        throw new TRPCError({ code: "CONFLICT", message: "Section slug already exists." });
      }
    }
    return ctx.db.section.update({
      where: { id: input.id },
      data: {
        name: input.name,
        slug,
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
        ctx.db.section.update({ where: { id: item.id }, data: { sortOrder: item.sortOrder } }),
      ),
    );
    return { success: true };
  }),

  softDelete: roleProcedure(["ADMIN"]).input(idSchema).mutation(async ({ ctx, input }) => {
    const section = await ctx.db.section.findUnique({ where: { id: input.id } });
    if (!section) throw new TRPCError({ code: "NOT_FOUND", message: "Section not found." });

    return ctx.db.section.update({
      where: { id: input.id },
      data: { isPublic: false },
    });
  }),
});
