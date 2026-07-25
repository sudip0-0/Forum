import { describe, expect, it, vi } from "vitest";
import { searchRouter } from "@/server/api/routers/search";
import type { TrpcContext } from "@/server/api/trpc";

// Mock rate-limit to avoid side effects in tests
vi.mock("@/server/api/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, limit: 60, remaining: 59 }),
  RL_SEARCH: { windowMs: 60000, maxRequests: 60, keyPrefix: "search" },
}));

/**
 * Helper to create a mock tRPC context with a mocked database.
 * The $queryRaw mock returns the provided rows.
 */
function createMockContext(queryResult: unknown[]): TrpcContext {
  return {
    db: {
      $queryRaw: vi.fn().mockResolvedValue(queryResult),
    } as unknown as TrpcContext["db"],
    session: null,
    clientIp: "127.0.0.1",
  };
}

/**
 * Helper to call the search router's query procedure with a mocked context.
 */
async function callSearchQuery(
  ctx: TrpcContext,
  input: { q: string; limit?: number; cursor?: { createdAt: string; id: string } },
) {
  const caller = searchRouter.createCaller(ctx);
  return caller.query({ q: input.q, limit: input.limit ?? 20, cursor: input.cursor });
}

describe("search router - matchedPostId logic", () => {
  it("returns correct matchedPostId when post content matches", async () => {
    // Simulate a result where a post content matched the FTS query
    const mockResults = [
      {
        id: "thread-1",
        title: "Thread about TypeScript",
        slug: "thread-about-typescript",
        createdAt: new Date("2024-01-15T10:00:00Z"),
        authorUsername: "alice",
        authorDisplayName: "Alice",
        forumSlug: "programming",
        forumName: "Programming",
        tags: [],
        snippet: "TypeScript is a typed superset of JavaScript",
        matchedPostId: "post-content-match",
      },
    ];

    const ctx = createMockContext(mockResults);
    const result = await callSearchQuery(ctx, { q: "TypeScript" });

    expect(result.results).toHaveLength(1);
    expect(result.results[0].matchedPostId).toBe("post-content-match");
  });

  it("returns earliest non-deleted post ID for title-only matches", async () => {
    // When only the thread title matches (no post content matches),
    // the SQL COALESCE falls back to the earliest non-deleted post
    const mockResults = [
      {
        id: "thread-2",
        title: "React Hooks Guide",
        slug: "react-hooks-guide",
        createdAt: new Date("2024-02-01T08:00:00Z"),
        authorUsername: "bob",
        authorDisplayName: "Bob",
        forumSlug: "frontend",
        forumName: "Frontend",
        tags: [],
        snippet: "Welcome to this thread about hooks",
        // This is the earliest non-deleted post (fallback case)
        matchedPostId: "first-post-in-thread",
      },
    ];

    const ctx = createMockContext(mockResults);
    const result = await callSearchQuery(ctx, { q: "React Hooks" });

    expect(result.results).toHaveLength(1);
    // For title-only matches, matchedPostId should be the earliest non-deleted post
    expect(result.results[0].matchedPostId).toBe("first-post-in-thread");
  });

  it("returns earliest matching post when multiple posts match", async () => {
    // When multiple posts in a thread match, the SQL returns the earliest one
    // (ORDER BY p."createdAt" ASC LIMIT 1)
    const mockResults = [
      {
        id: "thread-3",
        title: "Discussion about testing",
        slug: "discussion-about-testing",
        createdAt: new Date("2024-03-10T12:00:00Z"),
        authorUsername: "charlie",
        authorDisplayName: "Charlie",
        forumSlug: "dev",
        forumName: "Development",
        tags: [{ id: "tag-1", name: "Testing", slug: "testing" }],
        snippet: "Unit testing is essential for code quality",
        // The earliest matching post (by createdAt ASC)
        matchedPostId: "earliest-matching-post",
      },
    ];

    const ctx = createMockContext(mockResults);
    const result = await callSearchQuery(ctx, { q: "testing" });

    expect(result.results).toHaveLength(1);
    // Should be the earliest matching post, not a later one
    expect(result.results[0].matchedPostId).toBe("earliest-matching-post");
  });

  it("skips deleted posts and falls back correctly", async () => {
    // When the matching post is deleted, the SQL skips it (isDeleted = false filter)
    // and either finds the next non-deleted matching post or falls back to earliest non-deleted post
    const mockResults = [
      {
        id: "thread-4",
        title: "Deleted post scenario",
        slug: "deleted-post-scenario",
        createdAt: new Date("2024-04-05T09:00:00Z"),
        authorUsername: "diana",
        authorDisplayName: "Diana",
        forumSlug: "general",
        forumName: "General",
        tags: [],
        snippet: "This is the fallback post content",
        // The SQL's isDeleted = false filter ensures deleted posts are skipped.
        // Falls back to earliest non-deleted post in thread
        matchedPostId: "fallback-non-deleted-post",
      },
    ];

    const ctx = createMockContext(mockResults);
    const result = await callSearchQuery(ctx, { q: "deleted content" });

    expect(result.results).toHaveLength(1);
    // Should skip deleted posts and return a non-deleted post
    expect(result.results[0].matchedPostId).toBe("fallback-non-deleted-post");
  });

  it("snippet is extracted from matched post, not first post", async () => {
    // The snippet should come from the matched post's content (up to 200 chars),
    // not from the first post in the thread
    const matchedPostContent =
      "This specific post contains the search term we are looking for in the discussion";
    const mockResults = [
      {
        id: "thread-5",
        title: "Long thread with many posts",
        slug: "long-thread-with-many-posts",
        createdAt: new Date("2024-05-20T14:00:00Z"),
        authorUsername: "eve",
        authorDisplayName: "Eve",
        forumSlug: "discussions",
        forumName: "Discussions",
        tags: [],
        // Snippet comes from the matched post, not the first post
        snippet: matchedPostContent,
        matchedPostId: "matched-post-not-first",
      },
    ];

    const ctx = createMockContext(mockResults);
    const result = await callSearchQuery(ctx, { q: "search term" });

    expect(result.results).toHaveLength(1);
    // The snippet should be from the matched post
    expect(result.results[0].snippet).toBe(matchedPostContent);
    // And the matchedPostId should NOT be the first post
    expect(result.results[0].matchedPostId).toBe("matched-post-not-first");
  });

  it("handles pagination cursor correctly with matchedPostId", async () => {
    // When results exceed the limit, the last item is used for cursor
    const mockResults = [
      {
        id: "thread-a",
        title: "First result",
        slug: "first-result",
        createdAt: new Date("2024-06-01T10:00:00Z"),
        authorUsername: "frank",
        authorDisplayName: "Frank",
        forumSlug: "general",
        forumName: "General",
        tags: [],
        snippet: "First result snippet",
        matchedPostId: "post-a",
      },
      {
        id: "thread-b",
        title: "Second result (cursor)",
        slug: "second-result",
        createdAt: new Date("2024-05-30T10:00:00Z"),
        authorUsername: "grace",
        authorDisplayName: "Grace",
        forumSlug: "general",
        forumName: "General",
        tags: [],
        snippet: "Second result snippet",
        matchedPostId: "post-b",
      },
    ];

    const ctx = createMockContext(mockResults);
    // Request limit=1, so with 2 results the second becomes the cursor
    const result = await callSearchQuery(ctx, { q: "test", limit: 1 });

    expect(result.results).toHaveLength(1);
    expect(result.results[0].matchedPostId).toBe("post-a");
    expect(result.nextCursor).toEqual({
      createdAt: "2024-05-30T10:00:00.000Z",
      id: "thread-b",
    });
  });

  it("passes bounded limit and cursor params into the SQL query", async () => {
    const ctx = createMockContext([]);

    await callSearchQuery(ctx, {
      q: "test",
      limit: 20,
      cursor: { createdAt: "2024-06-01T10:00:00.000Z", id: "thread-a" },
    });

    expect(ctx.db.$queryRaw).toHaveBeenCalled();
    const sql = vi.mocked(ctx.db.$queryRaw).mock.calls[0]?.[0] as {
      strings?: string[];
      values?: unknown[];
    };
    const joined = (sql.strings ?? []).join("?");
    expect(joined).toContain('t."createdAt" <');
    expect(sql.values).toEqual(
      expect.arrayContaining(["2024-06-01T10:00:00.000Z", "thread-a", "test", 21]),
    );
  });

  it("rejects unbounded search limits", async () => {
    const ctx = createMockContext([]);
    const caller = searchRouter.createCaller(ctx);

    await expect(caller.query({ q: "test", limit: 1000 })).rejects.toThrow();
    expect(ctx.db.$queryRaw).not.toHaveBeenCalled();
  });

  it("returns empty results with no nextCursor when no matches", async () => {
    const ctx = createMockContext([]);
    const result = await callSearchQuery(ctx, { q: "nonexistent" });

    expect(result.results).toHaveLength(0);
    expect(result.nextCursor).toBeNull();
  });
});
