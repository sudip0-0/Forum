# Design Document: Search Highlight & Navigation

## Overview

This feature enhances the forum search experience by (1) highlighting matched query terms in search result snippets, and (2) deep-linking search results directly to the specific matched post within a thread. The implementation spans three layers:

- **Server (tRPC search router)**: Modified SQL query to return `matchedPostId` and extract snippets from the matched post rather than always the first post.
- **Search page (client-side highlighting)**: A utility function that wraps matched terms in `<mark>` elements within snippet text, with XSS sanitization.
- **Thread page (navigation + in-context highlighting)**: Post anchors (already partially implemented), scroll-to behavior on load, and a highlight overlay with dismiss control driven by a `?highlight=` query parameter.

The design prioritizes pure, testable utility functions for highlighting logic, keeping rendering concerns separate from matching logic.

## Architecture

```mermaid
flowchart TD
    subgraph SearchPage["Search Page (Server Component)"]
        A[User submits query] --> B[tRPC search.query]
        B --> C[Results with matchedPostId + snippet]
        C --> D[highlightSnippet utility]
        D --> E[Render highlighted results with deep links]
    end

    subgraph DeepLink["Deep Link Construction"]
        E --> F["URL: /forum/{slug}/{thread}?highlight={query}#post-{id}"]
    end

    subgraph ThreadPage["Thread Page"]
        F --> G[Parse URL fragment + highlight param]
        G --> H[Scroll to #post-{id}]
        G --> I[Apply in-thread highlighting]
        I --> J[Dismiss control removes highlights]
    end
```

### Key Design Decisions

1. **Client-side snippet highlighting**: Highlighting is performed on the client (in the React component) rather than in PostgreSQL's `ts_headline`. This gives full control over styling, avoids coupling highlight logic to the database, and keeps the highlighting function pure and testable.

2. **Whole-word matching for snippets vs. substring matching for thread page**: The search page uses whole-word boundary matching (requirement 1.3) because snippets are short and precision matters. The thread page uses substring matching (requirement 4.2) because users want to see all related content highlighted in context.

3. **Post anchors via database ID**: Using `post-{postId}` where `postId` is the CUID ensures stability across page reloads and thread modifications. This pattern is already implemented in the existing `client.tsx`.

4. **Highlight dismiss via URL manipulation**: The dismiss control uses `window.history.replaceState` to remove the `highlight` param without triggering a page reload, preserving scroll position.

## Components and Interfaces

### 1. Search Router Modifications (`src/server/api/routers/search.ts`)

The existing SQL query is modified to:
- Join with a subquery that finds the earliest non-deleted matching post per thread
- Return `matchedPostId` alongside each result
- Extract the snippet from the matched post (not always the first post)

```typescript
// Updated return type
type SearchResult = {
  id: string;
  title: string;
  slug: string;
  createdAt: Date;
  authorUsername: string;
  authorDisplayName: string | null;
  forumSlug: string;
  forumName: string;
  tags: { id: string; name: string; slug: string }[];
  snippet: string;
  matchedPostId: string; // NEW: ID of the post that matched
};
```

**SQL Strategy**: Use a lateral join or correlated subquery to find the earliest non-deleted post whose `to_tsvector('english', content) @@ websearch_to_tsquery('english', $1)` matches. If no post content matches (title-only match), fall back to the earliest non-deleted post in the thread.

```sql
-- Pseudocode for the matched post selection
COALESCE(
  -- First: earliest non-deleted post with content match
  (SELECT p.id FROM "Post" p
   WHERE p."threadId" = t.id AND p."isDeleted" = false
     AND to_tsvector('english', p.content) @@ websearch_to_tsquery('english', $1)
   ORDER BY p."createdAt" ASC LIMIT 1),
  -- Fallback: earliest non-deleted post (title-only match)
  (SELECT p.id FROM "Post" p
   WHERE p."threadId" = t.id AND p."isDeleted" = false
   ORDER BY p."createdAt" ASC LIMIT 1)
) AS "matchedPostId"
```

The snippet extraction follows the same logic — pull content from the matched post:

```sql
COALESCE(
  (SELECT LEFT(p.content, 200) FROM "Post" p
   WHERE p.id = matched_post_id AND p."isDeleted" = false),
  ''
) AS snippet
```

### 2. Snippet Highlight Utility (`src/lib/highlight.ts`)

A pure function for highlighting search terms in snippet text.

```typescript
/**
 * Highlights query terms in a snippet using whole-word, case-insensitive matching.
 * Returns an array of segments (plain text and highlighted text) for safe rendering.
 * 
 * - Sanitizes input to prevent XSS
 * - Matches whole words only (word boundaries)
 * - Case-insensitive
 * - Limits to first 10 query terms
 */
export function highlightSnippet(
  snippet: string,
  query: string
): HighlightSegment[];

export type HighlightSegment = {
  text: string;
  highlighted: boolean;
};
```

**Implementation approach**:
1. Strip HTML tags from snippet (XSS prevention)
2. Split query on whitespace, take first 10 terms
3. Escape regex special characters in each term
4. Build a combined regex with word boundaries: `\b(term1|term2|...)\b` with `gi` flags
5. Split the snippet by the regex, producing alternating plain/highlighted segments
6. Return structured segments (not raw HTML) for safe React rendering

### 3. Deep Link Construction Utility (`src/lib/search-link.ts`)

```typescript
/**
 * Constructs a deep link URL for a search result.
 */
export function buildSearchResultLink(params: {
  forumSlug: string;
  threadSlug: string;
  query: string;
  matchedPostId: string;
}): string;
// Returns: /forum/{forumSlug}/{threadSlug}?highlight={encodedQuery}#post-{matchedPostId}
```

### 4. Thread Page Highlight Utility (`src/lib/thread-highlight.ts`)

A pure function for highlighting search terms in thread post content (substring matching).

```typescript
/**
 * Highlights query terms in post content using substring, case-insensitive matching.
 * 
 * - Escapes regex special characters in the query
 * - Strips HTML tags from the query parameter
 * - Truncates query parameter to 200 characters
 * - Splits on whitespace into individual terms
 * - Performs case-insensitive substring matching (no word boundaries)
 */
export function highlightPostContent(
  content: string,
  highlightParam: string
): HighlightSegment[];

/**
 * Returns true if the highlight parameter is valid (non-empty, non-whitespace-only).
 */
export function isHighlightActive(highlightParam: string | null | undefined): boolean;
```

### 5. Thread Page Scroll & Highlight Client Component (`src/components/forum/thread-highlight-provider.tsx`)

A client component that wraps the thread conversation and handles:
- Reading the `highlight` query parameter from the URL
- Scrolling to the post anchor on mount
- Providing highlight state to child components
- Rendering the dismiss control

```typescript
"use client";

export function ThreadHighlightProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Read ?highlight= from URL on mount
  // 2. Read #post-{id} fragment on mount
  // 3. Scroll to anchor element if present
  // 4. Provide highlight terms to context
  // 5. Render dismiss banner when highlighting is active
}
```

### 6. Highlighted Text Renderer (`src/components/forum/highlighted-text.tsx`)

A component that renders text with highlight segments:

```typescript
export function HighlightedText({
  segments,
}: {
  segments: HighlightSegment[];
}) {
  return (
    <>
      {segments.map((seg, i) =>
        seg.highlighted ? (
          <mark key={i} className="search-highlight">{seg.text}</mark>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </>
  );
}
```

### 7. Search Result Card Update (`src/app/(public)/search/page.tsx`)

The existing search result rendering is updated to:
- Use `highlightSnippet()` for snippet display
- Use `buildSearchResultLink()` for the result link `href`

## Data Models

No schema changes are required. The existing `Post` model already has:
- `id` (CUID, stable identifier for anchors)
- `threadId` (foreign key to Thread)
- `content` (text field, already indexed with GIN for FTS)
- `isDeleted` (boolean for soft-delete filtering)
- `createdAt` (timestamp for ordering)

The search router's return type gains one new field:

```typescript
// Addition to search result type
matchedPostId: string; // Post.id of the matched post
```

The thread page URL gains:
- Query parameter: `?highlight=<encoded_query>` (string, max 200 chars after decode)
- Fragment: `#post-<postId>` (existing pattern, already in use for "replied to" links)

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Snippet highlighting produces correct whole-word matches

*For any* plain-text snippet and any search query (up to 10 whitespace-separated terms), the `highlightSnippet` function SHALL produce highlight segments only at positions where a query term matches a complete word (bounded by word boundaries) in a case-insensitive manner, and all such positions SHALL be highlighted.

**Validates: Requirements 1.1, 1.3, 1.4, 1.5**

### Property 2: Snippet highlighting sanitizes HTML

*For any* snippet string containing HTML tags or entities, the `highlightSnippet` function SHALL produce output segments whose `text` fields contain no unescaped HTML tags, preventing cross-site scripting regardless of input content.

**Validates: Requirements 1.6**

### Property 3: Snippet highlighting enforces 10-term limit

*For any* search query containing more than 10 whitespace-separated words, the `highlightSnippet` function SHALL only produce highlights for occurrences of the first 10 terms; occurrences of the 11th term and beyond SHALL NOT be highlighted.

**Validates: Requirements 1.7**

### Property 4: Deep link construction produces valid URLs

*For any* combination of forumSlug, threadSlug, query string (including special characters), and matchedPostId, the `buildSearchResultLink` function SHALL produce a URL matching the pattern `/forum/{forumSlug}/{threadSlug}?highlight={encodedQuery}#post-{matchedPostId}` where the query is properly URI-encoded and the URL is parseable without errors.

**Validates: Requirements 3.1, 3.2**

### Property 5: Thread-page highlighting produces correct substring matches

*For any* post content string and any valid (non-empty, non-whitespace-only) highlight parameter (after truncation to 200 chars), the `highlightPostContent` function SHALL produce highlight segments at every case-insensitive substring occurrence of each whitespace-separated term from the parameter.

**Validates: Requirements 3.5, 4.1, 4.2**

### Property 6: Empty highlight parameter produces no highlights

*For any* post content string, when the highlight parameter is null, undefined, empty string, or contains only whitespace characters, the `highlightPostContent` function SHALL return a single unhighlighted segment containing the original content (no highlight elements).

**Validates: Requirements 4.3**

### Property 7: Highlight parameter sanitization and truncation

*For any* highlight parameter string containing regex special characters or HTML tags, the `highlightPostContent` function SHALL not throw a regex error and SHALL not produce output containing raw HTML from the parameter. Additionally, *for any* highlight parameter exceeding 200 characters, only the first 200 characters SHALL be used for matching.

**Validates: Requirements 4.5, 4.6**

## Error Handling

| Scenario | Handling |
|----------|----------|
| Search query returns no `matchedPostId` (data inconsistency) | Fall back to linking to thread without fragment |
| Post anchor references deleted/non-existent post | Thread page renders normally from top, no error shown |
| `highlight` param contains malicious regex | All regex special chars escaped before use |
| `highlight` param contains HTML/script tags | HTML stripped before matching |
| `highlight` param exceeds 200 chars | Truncated to first 200 chars |
| Empty search query | No highlighting applied, snippet shown as plain text |
| Network error during search | Existing error handling displays error message |
| Browser doesn't support `scrollIntoView` | Graceful degradation — page loads without scroll |

## Testing Strategy

### Property-Based Tests (Vitest + fast-check)

The project uses Vitest. Property-based tests will use the `fast-check` library for generating random inputs.

Each property test runs a minimum of **100 iterations** with randomly generated inputs.

**Test files:**
- `src/lib/highlight.test.ts` — Properties 1, 2, 3
- `src/lib/search-link.test.ts` — Property 4
- `src/lib/thread-highlight.test.ts` — Properties 5, 6, 7

**Tag format:** Each test is tagged with a comment:
```typescript
// Feature: search-highlight-navigation, Property 1: Snippet highlighting produces correct whole-word matches
```

**Configuration:**
```typescript
fc.assert(fc.property(...), { numRuns: 100 });
```

### Unit Tests (Example-Based)

- Contrast ratio verification for highlight CSS (Requirement 1.2)
- Search router returns correct `matchedPostId` for title-only matches (Requirement 2.2)
- Search router returns earliest matching post when multiple match (Requirement 2.4)
- Search router skips deleted posts (Requirement 2.5)
- Deep link uses first post ID for title-only matches (Requirement 3.6)
- Post anchor stability (Requirement 5.4)

### Integration / E2E Tests (Playwright)

- Clicking a search result navigates to the correct thread with highlight param and fragment
- Thread page scrolls to the anchored post within 2 seconds
- Thread page shows dismiss control when highlight is active
- Dismiss control removes highlights and updates URL without reload
- Invalid post anchor does not produce an error
- "Replied to" links scroll to the referenced post

### Test Library Choice

- **Property-based testing**: `fast-check` (most popular PBT library for TypeScript/JavaScript, integrates with Vitest)
- **Unit tests**: Vitest (already configured in the project)
- **E2E tests**: Playwright (already configured in the project)
