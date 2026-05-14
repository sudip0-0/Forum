# Forum Website — Implementation Playbook

This is the step-by-step process for using the documentation pack to build the app.

## Phase A — Prepare the Repo

### Step 1: Create or open the project folder

```bash
mkdir forum-app
cd forum-app
```

### Step 2: Copy docs into the repo

Create an `ai` folder and place every Markdown file from this pack inside it.

```bash
mkdir ai
```

Expected:

```txt
forum-app/ai/product.md
forum-app/ai/architecture.md
forum-app/ai/tasks.md
forum-app/ai/progress.md
forum-app/ai/agents.md
forum-app/ai/agent-rules.md
forum-app/ai/prompt-library.md
...
```

### Step 3: Start a Git repo

```bash
git init
git add ai
git commit -m "docs: add ai build documentation"
```

## Phase B — Use AI Agents Correctly

### Step 4: Ask GPT to choose the next task

Use the prompt from `prompt-library.md` named `Next Task Selector Prompt`.

The first task should usually be:

```txt
INF-001 — Create Next.js Project Scaffold
```

### Step 5: Create a branch

```bash
git checkout -b feature/inf-001-scaffold
```

### Step 6: Give the implementation prompt to Codex/OpenCode

Use `Implementation Prompt` from `prompt-library.md`.

Paste:

- `ai/product.md`
- `ai/architecture.md`
- `ai/tasks.md`
- `ai/progress.md`
- `ai/agent-rules.md`
- task contract from `tasks.md`

Tell the model:

```txt
Implement only INF-001. Do not start INF-002.
```

### Step 7: Run checks locally

After implementation:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

If scripts do not exist yet, ask the agent to add them as part of INF-001.

### Step 8: Ask GPT to review the diff

Get diff:

```bash
git diff
```

Use `GPT Reviewer Prompt` from `prompt-library.md`.

Paste:

- task contract
- git diff
- command output

### Step 9: Fix only review gaps

Use `Gap Fix Prompt`.

Do not allow the implementer to add new features during the fix.

### Step 10: Commit

```bash
git status
git add .
git commit -m "feat: scaffold Next.js app"
```

## Phase C — Build the App in Order

Follow this order:

```txt
INF-001: scaffold app
INF-002: local infra and env
INF-003: Prisma schema and seed
INF-004: tRPC base
INF-005: auth
CORE-001: categories
CORE-002: threads
CORE-003: replies
CORE-004: markdown
CORE-005: profiles
CORE-006: search
MOD-001: reports
MOD-002: mod queue
MOD-003: user management
POL-001: SEO
POL-002: mobile UX
POL-003: empty/loading/error states
QA-001: unit/integration tests
QA-002: E2E tests
SEC-001: security review
```

## Phase D — Per-Task Checklist

Before implementation:

```txt
[ ] Read product.md
[ ] Read architecture.md
[ ] Read task contract
[ ] Read agent-rules.md
[ ] Create branch
[ ] Ask agent to scan first
```

During implementation:

```txt
[ ] Keep changes small
[ ] Add validation
[ ] Add authorization
[ ] Add tests
[ ] Avoid unrelated files
```

After implementation:

```txt
[ ] Run lint
[ ] Run typecheck
[ ] Run tests
[ ] Run build
[ ] Review git diff
[ ] GPT review
[ ] Fix gaps
[ ] Update progress.md
[ ] Commit
```

## Phase E — How to Handle Errors

When a command fails:

1. Copy the exact command.
2. Copy the full error.
3. Paste recent diff.
4. Use the `Debugging Prompt`.
5. Fix the smallest root cause.
6. Run the failed command again.

Do not ask the model to “fix all errors” without evidence.

## Phase F — When to Add Post-MVP Features

Only add post-MVP features when all are true:

```txt
[ ] Core forum flows work
[ ] Auth is stable
[ ] Search works
[ ] Moderation works
[ ] E2E tests pass
[ ] Staging deploy works
```

Then choose from Phase 5 in `tasks.md`.

## Phase G — How to Use Multiple Models

Use cheaper/open-source models for:

- scaffolding
- simple CRUD
- UI components
- tests
- docs updates

Use GPT/reasoning models for:

- architecture review
- security review
- diff review
- tricky bugs
- database design
- authorization logic

## Phase H — Best Daily Routine

```txt
1. Open progress.md
2. Pick one task
3. Create branch
4. Run implementation prompt
5. Run checks
6. Run review prompt
7. Fix gaps
8. Commit
9. Update progress.md
10. Stop
```

Stopping after one clean task is better than letting agents drift across the app.
