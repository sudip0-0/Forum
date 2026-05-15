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

## 3. Actual Repo Structure

```txt
forum-app/
  ai/                         # planning and documentation
  e2e/                        # Playwright E2E specs
    auth.spec.ts
    thread.spec.ts
    search.spec.ts
    moderation.spec.ts
    moderator-actions.spec.ts
    admin-structure.spec.ts
    navigation-and-filters.spec.ts
    global-setup.ts

  prisma/
    schema.prisma
    migrations/
    seed.ts

  src/
    app/
      (public)/
        page.tsx                              # home/discovery page
        forums/page.tsx                       # section→category→forum listing
        forum/[forumSlug]/page.tsx            # thread list for a forum
        forum/[forumSlug]/new/page.tsx        # create thread
        forum/[forumSlug]/[threadSlug]/page.tsx  # thread detail + replies
        category/[categorySlug]/page.tsx      # category overview (forums + recent threads)
        search/page.tsx
        tags/[tagSlug]/page.tsx               # tag-filtered thread listing
        u/[username]/page.tsx                 # user profile
        loading.tsx                           # global skeleton loader
      (auth)/
        login/page.tsx
        register/page.tsx
      admin/
        page.tsx                              # dashboard with stats
        categories/page.tsx                   # legacy category CRUD
        structure/page.tsx                    # section/category/forum tree manager
        threads/page.tsx                      # thread management
        mod/page.tsx                          # moderation queue
        mod/history/page.tsx                  # moderation audit log
        users/page.tsx                        # user list + role + suspend
      api/
        auth/[...nextauth]/route.ts
        trpc/[trpc]/route.ts
      error.tsx                               # global error boundary
      not-found.tsx                           # custom 404
      layout.tsx
      sitemap.ts

    components/
      ui/
        button.tsx
      layout/
        header.tsx                            # server-prop-aware header (no useSession)
        client-shell.tsx
        session-provider.tsx
      forum/
        markdown.tsx
        markdown-editor.tsx
        reaction-buttons.tsx
        report-form.tsx
        tag-pill.tsx
        forum-filters.tsx
        thread-filters.tsx
        thread-moderation-controls.tsx
        thread-view-tracker.tsx
      admin/
        admin-header.tsx
      auth/
        sign-out-button.tsx
      navigation/
        breadcrumbs.tsx

    server/
      api/
        root.ts
        trpc.ts
        caller.ts                             # shared makeServerCaller helper
        rate-limit.ts
        routers/
          health.ts
          section.ts
          category.ts
          forum.ts
          thread.ts
          post.ts
          reaction.ts
          discovery.ts
          user.ts
          search.ts
          moderation.ts
      auth/
        config.ts
        permissions.ts
        password.ts
        session.ts
        actions.ts
      db/
        prisma.ts

    lib/
      slug.ts                                 # shared slugify helper
      validators.ts
      errors.ts
      utils.ts

    styles/
      globals.css
```

## 4. Domain Boundaries

| Domain | Owns | Must Not Own |
|---|---|---|
| Auth | sessions, credentials, roles | forum business logic |
| Section/Category/Forum | hierarchy and permissions | post content rendering |
| Thread | thread creation, status, listing | user password logic |
| Post | replies, markdown content, depth enforcement | category admin settings |
| Reaction | emoji reactions per user per target | post content or ranking logic |
| Discovery | home page aggregation, tag-browsing | any mutations |
| Moderation | reports, queue, audit log, thread actions, suspensions | normal user profile editing |
| Search | full-text query behavior | source-of-truth content |
| UI | pages and reusable components | direct database calls |

## 5. Data Flow: Create Thread

```txt
User submits create thread form
  ↓
Client validates basic form state
  ↓
Server action (forum/[forumSlug]/new/actions.ts)
  ↓
makeServerCaller() builds tRPC caller with session
  ↓
thread.create mutation
  ↓
Zod server validation
  ↓
Auth middleware checks member role + suspension
  ↓
Rate limit check (RL_CREATE_THREAD: 5/hr)
  ↓
Forum exists + isPublic + not locked
  ↓
Sequential creates:
  - thread (with slug from src/lib/slug.ts)
  - first post
  - thread.replyCount + lastActivityAt update
  ↓
Return thread slug → redirect to thread page
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
