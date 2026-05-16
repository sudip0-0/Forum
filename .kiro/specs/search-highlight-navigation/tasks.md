# Implementation Plan: Search Highlight & Navigation

## Overview

This plan implements search term highlighting in result snippets, deep-linking to matched posts, and in-thread highlighting with scroll-to-post navigation. The implementation proceeds from pure utility functions (easily testable), through backend modifications, to UI integration.

## Tasks

- [x] 1. Create highlight utility functions and types
  - [x] 1.1 Create `src/lib/highlight.ts` with `HighlightSegment` type and `highlightSnippet` function
    - Define `HighlightSegment` type (`{ text: string; highlighted: boolean }`)
    - Implement `highlightSnippet(snippet: string, query: string): HighlightSegment[]`
    - Strip HTML tags from snippet input (XSS prevention)
    - Split query on whitespace, take first 10 terms (Requirement 1.7)
    - Escape regex special characters in each term
    - Build combined regex with word boundaries `\b(term1|term2|...)\b` with `gi` flags
    - Split snippet by regex into alternating plain/highlighted segments
    - Handle case-insensitive matching (Requirement 1.5)
    - Return empty highlights when no terms match (Requirement 1.4)
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [x] 1.2 Write property tests for `highlightSnippet` (Property 1: whole-word matches)
    - **Property 1: Snippet highlighting produces correct whole-word matches**
    - Use fast-check to generate random snippets and query terms
    - Assert highlighted segments only appear at whole-word boundaries
    - Assert all whole-word occurrences are highlighted
    - Assert case-insensitive matching works correctly
    - **Validates: Requirements 1.1, 1.3, 1.4, 1.5**

  - [x] 1.3 Write property tests for `highlightSnippet` (Property 2: HTML sanitization)
    - **Property 2: Snippet highlighting sanitizes HTML**
    - Use fast-check to generate snippets containing HTML tags and entities
    - Assert output segments contain no unescaped HTML tags
    - **Validates: Requirements 1.6**

  - [x] 1.4 Write property tests for `highlightSnippet` (Property 3: 10-term limit)
    - **Property 3: Snippet highlighting enforces 10-term limit**
    - Use fast-check to generate queries with more than 10 terms
    - Assert only first 10 terms produce highlights
    - Assert 11th+ terms are not highlighted even when present in snippet
    - **Validates: Requirements 1.7**

- [x] 2. Create thread-page highlight utility and deep link builder
  - [x] 2.1 Create `src/lib/thread-highlight.ts` with `highlightPostContent` and `isHighlightActive` functions
    - Implement `highlightPostContent(content: string, highlightParam: string): HighlightSegment[]`
    - Implement `isHighlightActive(highlightParam: string | null | undefined): boolean`
    - Truncate highlight param to 200 characters (Requirement 4.6)
    - Strip HTML tags from highlight param (Requirement 4.5)
    - Escape regex special characters (Requirement 4.5)
    - Split on whitespace into individual terms
    - Perform case-insensitive substring matching (no word boundaries) (Requirement 4.2)
    - Return single unhighlighted segment for empty/null/whitespace-only params (Requirement 4.3)
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 4.6_

  - [x] 2.2 Create `src/lib/search-link.ts` with `buildSearchResultLink` function
    - Implement `buildSearchResultLink({ forumSlug, threadSlug, query, matchedPostId }): string`
    - Construct URL: `/forum/{forumSlug}/{threadSlug}?highlight={encodedQuery}#post-{matchedPostId}`
    - Use `encodeURIComponent` for the query parameter (Requirement 3.2)
    - Handle special characters in query without breaking URL parsing
    - _Requirements: 3.1, 3.2, 3.6_

  - [x] 2.3 Write property tests for `highlightPostContent` (Property 5: substring matches)
    - **Property 5: Thread-page highlighting produces correct substring matches**
    - Use fast-check to generate post content and highlight params
    - Assert all case-insensitive substring occurrences are highlighted
    - **Validates: Requirements 3.5, 4.1, 4.2**

  - [x] 2.4 Write property tests for `highlightPostContent` (Property 6: empty param produces no highlights)
    - **Property 6: Empty highlight parameter produces no highlights**
    - Use fast-check to generate post content with null/empty/whitespace-only params
    - Assert single unhighlighted segment containing original content is returned
    - **Validates: Requirements 4.3**

  - [x] 2.5 Write property tests for `highlightPostContent` (Property 7: sanitization and truncation)
    - **Property 7: Highlight parameter sanitization and truncation**
    - Use fast-check to generate params with regex special chars and HTML tags
    - Assert no regex errors are thrown
    - Assert output contains no raw HTML from the parameter
    - Assert params over 200 chars are truncated before matching
    - **Validates: Requirements 4.5, 4.6**

  - [x] 2.6 Write property tests for `buildSearchResultLink` (Property 4: valid URLs)
    - **Property 4: Deep link construction produces valid URLs**
    - Use fast-check to generate slugs, queries with special chars, and post IDs
    - Assert output matches pattern `/forum/{slug}/{slug}?highlight={encoded}#post-{id}`
    - Assert URL is parseable without errors
    - Assert query is properly URI-encoded
    - **Validates: Requirements 3.1, 3.2**

- [x] 3. Checkpoint - Ensure all utility tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Modify search router to return `matchedPostId` and matched-post snippet
  - [x] 4.1 Update `src/server/api/routers/search.ts` to return `matchedPostId` and snippet from matched post
    - Add lateral join / correlated subquery to find earliest non-deleted post with content match
    - Fall back to earliest non-deleted post when only title matches (Requirement 2.2)
    - Return earliest matching post when multiple posts match (Requirement 2.4)
    - Skip deleted posts in matching logic (Requirement 2.5)
    - Extract snippet (max 200 chars) from the matched post content (Requirement 2.3)
    - Add `matchedPostId` to the result type
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 4.2 Write unit tests for search router `matchedPostId` logic
    - Test: returns correct `matchedPostId` when post content matches
    - Test: returns earliest non-deleted post ID for title-only matches
    - Test: returns earliest matching post when multiple posts match
    - Test: skips deleted posts and falls back correctly
    - Test: snippet is extracted from matched post, not first post
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 5. Update search page UI with highlighting and deep links
  - [x] 5.1 Create `src/components/forum/highlighted-text.tsx` component
    - Implement `HighlightedText` component that renders `HighlightSegment[]`
    - Use `<mark>` elements with `className="search-highlight"` for highlighted segments
    - Ensure accessible contrast ratios via Tailwind/CSS styling
    - _Requirements: 1.1, 1.2_

  - [x] 5.2 Update `src/app/(public)/search/page.tsx` to use highlighting and deep links
    - Import `highlightSnippet` from `src/lib/highlight.ts`
    - Import `buildSearchResultLink` from `src/lib/search-link.ts`
    - Import `HighlightedText` component
    - Replace plain snippet text with `HighlightedText` rendering highlighted segments
    - Replace thread link `href` with `buildSearchResultLink()` output using `matchedPostId`
    - Pass search query `q` to `highlightSnippet` for each result's snippet
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 3.1, 3.2, 3.6_

  - [x] 5.3 Add CSS styles for `.search-highlight` mark element
    - Add highlight background color meeting WCAG 2.1 AA contrast requirements (3:1 against surrounding, 4.5:1 text-to-background)
    - Style in global CSS or Tailwind utility class
    - _Requirements: 1.2, 3.5_

- [x] 6. Checkpoint - Ensure search page renders correctly with highlights and deep links
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement thread page post anchors, scroll-to, and in-context highlighting
  - [x] 7.1 Add post anchor `id` attributes to thread page posts (verify existing implementation)
    - Verify `id={`post-${post.id}`}` is already on each `<article>` in `client.tsx`
    - Ensure the pattern `post-{postId}` uses the database CUID (Requirement 5.1)
    - Confirm anchors remain stable across reloads (Requirement 5.4)
    - _Requirements: 5.1, 5.4_

  - [x] 7.2 Create `src/components/forum/thread-highlight-provider.tsx` client component
    - Read `?highlight=` query parameter from URL on mount
    - Read `#post-{id}` fragment from URL on mount
    - Scroll to anchor element using `scrollIntoView({ behavior: 'smooth' })` within 2 seconds (Requirement 5.2)
    - If fragment references non-existent post, remain at default scroll position (Requirement 5.3, 3.4)
    - Provide highlight terms to child components via React context
    - Render dismiss banner/button when highlighting is active (Requirement 4.4)
    - On dismiss: remove all highlights, use `history.replaceState` to remove `highlight` param without reload (Requirement 4.4)
    - _Requirements: 3.3, 3.4, 4.1, 4.3, 4.4, 5.2, 5.3_

  - [x] 7.3 Integrate `ThreadHighlightProvider` and `highlightPostContent` into thread page
    - Wrap `ThreadConversation` with `ThreadHighlightProvider` in the thread page
    - Update post content rendering to use `highlightPostContent` when highlight param is active
    - Use `HighlightedText` component for rendering highlighted post content
    - Pass `highlight` search param from server component to client
    - _Requirements: 3.5, 4.1, 4.2, 4.5, 4.6_

  - [x] 7.4 Ensure "replied to" anchor links scroll correctly
    - Verify existing `<a href={`#post-${post.parent.id}`}>` links trigger scroll (Requirement 5.5)
    - Add smooth scroll behavior if not already present
    - _Requirements: 5.5_

- [x] 8. Checkpoint - Ensure thread page highlighting and navigation work end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Install fast-check and finalize test setup
  - [x] 9.1 Add `fast-check` as a dev dependency if not already directly listed
    - Run `pnpm add -D fast-check`
    - Verify import works in test files
    - _Requirements: Testing infrastructure_

  - [x] 9.2 Write integration tests for search-to-thread navigation flow
    - Test: clicking search result navigates to correct thread with highlight param and fragment
    - Test: thread page scrolls to anchored post
    - Test: dismiss control removes highlights and updates URL without reload
    - Test: invalid post anchor does not produce an error
    - _Requirements: 3.1, 3.3, 3.4, 4.4, 5.2, 5.3_

- [x] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The project already has post anchors (`id={`post-${post.id}`}`) in `client.tsx` — task 7.1 verifies this
- `fast-check` is already in the lockfile as a transitive dependency but should be added as a direct dev dependency for clarity
- The design uses TypeScript throughout, matching the existing project stack

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "2.2"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4", "2.3", "2.4", "2.5", "2.6"] },
    { "id": 2, "tasks": ["4.1", "5.1", "9.1"] },
    { "id": 3, "tasks": ["4.2", "5.2", "5.3"] },
    { "id": 4, "tasks": ["7.1", "7.2"] },
    { "id": 5, "tasks": ["7.3", "7.4"] },
    { "id": 6, "tasks": ["9.2"] }
  ]
}
```
