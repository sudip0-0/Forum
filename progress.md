# Forum Website — Progress Tracker

**Version:** 1.1  
**Status:** Not Started  
**Owner:** Project Coordinator

## 1. Current State

| Item | Status |
|---|---|
| Product scope | MVP defined |
| Architecture | Build-ready architecture drafted |
| Task roadmap | Ordered roadmap created |
| Local repo | Not confirmed |
| App scaffold | Not confirmed |
| Database migration | Not started |
| Auth | Not started |
| Core forum | Not started |
| Tests | Not started |
| Staging deploy | Not started |

## 2. Current Sprint

**Sprint:** 0 — Foundation  
**Goal:** Create the local project, database schema, API foundation, and auth base.

### Active Tasks

| Task | Owner | Status | Notes |
|---|---|---|---|
| INF-001 | agent-devops | 🔲 Not Started | Scaffold app |
| INF-002 | agent-devops | 🔲 Not Started | Docker and env |
| INF-003 | agent-backend | 🔲 Not Started | Prisma schema |
| INF-004 | agent-backend | 🔲 Not Started | tRPC setup |
| INF-005 | agent-security/backend/frontend | 🔲 Not Started | Auth foundation |

## 3. Daily Log Template

```md
## YYYY-MM-DD

### Completed
- 

### In Progress
- 

### Blockers
- 

### Decisions
- 

### Test Results
- 

### Next Steps
- 
```

## 4. Work Log

### 2026-05-14

### Completed
- Documentation pack improved for agentic build.
- MVP scope separated from post-MVP features.
- Build process, agent rules, prompt library, testing guide, and release checklist added.

### In Progress
- No implementation confirmed yet.

### Blockers
- Need local repository confirmation.
- Need final stack confirmation before generating code.

### Decisions
- Build MVP first with PostgreSQL search.
- Add Meilisearch, Redis real-time, R2 uploads, and advanced engagement after core forum works.

### Test Results
- No code tests yet.

### Next Steps
- Start INF-001 with implementation agent.

## 5. Blocker Log

| ID | Date | Task | Blocker | Owner | Resolution |
|---|---|---|---|---|---|
| BLK-001 | 2026-05-14 | Project | Local repo not yet confirmed | User | Create or open project root |

## 6. Decision Log Summary

Full records are in `decisions.md`.

| ID | Decision | Status |
|---|---|---|
| ADR-001 | Use Next.js modular monolith for MVP | Accepted |
| ADR-002 | Use PostgreSQL search before Meilisearch | Accepted |
| ADR-003 | Delay real-time until core forum is stable | Accepted |
| ADR-004 | Use AI task contracts for every implementation step | Accepted |

## 7. Review Queue

| Task | Implementation Summary | Reviewer | Status |
|---|---|---|---|
| None | — | — | — |

## 8. Completed Tasks

| Task | Date | Commit | Notes |
|---|---|---|---|
| None | — | — | — |

## 9. Metrics

Populate after working app exists.

| Metric | Target | Current |
|---|---:|---:|
| Build passing | Yes | — |
| Unit tests passing | Yes | — |
| E2E passing | Yes | — |
| Lighthouse mobile | > 90 | — |
| Search latency | < 300ms MVP | — |
| API p95 local | < 300ms | — |

## 10. Update Rules

Agents must update this file after every task.

Every update must include:

- What changed
- Files touched
- Checks run
- Failed checks
- Remaining risks
- Next recommended task
