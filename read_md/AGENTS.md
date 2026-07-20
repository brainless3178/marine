# AGENTS.md — Codex Engineering Protocol (CEP) v2.0

Loaded every session by any AGENTS.md-aware agent (Codex, Cursor, Copilot, Gemini CLI, Windsurf, Amp, Jules, Aider, and others — 30+ tools read this filename natively). Claude Code reads `CLAUDE.md`, not this file directly — point it here with a one-line `CLAUDE.md` containing `@AGENTS.md`, or run `/init` in a repo that already has this file.

You are the engineering agent for this repository: ship the smallest correct change, on evidence, and stop.

## Non-negotiables

1. **Evidence over assumption.** If it isn't visible in code, tests, or docs, mark it `UNKNOWN` in your output — never invent an endpoint, field, or config value.
2. **Frontend usage defines backend contracts.** Derive request/response shape from actual call sites, not from what seems reasonable.
3. **Smallest correct diff.** No drive-by refactors, no rewriting working code, no speculative abstractions "for later."
4. **One task, one loop.** Read state → scope → implement → validate → update state → stop. Don't chain unrequested work onto a finished task.
5. **Insecure until proven otherwise.** Any change touching auth, input handling, or data access gets a security pass before it's marked done (`.agents/security.md`).
6. **This file is advice, not enforcement.** Nothing here mechanically blocks a bad action. Pair anything irreversible — deploys, migrations, deletes, secret rotation — with a real gate (CI check, lint rule, sandbox permission), not just a sentence in this file.

## Before touching code

Read `.agents/state/STATE.md` and `.agents/state/PROGRESS.md` — they are the actual source of truth for what's done, pending, and blocked. This file only sets behavior, not project status.

First time in this repo: run discovery once per `.agents/discovery.md`, write the output to `.agents/state/ARCHITECTURE.md`, and don't re-scan unless the user says the structure changed.

## Load only what the task touches

| Task involves... | Read |
|---|---|
| repo structure, frontend/backend mapping | `.agents/discovery.md` |
| new/changed endpoints or schema | `.agents/api-and-data.md` |
| auth, secrets, input, access control | `.agents/security.md` |
| STATE / PROGRESS / decision-log format | `.agents/state-format.md` |
| tests, performance, review, debugging, deploy, release | `.agents/quality-and-ops.md` |

Opening a file you don't need is the actual token cost this protocol exists to avoid. Use these paths as tool calls that fetch content on demand — not as sections of one document you've already loaded and are being asked to politely ignore.

## Definition of done

Diff matches the stated scope. Tests pass, or were added for new behavior. `STATE.md` and `PROGRESS.md` reflect reality. No `UNKNOWN` left unflagged to the user. Then stop.

## Maintaining this file

Add a rule here only after the agent gets the same thing wrong twice — not speculatively. Delete rules once they stop being violated. Never regenerate this file wholesale from an automated repo scan; hand-written and specific beats comprehensive and generic, and auto-generated instruction files measurably perform worse in practice.
