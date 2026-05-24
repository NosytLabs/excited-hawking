## Big-Bang Rewrite Ledger

| Removed path | Replacement path | Reason | Behavior impact |
| --- | --- | --- | --- |
| Repeated section wrappers in `src/App.tsx` | Shared `SectionBlock` wrapper in `src/App.tsx` | Remove duplicated layout/error-boundary/suspense scaffolding across secondary sections | No behavior change; same section order, ids, and lazy boundaries preserved |
| Duplicate stream status fields in `src/components/AgentStream.tsx` | Single canonical status line in `src/components/AgentStream.tsx` | Eliminate redundant stake/connection labels from mixed design eras | No data loss; stream still shows tier, stake, and connection state once |
| Hardcoded year assertion in `src/components/__tests__/AppHeader.test.tsx` | Runtime year assertion using `new Date().getFullYear()` | Prevent yearly brittle failure in header branding test | Test remains strict while avoiding calendar-based breakage |
| Inline `sqrt()` in `services/staking.ts`, `services/governance.ts`, `routes/staking.ts` | Shared `bigIntSqrt` in `utils/math.ts` | Remove duplicated bigint sqrt implementation | Same quadratic weight calculation |
| Duplicate `validateSignaturePattern()` in `services/x402.ts` | Delegates to exported `verifySignatureFormat()` in `middleware/auth.ts` | Unify signature format validation | Same error category; error detail string simplified |
| `/api/memory/*` handlers in `routes/emergence.ts` | Dedicated `routes/memory.ts` | Separation of concerns: memory != emergence | No behavior change; same route paths preserved |
| `@testing-library/user-event` in `package.json` | Removed | Unused in any source/test file | No impact; never imported |
| `@fastify/websocket` in `backend/package.json` | Removed | Unused in any backend source file | No impact; never registered or imported |
| `docs/superpowers/plans/2026-05-24-audit-fixes.md` | Removed | Stale pre-refactor plan; referenced non-existent code paths | No impact; no current references |
| `docs/superpowers/plans/2026-05-24-audit-remediation.md` | Removed | Stale pre-refactor plan; superseded by big-bang design | No impact; no current references |
| `docs/superpowers/plans/2026-05-24-commons-agent-warm-shell-audit-remediation.md` | Removed | Completed warm-shell audit implementation plan | No impact; work already done |
| `docs/superpowers/plans/2025-05-23-commons-agent-full-functional.md` | Removed | Year-old plan superseded by current architecture | No impact; no current references |
| `docs/superpowers/plans/2025-05-23-commons-agent-visual-redesign.md` | Removed | Year-old plan superseded by current architecture | No impact; no current references |
| `docs/superpowers/specs/2026-05-24-commons-agent-warm-shell-audit-design.md` | Removed | Completed warm-shell audit design spec | No impact; work already done |
| `docs/superpowers/specs/2025-05-23-commons-agent-visual-redesign.md` | Removed | Year-old spec superseded by current design | No impact; no current references |
| `src/assets/hero.png` | Removed | Unused asset | No impact; not imported anywhere |
| `src/assets/react.svg` | Removed | Unused Vite boilerplate | No impact; not imported anywhere |
| `src/assets/vite.svg` | Removed | Unused Vite boilerplate | No impact; not imported anywhere |
| `data/memvid.json` | Untracked, gitignored | Runtime data, not source code | No impact; generated at runtime |
| `backend/data/memvid.json` | Untracked, gitignored | Runtime data, not source code | No impact; generated at runtime |

(End of file)
