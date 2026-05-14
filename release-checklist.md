# Forum Website — Release Checklist

## Local Task Completion Checklist

Before committing a task:

```txt
[ ] Acceptance criteria met
[ ] No unrelated changes
[ ] Lint passes
[ ] Typecheck passes
[ ] Unit/integration tests pass
[ ] Build passes
[ ] Docs updated if needed
[ ] progress.md updated
[ ] known-issues.md updated if needed
[ ] Reviewer approved
```

## Pull Request Checklist

```txt
[ ] PR title references task ID
[ ] PR description explains what changed
[ ] Screenshots added for UI changes
[ ] Test output included
[ ] Risk section included
[ ] Security notes included for auth/moderation/content changes
[ ] No secrets in diff
[ ] No generated junk files committed
```

## Staging Release Checklist

```txt
[ ] main branch builds
[ ] database migrations applied to staging
[ ] seed/demo data available if needed
[ ] auth works
[ ] create thread works
[ ] reply works
[ ] search works
[ ] moderation queue works
[ ] sitemap works
[ ] mobile smoke test done
[ ] error tracking enabled
[ ] environment variables configured
```

## Production Readiness Checklist

```txt
[ ] Staging tested
[ ] Database backup plan ready
[ ] Admin account secured
[ ] Rate limiting enabled
[ ] Security headers configured
[ ] Error logging enabled
[ ] Terms/privacy pages added if public
[ ] Email domain configured if sending email
[ ] Monitoring endpoint available
[ ] Rollback plan documented
```

## MVP Launch Criteria

Launch only when:

```txt
[ ] Visitors can read public content
[ ] Users can register and log in
[ ] Members can create threads
[ ] Members can reply
[ ] Search returns relevant threads
[ ] Moderators can resolve reports
[ ] Admins can manage categories
[ ] Critical E2E tests pass
[ ] No high/critical security issues
[ ] Staging has been tested on mobile
```

## Rollback Plan

If production deploy fails:

1. Revert to previous deployment.
2. Check migrations.
3. If migration is destructive, restore from backup.
4. Document incident in `progress.md`.
5. Add follow-up issue in `known-issues.md`.
