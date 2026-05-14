# Forum Website — AI Build Documentation Pack

## Purpose

This folder is the working command center for building the forum application with AI coding agents such as Codex, OpenCode, Claude Code, Kimi, DeepSeek, Qwen, and GPT reviewers.

The original documents had a strong product vision, architecture, roadmap, progress log, and agent guide. This improved pack turns them into an execution system.

## Project Summary

Build a modern community forum with:

- Public browsing
- User registration and login
- Categories
- Threads
- Replies
- Markdown editor
- Search
- Basic moderation
- SEO-friendly public pages
- Later support for reactions, notifications, reputation, and advanced moderation

## Recommended Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Prisma
- PostgreSQL
- tRPC
- Zod
- Auth.js
- Redis
- Meilisearch
- Playwright
- Vitest

## Documentation Map

| File | Purpose |
|---|---|
| `product.md` | Product requirements, MVP scope, non-MVP boundaries |
| `architecture.md` | Technical architecture, folder structure, data flow |
| `tasks.md` | Ordered task roadmap with task contracts |
| `progress.md` | Daily progress, blockers, decisions, current state |
| `agents.md` | Agent roles and operating rules |
| `agent-rules.md` | Universal coding rules for every AI agent |
| `prompt-library.md` | Copy-paste prompts for planning, implementation, review, debugging |
| `implementation-playbook.md` | Step-by-step build process |
| `environment.md` | Local setup, env vars, service commands |
| `data-model.md` | Prisma model design and schema rules |
| `api-contracts.md` | tRPC router contracts and validation rules |
| `ui-ux.md` | UI design system and page requirements |
| `testing.md` | Unit, integration, E2E, accessibility, and CI checks |
| `security.md` | Auth, authorization, validation, upload, and privacy rules |
| `decisions.md` | Architecture Decision Records |
| `known-issues.md` | Known blockers, risks, deferred fixes |
| `release-checklist.md` | Merge, staging, and production release checklist |
| `changes-summary.md` | What was improved from the original files |

## Golden Workflow

Use this loop for every feature:

```txt
1. Choose one task from tasks.md
2. Create a branch
3. Ask an implementer model to scan first, not edit
4. Ask the implementer model to implement only that task
5. Run lint, typecheck, tests, and build
6. Ask GPT/reviewer model to review the diff
7. Ask implementer model to fix only the review gaps
8. Run checks again
9. Update progress.md and known-issues.md
10. Commit
```

## Main Rule

Never ask an agent to “continue building the app.”

Always give it:

```txt
Task ID:
Goal:
Acceptance criteria:
Files likely affected:
Files not to touch:
Checks to run:
Definition of done:
```

## First Build Target

The first working version should be:

```txt
User can register, log in, view public categories, create a thread, reply to a thread, and search for a thread locally.
```

Do not build advanced reputation, DMs, live notifications, webhook plugins, large-scale caching, or federation until core forum flows are stable.
