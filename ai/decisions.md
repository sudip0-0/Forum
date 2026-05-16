# Forum Website — Architecture Decision Records

Use this file to record major decisions so agents do not reopen the same debates.

## ADR-001 — Use a Modular Next.js Monolith for MVP

**Date:** 2026-05-14  
**Status:** Accepted

### Decision

Build the MVP as one Next.js TypeScript application with clear domain boundaries.

### Reason

It reduces deployment complexity, keeps types shared, and is easier for AI agents to work in.

### Tradeoff

The app may need service extraction later if scale requires it.

### Impact

Do not create separate backend services during MVP.

---

## ADR-002 — Use PostgreSQL Search Before Meilisearch

**Date:** 2026-05-14  
**Status:** Accepted

### Decision

Implement MVP search using PostgreSQL first. Add Meilisearch later.

### Reason

Search should not block core forum development.

### Tradeoff

Search relevance will be weaker at first.

### Impact

Do not add Meilisearch indexing until core CRUD and search baseline work.

---

## ADR-003 — Delay Real-Time Features Until Core Forum Is Stable

**Date:** 2026-05-14  
**Status:** Accepted

### Decision

Do not implement live notifications or SSE in MVP.

### Reason

Real-time infrastructure adds complexity before core flows are proven.

### Tradeoff

Users will not receive instant updates in MVP.

### Impact

Use normal refetch, page refresh, or simple polling first.

---

## ADR-004 — Use Task Contracts for Every AI Coding Session

**Date:** 2026-05-14  
**Status:** Accepted

### Decision

Every AI coding session must start from a task contract in `tasks.md`.

### Reason

Task contracts reduce scope drift and make review easier.

### Tradeoff

More planning upfront.

### Impact

Do not ask agents to “continue building.” Always give exact task ID and acceptance criteria.

---

## ADR-005 — Treat Auth, Moderation, and User Content as Security-Sensitive

**Date:** 2026-05-14  
**Status:** Accepted

### Decision

Any change touching auth, roles, moderation, Markdown rendering, or user content requires security review.

### Reason

These areas are high-risk.

### Impact

Use `security.md` and the security review prompt before merge.

---

## ADR-006 â€” Search Results and MVP Profile Pages Are Not Index Targets

**Date:** 2026-05-16  
**Status:** Accepted

### Decision

Keep `/search` and `/u/[username]` publicly accessible, but emit `noindex,follow` metadata for both during MVP.

### Reason

Search pages are parameterized duplicate surfaces, and current profile pages are intentionally lightweight rather than strong landing pages.

### Impact

Do not add search or profile URLs to the sitemap during MVP. Revisit profile indexing only if profiles become richer public content hubs later.
