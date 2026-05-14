import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router, roleProcedure } from "@/server/api/trpc";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const createSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
});

const updateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2).max(100).optional(),
  slug: z
    .string()
    .min(1)
    .max(150)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens only")
    .optional(),
  description: z.string().max(500).nullable().optional(),
  isPublic: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

const reorderSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        sortOrder: z.number().int().min(0),
      }),
    )
    .min(1),
});

export const categoryRouter = router({
  listPublic: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.category.findMany({
      where: { isPublic: true },
      orderBy: { sortOrder: "asc" },
    });
  }),

  listAll: roleProcedure(["ADMIN"]).query(async ({ ctx }) => {
    return ctx.db.category.findMany({
      orderBy: { sortOrder: "asc" },
    });
  }),

  create: roleProcedure(["ADMIN"])
    .input(createSchema)
    .mutation(async ({ ctx, input }) => {
      const slug = slugify(input.name);

      const existing = await ctx.db.category.findUnique({ where: { slug } });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `A category with slug "${slug}" already exists.`,
        });
      }

      return ctx.db.category.create({
        data: {
          name: input.name,
          slug,
          description: input.description ?? null,
          isPublic: input.isPublic,
          sortOrder: input.sortOrder,
        },
      });
    }),

  update: roleProcedure(["ADMIN"])
    .input(updateSchema)
    .mutation(async ({ ctx, input }) => {
      const category = await ctx.db.category.findUnique({
        where: { id: input.id },
      });

      if (!category) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Category not found." });
      }

      if (input.slug && input.slug !== category.slug) {
        const existing = await ctx.db.category.findUnique({
          where: { slug: input.slug },
        });
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `A category with slug "${input.slug}" already exists.`,
          });
        }
      }

      const slug =
        input.slug ??
        (input.name ? slugify(input.name) : category.slug);

      return ctx.db.category.update({
        where: { id: input.id },
        data: {
          name: input.name,
          slug,
          description: input.description,
          isPublic: input.isPublic,
          sortOrder: input.sortOrder,
        },
      });
    }),

  reorder: roleProcedure(["ADMIN"])
    .input(reorderSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.db.$transaction(
        input.items.map((item) =>
          ctx.db.category.update({
            where: { id: item.id },
            data: { sortOrder: item.sortOrder },
          }),
        ),
      );

      return ctx.db.category.findMany({
        orderBy: { sortOrder: "asc" },
      });
    }),

  softDelete: roleProcedure(["ADMIN"])
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const category = await ctx.db.category.findUnique({
        where: { id: input.id },
      });

      if (!category) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Category not found." });
      }

      return ctx.db.category.update({
        where: { id: input.id },
        data: { isPublic: false },
      });
    }),
});
