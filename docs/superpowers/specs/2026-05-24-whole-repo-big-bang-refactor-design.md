# Whole-Repo Big-Bang Refactor And Cleanup Design

**Date:** 2026-05-24
**Author:** OpenCode
**Status:** APPROVED

---

## Vision

Execute an aggressive, whole-repo cleanup and refactor pass that removes redundancy, simplifies architecture, tightens tooling, and preserves core behavior after stabilization.

This is a big-bang rewrite pass, not an incremental polish cycle. The goal is maximum structural improvement in one integrated change set, followed by strict verification and hardening.

---

## Scope

### In Scope

- Frontend application code under `src/`
- Backend application code under `backend/src/`
- Build, test, lint, and type tooling at root and backend scope
- Dependency cleanup and lockfile consistency
- Redundant docs/files cleanup directly tied to the refactor

### Explicit Target Areas

- `src/components/*`
- `src/App.tsx`
- `src/index.css`
- `backend/src/routes/*`
- `backend/src/services/*`
- `backend/src/utils/*`
- `backend/src/types/*`
- `package.json`
- `backend/package.json`
- `tsconfig*.json` and `backend/tsconfig.json`
- `eslint.config.js`
- `vite.config.ts`
- `vitest.config.ts`

### Out Of Scope

- Net-new product features not required for cleanup
- Infrastructure migrations unrelated to repository cleanup
- Behavioral redesigns that change core product intent

---

## Guardrails

- Preserve user-facing and API behavior after stabilization.
- Favor simplification over abstraction layering.
- Remove dead code and duplicate pathways decisively.
- Keep replacement ownership clear when files are removed or merged.
- Treat verification gates as mandatory completion criteria.

---

## Approach Selection

User-selected approach: **Approach B (big-bang rewrite pass)**.

Rationale:

- Maximizes structural cleanup speed and impact.
- Allows broad boundary normalization in one architectural pass.
- Accepts short-term instability, resolved during dedicated stabilization.

Trade-off acknowledged:

- Higher temporary regression risk and more complex fallout triage than staged execution.

---

## Execution Architecture

### Phase 1: Structural Reshape

#### Frontend

- Consolidate overlapping UI logic across high-touch components (header, onboarding, prompt flow, stream, meter, canvas).
- Normalize state ownership and data flow to reduce prop and responsibility duplication.
- Standardize component contracts and naming.
- Remove duplicated or conflicting styling paths in favor of a single canonical pattern.

#### Backend

- Flatten handler/service duplication.
- Unify validation and error-response surfaces.
- Normalize shared event and type boundaries.
- Remove redundant utilities and align service responsibilities.

### Phase 2: Dependency And Tooling Purge

- Remove unused dependencies in root and backend packages.
- De-duplicate overlapping dependency choices.
- Simplify and normalize scripts.
- Tighten and align TypeScript, lint, and build/test configs into a coherent standard.
- Update lockfiles to match final dependency graph.

### Phase 3: Stabilization

- Resolve all regressions introduced by broad changes.
- Address failing tests, lint, type, and build issues until fully green.
- Fix backend fallout surfaced by route/service integration tests.

### Phase 4: Final Polish

- Remove remaining dead files and stale docs in touched areas.
- Normalize naming consistency and module ownership.
- Verify no redundant implementation pathways remain.

---

## Success Criteria

- Measurable reduction in redundant logic and duplicate files.
- Clearer module boundaries in both frontend and backend.
- Leaner dependency graph and cleaner script/config surface.
- No known regressions in core product flows after stabilization.

---

## Risk Controls

- Capture and keep a baseline of repo health before major edits.
- Maintain a rewrite ledger of removed/moved files and replacement locations.
- Enforce strict stabilization gate before completion.
- Fix cascading failures immediately in the stabilization phase.
- Do not defer known breakage to post-completion follow-up.

---

## Validation Gates (Definition Of Done)

All commands below must pass before completion:

### Frontend/Root

1. `npm run test -- --run`
2. `npm run lint`
3. `npm run typecheck`
4. `npm run build`

### Backend

5. `cd backend && npm test`

### Completion Conditions

6. No obvious dead code paths in touched areas.
7. Dependency cleanup completed and lockfiles consistent.
8. Refactor goals met without unresolved regressions.

---

## Constraints And Non-Goals

- This pass is aggressive but not a functional redesign project.
- Maintain compatibility with existing product behavior and integration expectations.
- Prefer deletion, consolidation, and simplification over introducing new frameworks/patterns unless strictly necessary.

---

## Handoff

This design is approved by user direction and ready for implementation planning via `writing-plans`, followed by execution with strict verification.
