# Requirements Document

## Introduction

This feature enhances the existing forum search experience with two capabilities: (1) highlighting matched search terms within search result snippets so users can quickly identify relevance, and (2) deep-linking search results directly to the specific post within a thread that matched the query, rather than linking to the thread's top. Together these improvements reduce the time users spend locating the content they searched for.

## Glossary

- **Search_Page**: The existing search interface at `/search` that accepts a query and displays matching threads.
- **Search_Result**: A single item in the search results list representing a thread that matched the query.
- **Snippet**: A short text excerpt from the matching post content displayed in a Search_Result.
- **Highlight**: A visual emphasis (e.g., `<mark>` element with distinct background color) applied to portions of text that match the search query terms.
- **Thread_Page**: The page displaying a thread's posts at `/forum/[categorySlug]/[threadSlug]`.
- **Post_Anchor**: An HTML `id` attribute on each post element within the Thread_Page that enables direct scrolling via URL fragment (e.g., `#post-<postId>`).
- **Deep_Link**: A URL that navigates to a specific post within a thread, combining the thread URL with a Post_Anchor fragment and an optional search query parameter.
- **Search_Router**: The server-side tRPC procedure (`search.query`) that executes full-text search against PostgreSQL.
- **Matched_Post**: The specific post within a thread whose content matched the search query via PostgreSQL full-text search.

## Requirements

### Requirement 1: Highlight Search Terms in Result Snippets

**User Story:** As a forum user, I want the search terms I entered to be visually highlighted in the result snippets, so that I can quickly see why each result matched my query.

#### Acceptance Criteria

1. WHEN search results are displayed, THE Search_Page SHALL wrap each occurrence of the matched query terms within the Snippet text in a Highlight element, where the Snippet is limited to a maximum of 200 characters of post content.
2. THE Highlight element SHALL use a background color that achieves at least a 3:1 contrast ratio against the surrounding non-highlighted background and ensures at least a 4.5:1 contrast ratio between the highlighted text and its highlight background, per WCAG 2.1 AA.
3. WHEN the search query contains multiple whitespace-separated words, THE Search_Page SHALL highlight each word independently within the Snippet, matching whole-word boundaries only (a query term "test" shall not highlight a substring within "testing").
4. IF the Snippet text contains no occurrences of the query terms, THEN THE Search_Page SHALL display the Snippet without any Highlight elements.
5. THE Search_Page SHALL perform highlighting using case-insensitive matching of query terms against the Snippet text.
6. THE Search_Page SHALL sanitize the Snippet content before rendering to prevent cross-site scripting via injected HTML in post content.
7. IF the search query contains more than 10 whitespace-separated words, THEN THE Search_Page SHALL highlight only the first 10 terms and ignore the remaining terms for highlighting purposes.

### Requirement 2: Return Matched Post Identifier in Search Results

**User Story:** As a forum user, I want search results to link me directly to the post that matched, so that I do not have to scroll through an entire thread to find the relevant content.

#### Acceptance Criteria

1. WHEN a search query matches post content, THE Search_Router SHALL return a `matchedPostId` field containing the Post identifier (Post.id) of the Matched_Post alongside each Search_Result.
2. WHEN a search query matches only the thread title and no non-deleted post content matches, THE Search_Router SHALL return the identifier of the earliest non-deleted post in the thread (by `createdAt` ascending) as the `matchedPostId`.
3. THE Search_Router SHALL return a Snippet of at most 200 characters extracted from the Matched_Post content rather than always from the first post in the thread.
4. WHEN multiple non-deleted posts in a thread match the query, THE Search_Router SHALL return the identifier of the earliest matching post (by `createdAt` ascending) as the `matchedPostId`.
5. IF the Matched_Post has been deleted (`isDeleted` = true), THEN THE Search_Router SHALL skip that post and select the next earliest non-deleted matching post; if no non-deleted matching post exists, the Search_Router SHALL fall back to the earliest non-deleted post in the thread.

### Requirement 3: Deep-Link Search Results to Matched Post

**User Story:** As a forum user, I want clicking a search result to take me directly to the matching message within the thread, so that I can immediately read the relevant content.

#### Acceptance Criteria

1. WHEN a user clicks a Search_Result, THE Search_Page SHALL navigate to the Thread_Page using a Deep_Link constructed as `/forum/[categorySlug]/[threadSlug]?highlight=<query>#post-<matchedPostId>`, where `matchedPostId` is the ID of the first post in the thread whose content or title matched the search query.
2. THE Deep_Link SHALL include the search query as a URL-encoded `highlight` query parameter (e.g., `?highlight=<encodeURIComponent(query)>`) so that special characters in the query do not break URL parsing.
3. WHEN the Thread_Page loads with a Post_Anchor fragment (e.g., `#post-<postId>`), THE Thread_Page SHALL scroll the browser viewport so that the referenced post element is visible within the viewport within 1 second of page load.
4. IF the Post_Anchor fragment references a post that does not exist or is deleted, THEN THE Thread_Page SHALL display the thread starting from the first post without displaying an error message to the user.
5. WHEN the Thread_Page loads with a `highlight` query parameter, THE Thread_Page SHALL visually distinguish all occurrences of the query text within post content on the page using a background highlight style that meets WCAG 1.4.1 contrast requirements.
6. IF the search query matches the thread title but no individual post content, THEN THE Search_Page SHALL construct the Deep_Link with the fragment pointing to the first post in the thread (`#post-<firstPostId>`).

### Requirement 4: Highlight Search Terms on Thread Page

**User Story:** As a forum user, I want the search terms to remain highlighted when I navigate to the thread from search results, so that I can immediately identify the matched content within the full thread context.

#### Acceptance Criteria

1. WHEN the Thread_Page loads with a `highlight` query parameter, THE Thread_Page SHALL split the parameter value on whitespace into individual terms and apply a Highlight element to each case-insensitive substring match within all rendered post body content.
2. THE Thread_Page SHALL perform highlighting using case-insensitive, substring matching of each individual term against post body text, matching partial words (e.g., highlight term "test" matches "testing").
3. IF the `highlight` query parameter is absent, empty, or contains only whitespace, THEN THE Thread_Page SHALL render post content without any Highlight elements.
4. WHILE highlighting is active, THE Thread_Page SHALL display a visible dismiss control that, when activated, removes all Highlight elements from post content and removes the `highlight` parameter from the current URL without triggering a page reload.
5. THE Thread_Page SHALL treat the `highlight` parameter value as a plain-text literal by escaping all regular expression special characters and stripping any HTML tags before matching, to prevent regular expression injection and cross-site scripting.
6. IF the `highlight` query parameter value exceeds 200 characters, THEN THE Thread_Page SHALL truncate it to the first 200 characters before performing matching.

### Requirement 5: Post Anchors on Thread Page

**User Story:** As a forum user, I want each post in a thread to have a stable anchor, so that direct links to specific posts work reliably.

#### Acceptance Criteria

1. THE Thread_Page SHALL render each post element with an `id` attribute following the pattern `post-{postId}`, where `postId` is the database-assigned unique identifier for that post.
2. WHEN the page URL contains a fragment matching a Post_Anchor, THE Thread_Page SHALL scroll the viewport to the corresponding post element within 2 seconds of the page becoming interactive.
3. IF the page URL contains a fragment that does not match any rendered Post_Anchor, THEN THE Thread_Page SHALL remain at the default scroll position without displaying an error.
4. THE Post_Anchor value for a given post SHALL remain identical across page reloads and SHALL NOT change when other posts are added to or removed from the thread.
5. WHEN a user clicks an in-page link containing a Post_Anchor fragment (e.g., a "replied to" link), THE Thread_Page SHALL scroll the viewport to the referenced post element.
