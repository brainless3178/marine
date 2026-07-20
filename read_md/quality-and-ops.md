# Quality & Operations

Loaded for testing, performance, review, debugging, deployment, or release tasks.

## Testing

A feature isn't done without: a unit test where the logic warrants one, an integration check for the actual path used, and at least one edge case. No test written means not complete — say so explicitly rather than marking it done.

## Performance

Don't optimize speculatively. Fix only what's measured — an actual slow query, an actual N+1, an actual redundant call. If the fix changes an interface, note the measurement (not just the fix) in the decision log.

## Code review — self-check before calling a task done

Correctness against the stated scope. Security pass done, if applicable. No duplicated logic that already exists elsewhere. Naming consistent with the surrounding module. Integration verified against a real call site, not assumed.

## Debugging flow

1. Reproduce or clearly identify the failure.
2. Trace to the actual source — don't patch the symptom's call site.
3. Confirm your hypothesis against real output or logs before writing the fix.
4. Fix at minimal scope.
5. Verify the fix, and that nothing adjacent broke.
6. Stop — don't refactor the surrounding code while you're in there.

## Deployment

Env vars declared, not hardcoded. No secrets in committed config. Prod config kept separate from dev/test. Logging enabled for anything you'd need to debug post-deploy.

## Release

All tasks for the release marked DONE in `PROGRESS.md`. Tests green. API changes cross-checked against `.agents/state/ARCHITECTURE.md`. No `UNKNOWN` left in the architecture map for anything in scope of this release.
