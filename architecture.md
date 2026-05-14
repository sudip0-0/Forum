# Forum Website — Improved Technical Architecture

**Version:** 1.1  
**Status:** Build Ready  
**Architecture Style:** Modular full-stack TypeScript monolith with clear domain boundaries.

## 1. Architecture Summary

Use one Next.js application for the MVP.

The app should contain:

- Server-rendered public pages for SEO
- tRPC routers for typed internal APIs
- Prisma for database access
- PostgreSQL as the primary data store
- Redis later for rate limits, sessions, and real-time features
- Meilisearch later for advanced search
- Auth.js for authentication
- Zod for input validation
- Tailwind and shadcn/ui for UI

## 2. MVP Architecture

```txt
Browser
  ↓
Next.js App Router
  ├─ Public server-rendered pages
  ├─ Protected app pages
  ├─ tRPC API layer
  └─ Auth.js auth layer
        ↓
Prisma
        ↓
PostgreSQL
```

Add Redis, Meilisearch, R2, and Inngest only when the core app is stable.

## 3. Recommended Repo Structure

```txt
forum-app/
  ai/
    README.md
    product.md
    architecture.md
    tasks.md
    progress.md
    agents.md
    agent-rules.md
    prompt-library.md
    implementation-playbook.md
    environment.md
    data-model.md
    api-contracts.md
    ui-ux.md
    testing.md
    security.md
    decisions.md
    known-issues.md
    release-checklist.md

  prisma/
    schema.prisma
    seed.ts

  src/
    app/
      (public)/
        page.tsx
        forums/page.tsx
        forum/[categorySlug]/page.tsx
        forum/[categorySlug]/[threadSlug]/page.tsx
        search/page.tsx
        u/[username]/page.tsx
      (auth)/
        login/page.tsx
        register/page.tsx
      admin/
        page.tsx
        categories/page.tsx
      mod/
        queue/page.tsx
      api/
        auth/[...nextauth]/route.ts
        trpc/[trpc]/route.ts

    components/
      ui/
      layout/
      forum/
      editor/
      forms/
      moderation/

    server/
      api/
        root.ts
        trpc.ts
        routers/
          category.ts
          thread.ts
          post.ts
          user.ts
          moderation.ts
          search.ts
      auth/
        config.ts
        permissions.ts
      db/
        prisma.ts

    lib/
      slug.ts
      markdown.ts
      validators.ts
      errors.ts
      pagination.ts
      seo.ts

    styles/
      globals.css

  tests/
    unit/
    integration/
    e2e/
```

## 4. Domain Boundaries

| Domain | Owns | Must Not Own |
|---|---|---|
| Auth | sessions, credentials, roles | forum business logic |
| Category | category hierarchy and permissions | post content rendering |
| Thread | thread creation, status, listing | user password logic |
| Post | replies, markdown content, edits | category admin settings |
| Moderation | reports, queue, audit log | normal user profile editing |
| Search | indexing and query behavior | source-of-truth content |
| UI | pages and reusable components | direct database calls |

## 5. Data Flow: Create Thread

```txt
User submits create thread form
  ↓
Client validates basic form state
  ↓
tRPC thread.create mutation
  ↓
Zod server validation
  ↓
Auth middleware checks member role
  ↓
Category permission check
  ↓
Prisma transaction:
  - create thread
  - create first post
  - update category last activity
  ↓
Return thread slug
  ↓
Client redirects to thread page
```

## 6. Data Flow: Report Post

```txt
Member clicks report
  ↓
moderation.report mutation
  ↓
Auth check
  ↓
Validate reason and note
  ↓
Create report record
  ↓
Create moderation log item
  ↓
Moderator sees item in /mod/queue
```

## 7. Authentication and Authorization

Use role-based access control.

| Action | Guest | Member | Moderator | Admin |
|---|---:|---:|---:|---:|
| Read public content | Yes | Yes | Yes | Yes |
| Create thread | No | Yes | Yes | Yes |
| Reply | No | Yes | Yes | Yes |
| Edit own post | No | Yes | Yes | Yes |
| Soft delete any post | No | No | Yes | Yes |
| Lock thread | No | No | Yes | Yes |
| Manage categories | No | No | No | Yes |
| Manage users | No | No | No | Yes |

All authorization must happen server-side.

## 8. Search Architecture

### MVP

Use PostgreSQL search for title and content.

### Later

Add Meilisearch when:

- Core forum CRUD is stable
- Data shape is final enough
- Search relevance matters
- There are enough posts to justify external indexing

## 9. Real-Time Architecture

Do not start with real-time.

Phases:

1. MVP: normal page refresh and TanStack Query refetch
2. v1.1: polling for notification badge
3. v1.2: SSE for notifications and thread updates
4. v1.3: Redis Pub/Sub for multi-instance fanout

## 10. Background Jobs

Start without background jobs.

Add Inngest later for:

- email digests
- search indexing
- image processing
- delayed unmute
- cleanup jobs

## 11. Error Handling

Use consistent errors:

```txt
UNAUTHORIZED: user is not logged in
FORBIDDEN: user is logged in but lacks permission
NOT_FOUND: requested item does not exist or is not visible
BAD_REQUEST: validation failed
CONFLICT: duplicate slug, duplicate reaction, invalid state
INTERNAL_SERVER_ERROR: unexpected server error
```

Never leak internal errors to users.

## 12. Architecture Guardrails

Agents must not:

- Call Prisma directly from React components.
- Put authorization only in UI.
- Add new infrastructure without a decision record.
- Add external services before the MVP needs them.
- Mix moderation logic into normal post routers without clear boundaries.
- Store raw HTML without sanitization.

## 13. Scale Path

| Stage | Action |
|---|---|
| Local MVP | Next.js + PostgreSQL |
| First public beta | Add Redis for rate limits and sessions |
| Search growth | Add Meilisearch |
| Media-heavy usage | Add R2 file storage |
| Notification growth | Add SSE + Redis Pub/Sub |
| High traffic | Add caching, replicas, and background workers |
