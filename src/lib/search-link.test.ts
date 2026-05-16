import { describe, expect, it } from "vitest";
import * as fc from "fast-check";
import { buildSearchResultLink } from "@/lib/search-link";

describe("buildSearchResultLink", () => {
  it("constructs a valid deep link with encoded query", () => {
    const result = buildSearchResultLink({
      forumSlug: "general",
      threadSlug: "hello-world",
      query: "test query",
      matchedPostId: "abc123",
    });
    expect(result).toBe(
      "/forum/general/hello-world?highlight=test%20query#post-abc123"
    );
  });

  it("encodes special characters in the query parameter", () => {
    const result = buildSearchResultLink({
      forumSlug: "tech",
      threadSlug: "my-thread",
      query: "C++ & Java",
      matchedPostId: "post1",
    });
    expect(result).toBe(
      "/forum/tech/my-thread?highlight=C%2B%2B%20%26%20Java#post-post1"
    );
  });

  it("handles query with URL-unsafe characters (?, #, &, =)", () => {
    const result = buildSearchResultLink({
      forumSlug: "forum-slug",
      threadSlug: "thread-slug",
      query: "what?#foo&bar=baz",
      matchedPostId: "id1",
    });
    expect(result).toBe(
      "/forum/forum-slug/thread-slug?highlight=what%3F%23foo%26bar%3Dbaz#post-id1"
    );
    // Verify the URL is parseable
    const url = new URL(result, "http://localhost");
    expect(url.searchParams.get("highlight")).toBe("what?#foo&bar=baz");
    expect(url.hash).toBe("#post-id1");
  });

  it("handles empty query string", () => {
    const result = buildSearchResultLink({
      forumSlug: "general",
      threadSlug: "some-thread",
      query: "",
      matchedPostId: "xyz",
    });
    expect(result).toBe("/forum/general/some-thread?highlight=#post-xyz");
  });

  it("handles unicode characters in query", () => {
    const result = buildSearchResultLink({
      forumSlug: "intl",
      threadSlug: "unicode-thread",
      query: "café résumé",
      matchedPostId: "u1",
    });
    expect(result).toBe(
      "/forum/intl/unicode-thread?highlight=caf%C3%A9%20r%C3%A9sum%C3%A9#post-u1"
    );
    // Verify decoding works
    const url = new URL(result, "http://localhost");
    expect(url.searchParams.get("highlight")).toBe("café résumé");
  });

  it("preserves slug values as-is in the path", () => {
    const result = buildSearchResultLink({
      forumSlug: "my-forum",
      threadSlug: "my-thread-2024",
      query: "search",
      matchedPostId: "clxyz123abc",
    });
    expect(result).toMatch(/^\/forum\/my-forum\/my-thread-2024\?/);
    expect(result).toMatch(/#post-clxyz123abc$/);
  });
});

// Feature: search-highlight-navigation, Property 4: Deep link construction produces valid URLs
describe("buildSearchResultLink - Property 4: Deep link construction produces valid URLs", () => {
  // Arbitrary for slug-like strings: lowercase alphanumeric + hyphens, non-empty
  const slugArb = fc
    .stringMatching(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    .filter((s) => s.length >= 1 && s.length <= 30);

  // Arbitrary for queries with special characters
  const queryArb = fc.string({ minLength: 0, maxLength: 100 });

  // Arbitrary for post IDs (alphanumeric CUID-like strings)
  const postIdArb = fc.stringMatching(/^[a-z0-9]{1,25}$/);

  // **Validates: Requirements 3.1, 3.2**
  it("output matches the expected URL pattern", () => {
    fc.assert(
      fc.property(slugArb, slugArb, queryArb, postIdArb, (forumSlug, threadSlug, query, matchedPostId) => {
        const result = buildSearchResultLink({ forumSlug, threadSlug, query, matchedPostId });

        const encodedQuery = encodeURIComponent(query);
        const expected = `/forum/${forumSlug}/${threadSlug}?highlight=${encodedQuery}#post-${matchedPostId}`;
        expect(result).toBe(expected);
      }),
      { numRuns: 100 }
    );
  });

  it("URL is parseable without errors", () => {
    fc.assert(
      fc.property(slugArb, slugArb, queryArb, postIdArb, (forumSlug, threadSlug, query, matchedPostId) => {
        const result = buildSearchResultLink({ forumSlug, threadSlug, query, matchedPostId });

        // Should not throw when parsed as a URL with a base
        const url = new URL(result, "http://localhost");
        expect(url.pathname).toBe(`/forum/${forumSlug}/${threadSlug}`);
        expect(url.hash).toBe(`#post-${matchedPostId}`);
      }),
      { numRuns: 100 }
    );
  });

  it("query is properly URI-encoded and decodable", () => {
    fc.assert(
      fc.property(slugArb, slugArb, queryArb, postIdArb, (forumSlug, threadSlug, query, matchedPostId) => {
        const result = buildSearchResultLink({ forumSlug, threadSlug, query, matchedPostId });

        // Parse the URL and verify the highlight param decodes back to the original query
        const url = new URL(result, "http://localhost");
        const highlightParam = url.searchParams.get("highlight");
        expect(highlightParam).toBe(query);
      }),
      { numRuns: 100 }
    );
  });
});
