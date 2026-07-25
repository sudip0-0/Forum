import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  categoryFindMany: vi.fn(),
  forumFindMany: vi.fn(),
  threadFindMany: vi.fn(),
}));

vi.mock("@/server/db/prisma", () => ({
  db: {
    category: { findMany: mocks.categoryFindMany },
    forum: { findMany: mocks.forumFindMany },
    thread: { findMany: mocks.threadFindMany },
  },
}));

import sitemap from "./sitemap";

describe("sitemap route", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://forum.example/");
    mocks.categoryFindMany.mockReset().mockResolvedValue([]);
    mocks.forumFindMany.mockReset().mockResolvedValue([]);
    mocks.threadFindMany.mockReset().mockResolvedValue([]);
  });

  it("requests only public visible content and emits canonical public URLs", async () => {
    mocks.categoryFindMany.mockResolvedValue([{ slug: "general", updatedAt: new Date("2026-05-16T00:00:00.000Z") }]);
    mocks.forumFindMany.mockResolvedValue([{ slug: "general-discussion", updatedAt: new Date("2026-05-16T00:00:00.000Z") }]);
    mocks.threadFindMany.mockResolvedValue([
      {
        slug: "welcome",
        updatedAt: new Date("2026-05-16T00:00:00.000Z"),
        forum: { slug: "general-discussion" },
      },
    ]);

    const result = await sitemap();

    expect(mocks.categoryFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        isPublic: true,
        isDeleted: false,
        section: { isPublic: true, isDeleted: false },
      },
    }));
    expect(mocks.forumFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        isPublic: true,
        isDeleted: false,
        category: {
          isPublic: true,
          isDeleted: false,
          section: { isPublic: true, isDeleted: false },
        },
      },
    }));
    expect(mocks.threadFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        isDeleted: false,
        forum: {
          isPublic: true,
          isDeleted: false,
          category: {
            isPublic: true,
            isDeleted: false,
            section: { isPublic: true, isDeleted: false },
          },
        },
      },
    }));
    expect(result.map((entry) => entry.url)).toEqual([
      "https://forum.example/",
      "https://forum.example/forums",
      "https://forum.example/category/general",
      "https://forum.example/forum/general-discussion",
      "https://forum.example/forum/general-discussion/welcome",
    ]);
  });
});
