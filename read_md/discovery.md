# Discovery & Architecture Map

Loaded from AGENTS.md only when the task needs repo-structure or module-mapping context. Run discovery once per repo; after that, read `.agents/state/ARCHITECTURE.md` instead of re-scanning.

## Discovery (run once)

1. Scan top-level structure and package/build manifests.
2. Identify frontend modules and their entry points.
3. Identify backend modules: routes, controllers, services, models.
4. Trace 2–3 real frontend call sites per feature area to confirm actual API usage — don't infer from naming alone.
5. Write findings to `.agents/state/ARCHITECTURE.md` using the template below. Don't repeat the full scan — update the file incrementally as you learn more.

## ARCHITECTURE.md template

```
# Architecture Map
Last updated: <date> by <task ref>

## Frontend modules
- <module>: <entry point> — calls: <endpoints used>

## Backend modules
- <module>: <route file> -> <service> -> <model>

## Confirmed API flows
- <METHOD> <path> — used by <frontend call site> — status: IMPLEMENTED | PARTIAL | NOT IMPLEMENTED | UNKNOWN

## Database
- <table/collection>: <owning module>

## Gaps
- <thing referenced but missing, with status>
```

## Frontend-analysis rule

Frontend call sites are ground truth for API shape. Never guess a missing endpoint's request or response format — mark it `NOT IMPLEMENTED` or `UNKNOWN` in the map and say so, rather than fabricating something plausible.

## Backend-analysis rule

Only describe what you can point to: an actual controller, service, route, or model. Anything else gets one of three explicit statuses — `NOT IMPLEMENTED`, `PARTIALLY IMPLEMENTED`, or `UNKNOWN`. Never leave a gap silently unlabeled.
