# Audit Remediation Design

> **Goal:** Fix all 33 issues identified in the comprehensive 7-phase audit across frontend, backend, and configuration layers.

**Architecture:** Three-layer approach — frontend fixes first (canvas, components, CSS), then backend/config fixes (rootDir, TS/ Vitest alignment, ESLint, env), then polish (dead code, hardcoded values, CSS cleanup, accessibility). Each layer independently verifiable before proceeding.

**Tech Stack:** React 19, Vite 8, Tailwind v4, Fastify 5, Socket.IO 4, TypeScript 6.x/5.x, Vitest 4.x/2.x

---

## Scope

All 33 issues from the comprehensive audit, organized into three sequential layers:

### Layer 1: Frontend Fixes (14 items)

| # | Issue | File(s) | Fix |
|---|-------|---------|-----|
| F1 | `canvasPixels` hardcoded empty array | `AgentContext.tsx:239` | Populate from real state data |
| F2 | Canvas 2D API uses CSS vars (not resolved) | `AgentStream.tsx`, `CanvasLayer.tsx`, `MemoryBrain.tsx` | Resolve via `getComputedStyle()` or use JS color constants |
| F3 | MemoryBrain dual-rAF race + stale `nodesRef` | `MemoryBrain.tsx:138-249` | Update `nodesRef.current` on physics tick, fix cleanup |
| F4 | MemoryBrain rAF runs in background tabs | `MemoryBrain.tsx` | Pause animation on `visibilitychange` |
| F5 | Mood hardcoded to `'IDLE'` | `AgentStream.tsx:36` | Wire to WebSocket events or remove dead UI |
| F6 | Log auto-scroll steals user scroll position | `AgentStream.tsx:61-63` | Check if user scrolled up before auto-scrolling |
| F7 | `new Date()` in render (unstable timestamp) | `AgentStream.tsx:430` | Use stable state or memoize |
| F8 | LoadingSkeleton duplicate `<style>` tags | `LoadingSkeleton.tsx` | Define `@keyframes shimmer` once in `index.css` |
| F9 | Dead `consciousness` var, unnecessary `useMemo` | `LifeMeter.tsx:20-27` | Remove dead var, move `tierRanges` to module const |
| F10 | `useWebSocket` hook never imported | `websocket.ts:196-204` | Remove dead export |
| F11 | PromptBox share timeout race | `PromptBox.tsx:44-49` | Fix cleanup logic |
| F12 | Governance interval runs with no active proposals | `Governance.tsx:137-167` | Conditional interval |
| F13 | Guestbook optimistic upvote may double-count | `Guestbook.tsx:72-77` | Guard against server echo double-count |
| F14 | Overloaded `vote()` in api.ts | `api.ts:89-113` | Split into clear signatures |

### Layer 2: Backend & Config Fixes (8 items)

| # | Issue | File(s) | Fix |
|---|-------|---------|-----|
| C1 | `rootDir: ".."` causes duplicate build output | `backend/tsconfig.json` | Change to `"."`, adjust include pattern |
| C2 | TS 6.0.3 (root) vs 5.9.3 (backend) mismatch | `package.json`, `backend/package.json` | Align both to TypeScript 6.x |
| C3 | Vitest 4.x (root) vs 2.x (backend) mismatch | `package.json`, `backend/package.json` | Align both to Vitest 4.x |
| C4 | ESLint uses `globals.browser` for backend files | `eslint.config.js` | Add separate config object with `globals.node` |
| C5 | No `.env.example` for VITE_ vars | root | Create `/.env.example` |
| C6 | `.env` not in `.gitignore` | `.gitignore` | Add `.env`, `.env.*` patterns |
| C7 | Backend has no `vitest.config.ts` | `backend/` | Add with explicit Node env |
| C8 | `@types/node` versions differ | `package.json`, `backend/package.json` | Align to same major version |

### Layer 3: Polish (6 items)

| # | Issue | File(s) | Fix |
|---|-------|---------|-----|
| P1 | Hardcoded `@TheCommonsAgent` handle | `PromptBox.tsx:80` | Update to project identity |
| P2 | `console.error` in Governance | `Governance.tsx:211` | Replace with `addLog` |
| P3 | Terminal animations neutralized, references remain | `index.css`, `AgentStream.tsx`, `Governance.tsx` | Either restore or clean up |
| P4 | CSS var names lie (`--term-amber` = `--shell-text`) | `index.css:42-45` | Fix values or rename |
| P5 | Single-handler-per-event WebSocket model | `websocket.ts:177-183` | Support multiple handlers per event |
| P6 | Missing `aria` on interactive canvases | `AgentStream.tsx`, `CanvasLayer.tsx`, `MemoryBrain.tsx` | Add proper labels/descriptions |

---

## Verification Gates

After each layer:
- `npm run test -- --run` — 378 frontend tests must pass
- `cd backend && npm test` — 120 backend tests must pass
- `npm run lint` — no errors
- `npm run typecheck` — no errors
- `npm run build` — production build succeeds
- `cd backend && npm run build` — backend compiles

## Risk Notes

- Canvas fixes (F1-F4) change rendering code that is not covered by existing tests (jsdom doesn't implement canvas). Manual visual verification needed after deployment.
- Aligning TS versions (C2) could surface new type errors if TS 6.x catches things in backend code that 5.x didn't.
- Multiple-handler WebSocket change (P5) could break event handling if components accidentally register conflicting handlers.

## Non-Goals

- No new features
- No architectural restructuring beyond what's listed
- No adding React Router or state management libraries
- No E2E tests
