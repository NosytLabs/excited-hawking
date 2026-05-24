# The Commons Agent — Warm Shell Audit And Remediation Spec

**Date:** 2026-05-24
**Author:** OpenCode
**Status:** APPROVED

---

## Vision

The Commons Agent should feel like a civic workbench that people trust on first read. Keep the current operator-style structure, but strip out the harsh CRT theater. The shell should feel warm, calm, and readable. The core should still feel precise.

This pass is not a ground-up rebuild. It is a focused audit and remediation pass over the existing app and backend edges.

---

## Emotional Goals

1. **Trust** — The product reads like a credible public tool, not a costume terminal.
2. **Clarity** — A new user can find the main path fast: orient, prompt, read the agent response.
3. **Momentum** — Secondary modules stay available without fighting the main flow.

---

## Design Language

### Aesthetic Direction: "Warm Shell, Precise Core"

Keep the workbench layout, system cues, and monospace accents where they help. Replace neon-first styling with warm neutrals, softer contrast, and cleaner copy.

### Keep

- Clear workbench structure
- Lightweight status chips and telemetry cues
- Monospace labels for secondary metadata
- Real-time agent feel in the response stream

### Reduce

- CRT scanlines and screen-noise effects
- All-caps terminal voice as the default tone
- Harsh neon glows and high-noise borders
- UI that looks clickable but does nothing

### Tone Statement

Trusted civic tool, not hacker cosplay.

### Token Direction

Use one warm-neutral system across the shell.

```css
:root {
  --shell-bg: oklch(17% 0.02 55);
  --shell-surface: oklch(22% 0.02 55);
  --shell-surface-2: oklch(28% 0.025 55);
  --shell-border: oklch(40% 0.025 60);
  --shell-text: oklch(90% 0.015 85);
  --shell-text-muted: oklch(72% 0.02 75);
  --shell-accent: oklch(73% 0.09 80);
  --shell-accent-strong: oklch(68% 0.12 65);
  --shell-success: oklch(72% 0.11 145);
  --shell-danger: oklch(60% 0.12 28);
}
```

These values set the direction, not a locked palette. Implementation can tune them after the baseline audit.

### Typography

- **Display:** Keep a clean modern display face already in the app, unless audit work shows a stronger existing option.
- **Body:** `DM Sans` or the current closest equivalent for primary reading.
- **Mono:** Keep monospace for status, queue labels, and system metadata.

Typography should stop shouting. Use sentence case for most headings and actions. Keep uppercase for small status labels only.

---

## Layout And Structure

### Primary Hierarchy

1. Welcome and orientation
2. Prompt entry
3. Agent response stream
4. Support modules: queue, life meter, memory, social
5. Governance preview
6. Canvas and guestbook

### Desktop Layout

- Keep the current workbench split.
- Make the prompt and stream read as the main lane.
- Group support modules in a calmer side column.
- Move governance, canvas, and guestbook into clearly secondary sections.

### Mobile Layout

- Do not hide key utility panels behind desktop-only rules.
- Stack queue, life meter, memory, and social into the main flow under the stream.
- Keep the first-screen path short: welcome, prompt, stream.
- Push lower-value sections down, but keep them reachable.

### Header Behavior

- Keep a compact header.
- Show status with restraint.
- Remove or replace dead CTAs.
- If wallet connect is not real, do not ship a live-looking `CONNECT` button.

---

## Functional Scope

### In Scope

#### 1. Interaction Fixes

- Fix dead or unclear actions, including the current header `CONNECT` control.
- Fix weak affordances and inconsistent labels.
- Fix sections that look active but do not earn their visual weight.
- Fix mobile behavior where important modules disappear instead of reordering.

#### 2. UI System Cleanup

- Reconcile the split between terminal tokens and leftover garden tokens in `src/index.css`.
- Remove or reduce noisy effects that hurt readability.
- Normalize spacing, surfaces, borders, buttons, inputs, and section framing.
- Align copy tone with the approved direction.

#### 3. Trust And Quality Pass

- Audit the app shell, visible frontend flows, and backend integration points.
- Fix issues that surface through baseline verification, not guesswork.
- Keep an audit trail for bugs, regressions, cleanup candidates, and security findings.

### Out Of Scope Unless Audit Evidence Forces It

- New major product areas
- Wholesale backend architecture refactors
- Broad rewrites of unrelated worktree changes

---

## Target Components

### Frontend Priority

- `src/App.tsx`
- `src/index.css`
- `src/components/WelcomeAgent.tsx`
- `src/components/OnboardingBanner.tsx`
- `src/components/PromptBox.tsx`
- `src/components/AgentStream.tsx`
- `src/components/PromptQueue.tsx`
- `src/components/LifeMeter.tsx`
- `src/components/MemoryBrain.tsx`
- `src/components/SocialSharing.tsx`
- `src/components/Governance.tsx`
- `src/components/CanvasLayer.tsx`
- `src/components/Guestbook.tsx`

### Backend And Integration Priority

- Routes and services touched by the main app shell or surfaced by failing verification
- WebSocket/event plumbing that affects the live stream or governance data
- Validation, error handling, and dependency issues exposed by audit commands

---

## Execution Model

### Baseline First

Run a full baseline before substantial edits:

1. `npm run typecheck`
2. `npm run lint`
3. `npm run build`
4. `cd backend && npm test`
5. Browser validation of the current layout and visible flows
6. `npm audit` and `cd backend && npm audit`

### Remediation Slices

#### Slice 1: Shell And Tokens

- Rework global tokens and base surfaces
- Remove dead visual noise
- Tighten hierarchy in `App.tsx`

#### Slice 2: Interaction And Responsive Behavior

- Fix header actions
- Fix mobile ordering and visibility
- Fix component-level affordances and tone

#### Slice 3: Trust, Runtime, And Security

- Address build, test, integration, and security findings
- Keep fixes evidence-driven

### Parallelization Rule

Use parallel agents for independent audit and remediation streams. Keep overlapping file edits in one lane.

---

## Error Handling And Cleanup Rules

### Error Handling

- Follow root-cause debugging for failing checks.
- Fix the source of a failure before layering on more changes.
- Keep visible UI failures paired with command output or browser evidence.

### Cleanup

- Remove generated or runtime artifacts only when they are safe and clearly stale.
- Do not touch unrelated user changes.
- Do not delete backend or frontend code just to make the audit look clean.

---

## Verification

### Backpressure Gates

- `npm run typecheck` must pass
- `npm run lint` must pass or improve without new warnings
- `npm run build` must pass
- `cd backend && npm test` must pass
- Browser checks must confirm the approved layout and mobile stacking behavior
- Root and backend audit findings must be documented and addressed or triaged

### Browser Checks

- Main path reads clearly on desktop and mobile
- Prompt and stream stay primary
- Utility panels remain reachable on mobile
- No dead primary CTA remains in the shell
- Governance, canvas, and guestbook read as secondary sections

---

## Success Criteria

1. The app reads as one design system instead of a terminal/garden collision.
2. The first-screen path is obvious on desktop and mobile.
3. Key utility panels no longer disappear on mobile.
4. The shell contains no fake-live primary action.
5. The audit produces verified fixes for UI, runtime, and security issues in scope.
6. Verification commands and browser checks back every completion claim.
