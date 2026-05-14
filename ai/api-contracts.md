# Forum Website — API Contracts

The app uses tRPC for internal APIs.

## API Rules

1. Every input must use Zod.
2. Every mutation must check auth.
3. Every protected action must check authorization.
4. Public queries must filter deleted or private content.
5. Use cursor pagination for public lists.
6. Return stable error codes.
7. Do not expose raw database models if they contain private fields.

## Routers

```txt
appRouter
  ├─ health
  ├─ category
  ├─ thread
  ├─ post
  ├─ user
  ├─ search
  └─ moderation
```

## categoryRouter

### `category.listPublic`

**Type:** public query

Input: none

Returns public categories (`isPublic: true`) sorted by `sortOrder` ascending.

### `category.listAll`

**Type:** admin query

Input: none

Returns all categories (including hidden) sorted by `sortOrder` ascending. Admin only.

### `category.create`

**Type:** admin mutation

Input:

```ts
z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
})
```

Rules:

- Admin only
- Slug auto-generated from name
- Slug must be unique (returns CONFLICT if taken)

### `category.update`

**Type:** admin mutation

Input:

```ts
z.object({
  id: z.string().min(1),
  name: z.string().min(2).max(100).optional(),
  slug: z.string().min(1).max(150).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  description: z.string().max(500).nullable().optional(),
  isPublic: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
})
```

Rules:

- Admin only
- If slug is changed, uniqueness is enforced (CONFLICT)
- If name is changed without explicit slug, slug is re-derived from name
- Returns NOT_FOUND if category does not exist

### `category.reorder`

**Type:** admin mutation

Input:

```ts
z.object({
  items: z.array(z.object({
    id: z.string().min(1),
    sortOrder: z.number().int().min(0),
  })).min(1),
})
```

Rules:

- Admin only
- Updates all items in a transaction
- Returns updated category list sorted by `sortOrder`

### `category.softDelete`

**Type:** admin mutation

Input:

```ts
z.object({
  id: z.string().min(1),
})
```

Rules:

- Admin only
- Sets `isPublic: false` (hides from public listing)
- Returns NOT_FOUND if category does not exist

## threadRouter

### `thread.listByCategory`

**Type:** public query

Input:

```ts
z.object({
  categorySlug: z.string().min(1),
  sort: z.enum(["latest", "newest", "unanswered"]).default("latest"),
  cursor: z.string().optional(),
  limit: z.number().min(1).max(50).default(20),
})
```

Rules:

- Returns threads for a public category, sorted by `lastActivityAt` (latest), `createdAt` (newest), or filtered to `replyCount: 0` (unanswered)
- Excludes soft-deleted threads
- Returns NOT_FOUND if category is missing or not public
- Cursor-based pagination

### `thread.getBySlug`

**Type:** public query

Input:

```ts
z.object({
  slug: z.string().min(1),
})
```

Rules:

- Returns thread with author and category info
- Returns NOT_FOUND if thread is missing or soft-deleted

### `thread.create`

**Type:** member mutation

Input:

```ts
z.object({
  categoryId: z.string().min(1),
  title: z.string().min(5).max(150),
  content: z.string().min(10).max(20000),
})
```

Rules:

- User must be logged in (UNAUTHORIZED)
- Category must exist (NOT_FOUND)
- Category must not be locked (FORBIDDEN)
- Slug auto-generated from title; collision appends timestamp suffix
- Creates thread and first post (sequential creates)

## postRouter

### `post.listByThread`

**Type:** public query

Input:

```ts
z.object({
  threadId: z.string().min(1),
  cursor: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
})
```

Rules:

- Returns posts ordered by `createdAt` ascending
- Excludes soft-deleted posts
- Includes author info
- Cursor-based pagination

### `post.create`

**Type:** member mutation

Input:

```ts
z.object({
  threadId: z.string().min(1),
  parentId: z.string().optional(),
  content: z.string().min(1).max(20000),
})
```

Rules:

- User must be logged in (UNAUTHORIZED)
- Thread must exist and not be deleted (NOT_FOUND)
- Thread must not be locked (FORBIDDEN)
- If parentId provided, validates parent belongs to same thread
- Parent reply depth cannot exceed 3 levels (BAD_REQUEST)
- Increments thread replyCount and updates lastActivityAt

## userRouter

### `user.getPublicProfile`

**Type:** public query

Input:

```ts
z.object({ username: z.string().min(1) })
```

Returns:

- username, displayName, image, bio, createdAt
- Recent 10 threads (non-deleted) with title, slug, category info

Never returns: email, passwordHash, session data.

Rules:

- Returns NOT_FOUND if user does not exist

### `user.updateProfile`

**Type:** member mutation

Input:

```ts
z.object({
  displayName: z.string().max(50).optional(),
  bio: z.string().max(500).optional(),
})
```

Rules:

- User must be logged in (UNAUTHORIZED)
- Updates the authenticated user's own profile only

## searchRouter

### `search.query`

**Type:** public query

Input:

```ts
z.object({
  q: z.string().min(1).max(100),
  cursor: z.string().optional(),
  limit: z.number().min(1).max(50).default(20),
})
```

Rules:

- Uses PostgreSQL full-text search (to_tsvector/to_tsquery) on thread title and post content
- Excludes soft-deleted threads and posts
- Returns thread-level results with title, slug, author, category info
- Cursor-based pagination
- Guest can search (public query)

## moderationRouter

### `moderation.report`

**Type:** member mutation

Input:

```ts
z.object({
  postId: z.string().min(1).optional(),
  threadId: z.string().min(1).optional(),
  reason: z.enum(["SPAM", "HARASSMENT", "OFF_TOPIC", "DUPLICATE", "OTHER"]),
  note: z.string().max(1000).optional(),
}).refine((data) => (data.postId ? !data.threadId : !!data.threadId), {
  message: "Must provide exactly one of postId or threadId.",
})
```

Rules:

- User must be logged in (UNAUTHORIZED for guests)
- Must provide exactly one of postId or threadId (BAD_REQUEST if both, BAD_REQUEST if neither)
- Validates that the target post/thread exists and is not deleted (NOT_FOUND)
- Catches Prisma unique constraint violation (P2002) on `@@unique([reporterId, postId])` or `@@unique([reporterId, threadId])` and returns CONFLICT
- Creates report with status OPEN
- Returns the created report object

### `moderation.listQueue`

**Type:** moderator query

Rules:

- Moderator or admin only

### `moderation.resolve`

**Type:** moderator mutation

Input:

```ts
z.object({
  reportId: z.string(),
  action: z.enum(["DISMISS", "SOFT_DELETE_POST", "SOFT_DELETE_THREAD", "LOCK_THREAD"]),
  reason: z.string().min(3).max(1000),
})
```

Rules:

- Update report status
- Apply moderation action
- Create audit log
- Use transaction
```

## Error Codes

| Code | Meaning |
|---|---|
| UNAUTHORIZED | Not logged in |
| FORBIDDEN | Lacks permission |
| NOT_FOUND | Missing or hidden resource |
| BAD_REQUEST | Invalid input |
| CONFLICT | Duplicate or invalid state |
| INTERNAL_SERVER_ERROR | Unexpected error |
