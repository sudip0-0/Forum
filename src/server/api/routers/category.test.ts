import { describe, expect, it, vi } from "vitest";
import type { Category } from "@prisma/client";
import { appRouter } from "@/server/api/root";
import type { TrpcContext } from "@/server/api/trpc";

function createCaller(ctx: TrpcContext) {
  return appRouter.createCaller(ctx);
}

const adminSession: TrpcContext["session"] = {
  user: { id: "admin-1", email: "admin@example.com", name: "Admin", role: "ADMIN" },
  expires: new Date(Date.now() + 3600000).toISOString(),
};

const memberSession: TrpcContext["session"] = {
  user: { id: "member-1", email: "member@example.com", name: "Member", role: "MEMBER" },
  expires: new Date(Date.now() + 3600000).toISOString(),
};

function makeCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: "cat-1",
    name: "General",
    slug: "general",
    description: null,
    sectionId: "section-1",
    sortOrder: 0,
    isPublic: true,
    isLocked: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Category;
}

describe("category router", () => {
  describe("listPublic", () => {
    it("returns visible categories sorted by sortOrder", async () => {
      const cats = [
        makeCategory({ id: "cat-1", name: "A", sortOrder: 1, isPublic: true }),
        makeCategory({ id: "cat-2", name: "B", sortOrder: 0, isPublic: true }),
      ];

      const db = {
        category: {
          findMany: vi.fn().mockResolvedValue([cats[1], cats[0]]),
        },
      };

      const caller = createCaller({ db: db as never, session: null });
      const result = await caller.category.listPublic();

      expect(db.category.findMany).toHaveBeenCalledWith({
        where: { isPublic: true, section: { isPublic: true } },
        orderBy: { sortOrder: "asc" },
      });
      expect(result).toHaveLength(2);
      expect(result[0].sortOrder).toBe(0);
    });

    it("excludes non-public categories", async () => {
      const db = {
        section: { findFirst: vi.fn().mockResolvedValue({ id: "section-1" }) },
        category: {
          findMany: vi.fn().mockResolvedValue([
            makeCategory({ id: "cat-1", isPublic: true }),
          ]),
        },
      };

      const caller = createCaller({ db: db as never, session: null });
      const result = await caller.category.listPublic();

      expect(db.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isPublic: true, section: { isPublic: true } } }),
      );
      expect(result).toHaveLength(1);
    });

    it("works for guests (no session)", async () => {
      const db = {
        category: {
          findMany: vi.fn().mockResolvedValue([]),
        },
      };

      const caller = createCaller({ db: db as never, session: null });
      await expect(caller.category.listPublic()).resolves.toEqual([]);
    });
  });

  describe("create", () => {
    it("allows admin to create a category", async () => {
      const slug = "general";
      const db = {
        category: {
          findUnique: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue(makeCategory({ name: "General", slug })),
        },
      };

      const caller = createCaller({ db: db as never, session: adminSession });
      const result = await caller.category.create({
        sectionId: "section-1",
        name: "General",
        description: "General chat",
      });

      expect(result.name).toBe("General");
      expect(result.slug).toBe("general");
    });

    it("rejects duplicate slug with CONFLICT", async () => {
      const db = {
        category: {
          findUnique: vi.fn().mockResolvedValue(makeCategory()),
          create: vi.fn(),
        },
      };

      const caller = createCaller({ db: db as never, session: adminSession });
      await expect(
        caller.category.create({ name: "General" }),
      ).rejects.toMatchObject({ code: "CONFLICT" });
    });

    it("rejects creation by member", async () => {
      const db = {
        category: {
          findUnique: vi.fn(),
          create: vi.fn(),
        },
      };

      const caller = createCaller({ db: db as never, session: memberSession });
      await expect(
        caller.category.create({ name: "General" }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("rejects creation by guest (no session)", async () => {
      const db = {
        category: {
          findUnique: vi.fn(),
          create: vi.fn(),
        },
      };

      const caller = createCaller({ db: db as never, session: null });
      await expect(
        caller.category.create({ name: "General" }),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });
  });

  describe("update", () => {
    it("allows admin to update a category", async () => {
      const db = {
        category: {
          findUnique: vi.fn().mockResolvedValue(makeCategory()),
          update: vi.fn().mockResolvedValue(
            makeCategory({ name: "Updated", slug: "updated", description: "desc" }),
          ),
        },
      };

      const caller = createCaller({ db: db as never, session: adminSession });
      const result = await caller.category.update({
        id: "cat-1",
        name: "Updated",
        description: "desc",
      });

      expect(result.name).toBe("Updated");
      expect(result.description).toBe("desc");
    });

    it("rejects slug change to existing slug", async () => {
      const db = {
        category: {
          findUnique: vi
            .fn()
            .mockResolvedValueOnce(makeCategory({ id: "cat-1", slug: "original" }))
            .mockResolvedValueOnce(makeCategory({ id: "cat-2", slug: "taken" })),
          update: vi.fn(),
        },
      };

      const caller = createCaller({ db: db as never, session: adminSession });
      await expect(
        caller.category.update({ id: "cat-1", slug: "taken" }),
      ).rejects.toMatchObject({ code: "CONFLICT" });
    });

    it("rejects update by member", async () => {
      const db = {
        category: {
          findUnique: vi.fn(),
          update: vi.fn(),
        },
      };

      const caller = createCaller({ db: db as never, session: memberSession });
      await expect(
        caller.category.update({ id: "cat-1", name: "Hacked" }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("returns NOT_FOUND for non-existent category", async () => {
      const db = {
        category: {
          findUnique: vi.fn().mockResolvedValue(null),
          update: vi.fn(),
        },
      };

      const caller = createCaller({ db: db as never, session: adminSession });
      await expect(
        caller.category.update({ id: "nonexistent", name: "NewName" }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  describe("reorder", () => {
    it("allows admin to reorder categories", async () => {
      const db = {
        $transaction: vi.fn().mockResolvedValue([]),
        category: {
          findMany: vi.fn().mockResolvedValue([]),
          update: vi.fn().mockResolvedValue(makeCategory()),
        },
      };

      const caller = createCaller({ db: db as never, session: adminSession });
      await expect(
        caller.category.reorder({
          items: [
            { id: "cat-1", sortOrder: 0 },
            { id: "cat-2", sortOrder: 1 },
          ],
        }),
      ).resolves.toEqual([]);
    });

    it("rejects reorder by member", async () => {
      const db = {
        $transaction: vi.fn(),
        category: {
          findMany: vi.fn(),
          update: vi.fn(),
        },
      };

      const caller = createCaller({ db: db as never, session: memberSession });
      await expect(
        caller.category.reorder({
          items: [{ id: "cat-1", sortOrder: 0 }],
        }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });
  });

  describe("softDelete", () => {
    it("allows admin to soft-delete a category", async () => {
      const db = {
        category: {
          findUnique: vi.fn().mockResolvedValue(makeCategory()),
          update: vi.fn().mockResolvedValue(makeCategory({ isPublic: false })),
        },
      };

      const caller = createCaller({ db: db as never, session: adminSession });
      const result = await caller.category.softDelete({ id: "cat-1" });

      expect(result.isPublic).toBe(false);
    });

    it("returns NOT_FOUND for non-existent category", async () => {
      const db = {
        category: {
          findUnique: vi.fn().mockResolvedValue(null),
          update: vi.fn(),
        },
      };

      const caller = createCaller({ db: db as never, session: adminSession });
      await expect(
        caller.category.softDelete({ id: "nonexistent" }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("rejects soft-delete by member", async () => {
      const db = {
        category: {
          findUnique: vi.fn(),
          update: vi.fn(),
        },
      };

      const caller = createCaller({ db: db as never, session: memberSession });
      await expect(
        caller.category.softDelete({ id: "cat-1" }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("rejects soft-delete by guest", async () => {
      const db = {
        category: {
          findUnique: vi.fn(),
          update: vi.fn(),
        },
      };

      const caller = createCaller({ db: db as never, session: null });
      await expect(
        caller.category.softDelete({ id: "cat-1" }),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });
  });

  describe("validation", () => {
    it("rejects create with empty name", async () => {
      const db = { category: { findUnique: vi.fn(), create: vi.fn() } };
      const caller = createCaller({ db: db as never, session: adminSession });
      await expect(caller.category.create({ name: "" })).rejects.toThrow();
    });

    it("rejects create with name too short", async () => {
      const db = { category: { findUnique: vi.fn(), create: vi.fn() } };
      const caller = createCaller({ db: db as never, session: adminSession });
      await expect(caller.category.create({ name: "X" })).rejects.toThrow();
    });

    it("rejects update with empty id", async () => {
      const db = { category: { findUnique: vi.fn(), update: vi.fn() } };
      const caller = createCaller({ db: db as never, session: adminSession });
      await expect(caller.category.update({ id: "", name: "X" })).rejects.toThrow();
    });

    it("rejects soft-delete with empty id", async () => {
      const db = { category: { findUnique: vi.fn(), update: vi.fn() } };
      const caller = createCaller({ db: db as never, session: adminSession });
      await expect(caller.category.softDelete({ id: "" })).rejects.toThrow();
    });
  });

  describe("getBySlug", () => {
    it("returns a public category with its section and public forums", async () => {
      const db = {
        category: {
          findUnique: vi.fn().mockResolvedValue({
            id: "cat-1",
            name: "General",
            slug: "general",
            description: "Desc",
            isPublic: true,
            section: { id: "sec-1", name: "Community", slug: "community", isPublic: true },
            forums: [
              { id: "f-1", name: "Chat", slug: "chat", description: null, isPublic: true },
            ],
          }),
        },
      };
      const caller = createCaller({ db: db as never, session: null });
      const result = await caller.category.getBySlug({ slug: "general" });
      expect(result.name).toBe("General");
      expect(result.section.name).toBe("Community");
      expect(result.forums).toHaveLength(1);
    });

    it("returns NOT_FOUND for hidden category", async () => {
      const db = {
        category: {
          findUnique: vi.fn().mockResolvedValue({
            id: "cat-1", name: "Hidden", slug: "hidden", isPublic: false,
            section: { isPublic: true },
          }),
        },
      };
      const caller = createCaller({ db: db as never, session: null });
      await expect(caller.category.getBySlug({ slug: "hidden" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("returns NOT_FOUND when parent section is hidden", async () => {
      const db = {
        category: {
          findUnique: vi.fn().mockResolvedValue({
            id: "cat-1", name: "Cat", slug: "cat", isPublic: true,
            section: { isPublic: false },
          }),
        },
      };
      const caller = createCaller({ db: db as never, session: null });
      await expect(caller.category.getBySlug({ slug: "cat" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("returns NOT_FOUND for non-existent slug", async () => {
      const db = {
        category: { findUnique: vi.fn().mockResolvedValue(null) },
      };
      const caller = createCaller({ db: db as never, session: null });
      await expect(caller.category.getBySlug({ slug: "nope" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("works for guests", async () => {
      const db = {
        category: {
          findUnique: vi.fn().mockResolvedValue({
            id: "cat-1", name: "Cat", slug: "cat", isPublic: true,
            section: { id: "sec-1", name: "S", slug: "s", isPublic: true },
            forums: [],
          }),
        },
      };
      const caller = createCaller({ db: db as never, session: null });
      await expect(caller.category.getBySlug({ slug: "cat" })).resolves.toBeDefined();
    });
  });
});
