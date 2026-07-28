# Accepted Risk: react-router RSC Mode CSRF Bypass

## Vulnerability
**GHSA-qwww-vcr4-c8h2** — React Router RSC Mode CSRF Bypass allows Action Execution before 400 Response.

- **Affected versions:** `react-router` (7.12.0 – 8.2.0)
- **Installed version:** `react-router-dom@7.18.1` (depends on `react-router@7.18.1`)

## Risk Assessment

| Factor | Assessment |
|--------|-----------|
| **Severity** | High (CVSS 7.5) |
| **Exploitability** | Requires RSC (React Server Components) mode to be enabled |
| **Current setup** | This is a **client-side SPA** — RSC mode is **not enabled** |
| **Impact on app** | **None** — the vulnerability only affects apps using React Router's RSC features (Next.js-style server components). This app uses `react-router-dom` in standard client-side mode. |
| **Fix available** | `npm audit fix --force` would downgrade to `react-router-dom@7.11.0`, but this may introduce breaking changes with `react@19.x` |

## Decision
**ACCEPT the risk.** The vulnerability is not exploitable in the current architecture (client-side SPA without RSC). Pinning to an older version would require downgrading other dependencies and provides no security benefit.

## Future Action
Monitor the `react-router` v8 release for a permanent fix, then upgrade at that time.

*Last reviewed: 2026-07-28*
