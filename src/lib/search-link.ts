/**
 * Constructs a deep link URL for a search result that navigates
 * directly to the matched post within a thread.
 *
 * The URL includes a `highlight` query parameter (URI-encoded) for
 * in-thread highlighting and a fragment pointing to the matched post.
 */
export function buildSearchResultLink(params: {
  forumSlug: string;
  threadSlug: string;
  query: string;
  matchedPostId: string;
}): string {
  const { forumSlug, threadSlug, query, matchedPostId } = params;
  const encodedQuery = encodeURIComponent(query);
  return `/forum/${forumSlug}/${threadSlug}?highlight=${encodedQuery}#post-${matchedPostId}`;
}
