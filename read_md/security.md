# Security Pass

Loaded whenever a change touches auth, secrets, input handling, or data access. Default assumption: insecure until you've checked.

## Checklist for any touched code

- **Auth** — does this path still require the same auth it required before your change? If access was widened, is that intentional and part of the stated task?
- **Input** — is every new input validated or sanitized before use, not just at the UI layer?
- **Injection** — any raw string concatenated into a query, shell command, or template? Replace with parameterization or escaping.
- **Access control** — can a user reach data or actions outside their own scope through this change?
- **Secrets** — no credentials, tokens, or keys in code, logs, or committed config. Env vars only, and never logged.
- **Data exposure** — does any new response field leak more than the frontend consuming it actually needs?

## On finding a problem

Fix it within the current task's scope if it's caused by your change. If it's pre-existing and out of scope, log it in `.agents/state/PROGRESS.md` as a flagged risk rather than silently fixing it (scope creep) or silently ignoring it (worse).

## Reminder

This checklist is advisory. For anything genuinely irreversible — secret rotation, prod data deletion, auth-bypass-capable changes — the real safeguard is a sandbox permission or a required human approval step, not this file.
