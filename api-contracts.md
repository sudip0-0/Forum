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

Input:

```ts
z.object({
  parentSlug: z.string().optional(),
})
```

Returns public categories sorted by `sortOrder`.

### `category.create`

**Type:** admin mutation

Input:

```ts
z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  parentId: z.string().optional(),
  isPublic: z.boolean().default(true),
})
```

Rules:

- Admin only
- Slug must be unique

## threadRouter

### `thread.listByCategory`

**Type:** public query

Input:

```ts
z.object({
  categorySlug: z.string(),
  sort: z.enum(["latest", "newest", "unanswered"]).default("latest"),
  cursor: z.string().optional(),
  limit: z.number().min(1).max(50).default(20),
})
```

Rules:

- Exclude deleted threads
- Exclude non-public category threads for guests

### `thread.create`

**Type:** member mutation

Input:

```ts
z.object({
  categoryId: z.string(),
  title: z.string().min(5).max(150),
  content: z.string().min(10).max(20000),
  tags: z.array(z.string().min(1).max(50)).max(5).default([]),
})
```

Rules:

- User must be logged in
- Category must allow posting
- Thread and first post must be created in one transaction
- Slug collision must be handled

## postRouter

### `post.listByThread`

**Type:** public query

Input:

```ts
z.object({
  threadSlug: z.string(),
  cursor: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
})
```

### `post.create`

**Type:** member mutation

Input:

```ts
z.object({
  threadId: z.string(),
  parentId: z.string().optional(),
  content: z.string().min(1).max(20000),
})
```

Rules:

- User must be logged in
- Thread must not be locked
- Parent reply depth cannot exceed 3
- Content must be sanitized before render

## userRouter

### `user.getPublicProfile`

**Type:** public query

Input:

```ts
z.object({ username: z.string() })
```

Return:

- username
- display name
- image
- bio
- public activity

Never return:

- email
- password hash
- session data

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

- Exclude deleted content
- Return thread-level results
- MVP can use PostgreSQL full-text search

## moderationRouter

### `moderation.report`

**Type:** member mutation

Input:

```ts
z.object({
  postId: z.string().optional(),
  threadId: z.string().optional(),
  reason: z.enum(["SPAM", "HARASSMENT", "OFF_TOPIC", "DUPLICATE", "OTHER"]),
  note: z.string().max(1000).optional(),
})
```

Rules:

- Must include either postId or threadId
- Prevent duplicate open report from same user for same content

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
