# Forum Website — Security Guide

## Security Principles

1. Trust nothing from the client.
2. All mutations require server-side authorization.
3. Public pages must filter private and deleted content.
4. User content must be sanitized.
5. Secrets must never enter Git.
6. Security-sensitive changes require review.

## Authentication

MVP:

- Email/password login
- Password hashing with Argon2id or bcrypt if Argon2 setup blocks progress
- Real email verification before posting or reporting
- Password reset with expiring single-use tokens
- Session handled by Auth.js
- Secure cookies in production

Post-MVP:

- OAuth
- TOTP 2FA
- device/session management

## Authorization

Roles:

```txt
MEMBER
MODERATOR
ADMIN
```

Rules:

- Members can create and edit their own content.
- Moderators can soft delete, lock, and resolve reports.
- Admins can manage categories and user roles.
- Last admin cannot be demoted.

Never rely on UI-only checks.

## Input Validation

Use Zod for every tRPC input.

Validate:

- title length
- content length
- tag count
- usernames
- report reason
- pagination limit
- slug format

## XSS Protection

User-generated content is dangerous.

Rules:

- Store raw Markdown.
- Render with safe Markdown renderer.
- Sanitize HTML output.
- Do not allow arbitrary script, iframe, or event handlers.
- Add tests for dangerous Markdown/HTML.

## CSRF

Use Auth.js protections and SameSite cookies.

For non-tRPC route handlers that mutate state:

- require authenticated session
- validate origin/referer where relevant
- avoid GET for state changes

## Rate Limiting

MVP can document and stub rate limits.

Add Redis-backed rate limits before public launch.

Recommended limits:

| Action | Limit |
|---|---|
| login attempts | 5 per 15 minutes |
| registration | 3 per hour per IP |
| create thread | 5 per hour for new users |
| replies | 30 per hour for normal users |
| report content | 20 per day |
| search | 60 per minute |

## Secrets

Never commit:

- database URLs
- auth secrets
- OAuth secrets
- API keys
- storage credentials

Use:

- `.env.local`
- `.env.example` with placeholders
- Vercel/Railway env settings for deployment

## File Uploads

Do not add uploads in MVP unless needed.

When added:

- enforce file size
- validate MIME and magic number
- scan risky files
- store outside app server
- serve from separate domain
- strip metadata from images

## Moderation Safety

All moderation actions must:

- require moderator/admin role
- create audit log
- include reason
- use transaction
- not hard delete content immediately

## Security Review Checklist

Before merging auth, moderation, or user-generated content:

```txt
[ ] Inputs validated
[ ] Server auth check exists
[ ] Ownership or role check exists
[ ] Deleted/private content filtered
[ ] Dangerous HTML sanitized
[ ] No secrets committed
[ ] Error messages do not leak internals
[ ] Tests cover forbidden cases
[ ] Reviewer approved
```
