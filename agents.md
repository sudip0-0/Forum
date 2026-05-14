# Forum Website — Agent Operating Guide

**Version:** 1.1  
**Status:** Active

## 1. Purpose

This project uses multiple AI agents, but each agent must work like a careful software engineer.

The agent system exists to:

- split planning, implementation, review, and debugging
- reduce hallucinated changes
- make progress auditable
- keep the codebase consistent
- avoid large unsafe rewrites

## 2. Agent Roles

| Agent | Best Model Type | Main Job |
|---|---|---|
| coordinator | GPT/reasoning model | choose next task, maintain docs, resolve conflicts |
| architect | GPT/reasoning model | review architecture and data flow |
| implementer | Kimi/DeepSeek/Qwen/Codex/OpenCode | implement one task at a time |
| reviewer | GPT 5.5/reasoning model | inspect diff, find gaps, approve or reject |
| debugger | strong coding model | diagnose errors from logs and stack traces |
| security | GPT/reasoning model | review auth, permissions, validation, XSS, secrets |
| qa | coding model + reviewer | write tests and verify journeys |
| docs | any reliable model | update docs after behavior changes |

## 3. Model Routing

| Task Type | Recommended Agent |
|---|---|
| Define MVP | coordinator or architect |
| Generate code | implementer |
| Fix failing test | debugger |
| Review implementation | reviewer |
| Auth or permissions | security + reviewer |
| Database schema | architect + backend implementer |
| UI components | frontend implementer + reviewer |
| E2E tests | qa |
| Refactor | reviewer first, implementer second |

## 4. Operating Loop

```txt
1. coordinator selects one task
2. implementer scans code without editing
3. implementer proposes file plan
4. implementer edits code
5. implementer runs checks
6. reviewer reviews diff
7. implementer fixes gaps
8. reviewer verifies
9. qa adds or updates tests
10. coordinator updates docs and progress
```

## 5. Required Context for Every Agent

Every coding agent should receive:

- `ai/product.md`
- `ai/architecture.md`
- `ai/tasks.md`
- `ai/progress.md`
- `ai/agent-rules.md`
- the exact task contract
- relevant source files
- recent error logs, if any

## 6. Handoff Format

When one agent hands off to another, use:

```md
# Handoff

## Current Goal

## Completed

## Files Changed

## Commands Run

## Results

## Known Issues

## Next Step

## Do Not Touch
```

## 7. Review Rules

A reviewer must check:

- correctness
- acceptance criteria
- edge cases
- architecture fit
- type safety
- authorization
- validation
- tests
- regressions
- unnecessary dependencies
- docs updates

The review verdict must be one of:

```txt
Approved
Needs changes
Reject
```

## 8. Conflict Rules

If two agents touch the same files:

1. stop parallel work
2. keep the smaller diff
3. re-run checks
4. update `known-issues.md`
5. continue with one owner

## 9. Forbidden Agent Behavior

Agents must not:

- rewrite the whole app
- ignore failing tests
- remove tests to pass CI
- invent completed work
- claim commands ran when they did not
- add new packages without explaining why
- put secrets in files
- bypass authorization because UI hides a button
- implement post-MVP features during MVP tasks

## 10. Quality Gate

No task is complete until:

- acceptance criteria pass
- relevant tests exist
- lint/typecheck/build pass
- reviewer approves
- progress.md is updated
