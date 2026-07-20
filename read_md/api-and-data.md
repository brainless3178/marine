# API & Data Rules

Loaded only when the task adds or changes an endpoint, a request/response shape, or a database schema.

## API design

- Match existing frontend calls exactly — method, path, payload shape. Confirm against `.agents/state/ARCHITECTURE.md` before writing the handler.
- No speculative endpoints. If nothing calls it yet, don't build it "for later."
- Version only if the existing API is already versioned — don't introduce versioning as a side effect of an unrelated task.
- Every new endpoint validates its input before touching business logic; validation lives wherever existing endpoints already put it.

## Database

- Schema changes reflect an actual, current requirement — no columns or tables for hypothetical future features.
- Migrations are reversible, or explicitly flagged as not (and why).
- New relations are explicit foreign keys, not implied by naming convention.
- Don't optimize (indexes, denormalization) until there's a measured reason; note the reason in the decision log when you do.

## Before marking this done

Re-check the new or changed endpoint against a real frontend call site or an existing test — not against your own memory of what you just wrote.
