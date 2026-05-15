import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, roleProcedure, router } from "@/server/api/trpc";

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const createSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().default(true),
  isLocked: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
});

const updateSchema = createSchema.partial().extend({ id: z.string().min(1) });

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
    ctx.db.section.findMany({ orderBy: { sortOrder: "asc" } }),
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
    return ctx.db.section.update({
      where: { id: input.id },
      data: {
        name: input.name,
        slug: input.name ? slugify(input.name) : undefined,
        description: input.description,
        isPublic: input.isPublic,
        isLocked: input.isLocked,
        sortOrder: input.sortOrder,
      },
    });
  }),
});
