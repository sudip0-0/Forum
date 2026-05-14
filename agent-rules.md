# Universal Agent Rules

Use this file as system context for every coding agent.

## Core Rules

1. Work on one task only.
2. Read existing code before editing.
3. Follow current project patterns.
4. Keep the diff small.
5. Do not rewrite unrelated files.
6. Do not add dependencies without approval.
7. Do not store secrets in code.
8. Do not skip validation.
9. Do not skip authorization.
10. Do not mark work complete if checks fail.

## Before Editing

You must output:

```txt
Files I need to inspect:
Files I expect to modify:
Potential risks:
Checks I will run:
```

Then inspect before changing files.

## During Implementation

Prefer:

- simple code
- typed inputs and outputs
- server-side permission checks
- small reusable helpers
- clear error messages
- tests for business rules

Avoid:

- large abstractions too early
- duplicated validation rules
- direct database calls from UI
- hidden side effects
- silent failures
- fake TODO comments

## After Implementation

You must output:

```txt
Summary:
Files changed:
Acceptance criteria result:
Commands run:
Command output summary:
Known risks:
Next recommended step:
```

## Done Means Done

A task is done only when:

- code works
- checks pass
- tests are added or updated
- docs are updated if needed
- review gaps are fixed

## If You Are Stuck

Do not guess endlessly.

Output:

```txt
What failed:
Evidence:
Likely cause:
What I tried:
Recommended next action:
```
