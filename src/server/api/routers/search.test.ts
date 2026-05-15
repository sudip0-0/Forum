import { describe, expect, it, vi } from "vitest";
import { appRouter } from "@/server/api/root";
import type { TrpcContext } from "@/server/api/trpc";

function createCaller(ctx: TrpcContext) {
  return appRouter.createCaller(ctx);
}

describe("search router", () => {
  it("returns results from raw query", async () => {
    const results = [
      { id: "t1", title: "Hello World", slug: "hello-world", createdAt: new Date(), authorUsername: "user1", authorDisplayName: null, categorySlug: "general", categoryName: "General" },
    ];
    const db = { $queryRawUnsafe: vi.fn().mockResolvedValue(results) };

    const caller = createCaller({ db: db as never, session: null });
    const result = await caller.search.query({ q: "hello" });

    expect(result.results).toHaveLength(1);
    expect(result.results[0].title).toBe("Hello World");
  });

  it("returns empty for no matches", async () => {
    const db = { $queryRawUnsafe: vi.fn().mockResolvedValue([]) };

    const caller = createCaller({ db: db as never, session: null });
    const result = await caller.search.query({ q: "nonexistent" });
    expect(result.results).toHaveLength(0);
  });

  it("rejects empty query", async () => {
    const db = { $queryRawUnsafe: vi.fn() };
    const caller = createCaller({ db: db as never, session: null });
    await expect(caller.search.query({ q: "" })).rejects.toThrow();
  });

  it("works for guest (public query)", async () => {
    const db = { $queryRawUnsafe: vi.fn().mockResolvedValue([]) };
    const caller = createCaller({ db: db as never, session: null });
    const result = await caller.search.query({ q: "test" });
    expect(result.results).toEqual([]);
  });

  it("handles special characters without crashing", async () => {
    const db = { $queryRawUnsafe: vi.fn().mockResolvedValue([]) };
    const caller = createCaller({ db: db as never, session: null });

    // These would crash with manual to_tsquery but websearch_to_tsquery handles them
    const result = await caller.search.query({ q: "it's a test" });
    expect(result.results).toEqual([]);

    const result2 = await caller.search.query({ q: "c++ programming" });
    expect(result2.results).toEqual([]);

    const result3 = await caller.search.query({ q: "foo & bar | baz" });
    expect(result3.results).toEqual([]);
  });

  it("rejects invalid cursor format", async () => {
    const db = { $queryRawUnsafe: vi.fn() };
    const caller = createCaller({ db: db as never, session: null });
    await expect(caller.search.query({ q: "test", cursor: { createdAt: "not-a-date", id: "'; DROP TABLE--" } })).rejects.toThrow();
  });

  it("supports forum filter", async () => {
    const db = { $queryRawUnsafe: vi.fn().mockResolvedValue([]) };
    const caller = createCaller({ db: db as never, session: null });
    const result = await caller.search.query({ q: "test", forumSlug: "announcements" });
    expect(result.results).toEqual([]);
    // verify the SQL includes the forum slug
    const sql = db.$queryRawUnsafe.mock.calls[0][0];
    expect(sql).toContain("f.slug");
  });

  it("supports author filter", async () => {
    const db = { $queryRawUnsafe: vi.fn().mockResolvedValue([]) };
    const caller = createCaller({ db: db as never, session: null });
    const result = await caller.search.query({ q: "test", authorUsername: "john" });
    expect(result.results).toEqual([]);
  });

  it("supports tag filter", async () => {
    const db = { $queryRawUnsafe: vi.fn().mockResolvedValue([]) };
    const caller = createCaller({ db: db as never, session: null });
    const result = await caller.search.query({ q: "test", tagSlug: "help" });
    expect(result.results).toEqual([]);
  });

  it("supports date range filter", async () => {
    const db = { $queryRawUnsafe: vi.fn().mockResolvedValue([]) };
    const caller = createCaller({ db: db as never, session: null });
    const result = await caller.search.query({ q: "test", dateFrom: "2026-01-01", dateTo: "2026-12-31" });
    expect(result.results).toEqual([]);
  });
});
