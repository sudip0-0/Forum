# Forum Website — Improved Product Requirements Document

**Version:** 1.1  
**Status:** Build Ready  
**Primary Goal:** Launch a focused MVP before expanding into advanced community features.

## 1. Vision

Build a fast, SEO-friendly forum where people can ask questions, discuss topics, and find existing answers easily.

The product should feel modern and responsive, but the MVP must stay simple enough to build, test, and deploy safely.

## 2. Product Principles

1. Public content must be easy to discover.
2. Posting must be simple.
3. Moderation must exist from day one.
4. The app must work well on mobile.
5. Security and access control must be built into the architecture, not added later.
6. Advanced engagement features must not block the MVP.

## 3. Target Users

| Persona | Goal | MVP Need |
|---|---|---|
| Visitor | Find useful answers from search engines | Public read-only access |
| Member | Ask questions and reply | Register, login, create threads, reply |
| Moderator | Keep discussions clean | Report review, soft delete, lock thread |
| Admin | Configure the forum | Manage categories and users |
| Power User | Write long posts and code snippets | Markdown editor and syntax highlighting |

## 4. MVP Scope

The MVP includes only what is needed for a usable forum.

### 4.1 Authentication

- Email/password registration
- Login/logout
- Password hashing
- Real email verification
- Password reset
- Basic profile page
- Roles: guest, member, moderator, admin

OAuth is not required for the first working version.

### 4.2 Categories

- List public categories
- Admin can create, update, reorder, and hide categories
- Category slug pages
- Basic permission model:
  - Guest: read public categories
  - Member: post in public categories
  - Moderator: manage posts and threads
  - Admin: manage categories and users

### 4.3 Threads

- Create thread with title, body, category, and optional tags
- Thread detail page
- Thread list by category
- Sorting:
  - latest
  - newest
  - unanswered
- Thread status:
  - normal
  - pinned
  - locked
  - soft deleted

### 4.4 Replies

- Create reply
- Edit own reply within allowed window
- Soft delete own reply if no moderation restriction applies
- Nested replies up to 3 levels
- Markdown rendering
- Code block support

### 4.5 Search

MVP search should start simple.

- Search thread title and post content
- Result page at `/search?q=`
- Use PostgreSQL full-text search first
- Add Meilisearch after core CRUD is stable

### 4.6 Basic Moderation

- Report post or thread
- Moderator queue
- Resolve report
- Soft delete post/thread
- Lock thread
- Basic audit log

### 4.7 SEO

- Server-render public pages
- Stable slugs
- Metadata for category and thread pages
- Sitemap route
- Canonical URLs

## 5. Post-MVP Scope

Move these after MVP:

- OAuth login
- Real-time notifications
- Email digests
- Reputation system
- Badges
- Emoji reactions
- Accepted solutions
- Advanced search facets
- File uploads
- Webhooks
- Private messaging
- Federation
- AI-generated suggestions
- Native mobile app
- Full analytics dashboard

## 6. Non-Functional Requirements

| Area | MVP Target |
|---|---|
| Mobile | All core flows usable at 375px width |
| Accessibility | Keyboard navigation and visible focus states |
| Performance | Public thread page should load fast on slow networks |
| Security | All mutations must check authentication and ownership |
| Reliability | Database migrations and seed scripts must run cleanly |
| Testing | Critical journeys covered with E2E tests |

## 7. MVP Acceptance Criteria

The MVP is complete when:

1. A visitor can browse public categories and read threads.
2. A user can register, log in, create a thread, and reply.
3. A user can search for a thread.
4. A moderator can review reports and soft delete content.
5. An admin can manage categories.
6. Public pages have SEO metadata.
7. Unit, integration, and E2E checks pass.
8. The app deploys to staging.

## 8. Product Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Scope creep | MVP never ships | Freeze MVP and move extra features to backlog |
| Moderation too weak | Spam and unsafe content | Add reports, soft delete, and audit log early |
| Search complexity | Delay core launch | Start with PostgreSQL search, add Meilisearch later |
| Real-time complexity | Infrastructure burden | Use polling/SSE after core flows work |
| Auth bugs | Security risk | Review auth with GPT/security agent before merge |

## 9. Definition of Done

A feature is done only when:

- It satisfies its acceptance criteria.
- It has validation and error states.
- It has relevant tests.
- It passes lint, typecheck, tests, and build.
- It updates docs if behavior changes.
- It has been reviewed by a reviewer model or human.
