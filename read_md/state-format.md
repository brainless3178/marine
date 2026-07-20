# State, Progress & Decision Log — Formats

Loaded when you need the exact schema for STATE.md, PROGRESS.md, or the decision log, or the first time you create them in a new repo. All three live under `.agents/state/`.

## STATE.md — single current snapshot, overwritten each update

```
# State
Updated: <date> · Task: <task ref>
Current focus: <one line>
Files touched this task: <list>
Open questions / UNKNOWNs: <list, or "none">
```

## PROGRESS.md — append-only log

```
## <date> — <task ref>
Status: DONE | BLOCKED | PARTIAL
Summary: <1-2 lines, what changed>
Blocked on: <if BLOCKED, what's needed>
Flagged (out of scope): <risks/gaps noticed but not fixed, or "none">
```

## DECISIONS.md — architectural/API/schema decisions only, append-only

```
## <date> — <short title>
Problem: <what forced a decision>
Decision: <what was chosen>
Reason: <why, in 1-2 lines>
Consequences: <what this constrains going forward>
```

## Rule

Don't log routine implementation detail here — only decisions a future session would otherwise have to re-derive from scratch. If it's recoverable by reading the code, it doesn't belong in the log.
