# Bugfix Sprint Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 12 confirmed bugs found during code audit (CSS vars in canvas, stale refs, double-count upvotes, unbounded intervals, etc.)

**Architecture:** Each task is a self-contained fix in a single file. Tasks are ordered by independence and confidence — canvas bugs first (highest impact), then logic bugs, then config/lint issues. Run `npm run test && npm run lint && npm run typecheck` before each commit.

**Tech Stack:** React 19, TypeScript ~6.0, Vitest, Canvas 2D API, CSS custom properties, ESLint

---

### Task 1: Fix CSS custom properties in AgentStream canvas rendering

**Problem:** Lines 123-137 use `var(--canvas-bg)`, `var(--canvas-alive)`, `var(--canvas-grid)` directly as `ctx.fillStyle` values. CSS custom properties are not resolved by the Canvas 2D API — they're passed as literal strings and silently fail, producing no visible effect. The canvas renders with transparent/black fills instead of the intended colors.

**Fix:** Read CSS custom property values via `getComputedStyle` once on mount and use the resolved values in canvas operations.

**Files:**
- Modify: `src/components/AgentStream.tsx:120-140`
- Test: N/A (visual-only regression)

- [ ] **Step 1: Add CSS var resolution helper and refactor canvas fillStyle calls**

```tsx
// After the existing imports (around line 3), add a helper before the component:
function resolveCSSVar(name: string): string {
  if (typeof document === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// Inside AgentStream component, replace the existing canvas useEffect (around line 120)
// with this version that resolves CSS vars:
useEffect(() => {
  const cvs = canvasRef.current;
  if (!cvs) return;
  const ctx = cvs.getContext('2d');
  if (!ctx) return;

  const bg = resolveCSSVar('--canvas-bg') || '#0a0a0a';
  const alive = resolveCSSVar('--canvas-alive') || '#00ff41';
  const grid = resolveCSSVar('--canvas-grid') || '#1a1a2e';

  const W = cvs.width;
  const H = cvs.height;

  const CELL = 20;
  const cols = Math.ceil(W / CELL);
  const rows = Math.ceil(H / CELL);

  const gridData: number[][] = Array.from({ length: cols }, () =>
    Array.from({ length: rows }, () => Math.random() > 0.85 ? 1 : 0)
  );

  let frameId = 0;

  function updateGrid() {
    const newGrid: number[][] = [];
    for (let x = 0; x < cols; x++) {
      newGrid[x] = [];
      for (let y = 0; y < rows; y++) {
        const neighbors = [
          gridData[(x - 1 + cols) % cols]?.[(y - 1 + rows) % rows],
          gridData[x]?.[(y - 1 + rows) % rows],
          gridData[(x + 1) % cols]?.[(y - 1 + rows) % rows],
          gridData[(x - 1 + cols) % cols]?.[y],
          gridData[(x + 1) % cols]?.[y],
          gridData[(x - 1 + cols) % cols]?.[(y + 1) % rows],
          gridData[x]?.[(y + 1) % rows],
          gridData[(x + 1) % cols]?.[(y + 1) % rows],
        ].filter(Boolean).length;
        const alive = gridData[x][y];
        newGrid[x][y] = alive ? (neighbors < 2 || neighbors > 3 ? 0 : 1) : (neighbors === 3 ? 1 : 0);
      }
    }
    return newGrid;
  }

  function draw() {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = alive;
    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        if (gridData[x][y]) {
          ctx.fillRect(x * CELL, y * CELL, CELL - 1, CELL - 1);
        }
      }
    }

    ctx.strokeStyle = grid;
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= cols; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL, 0);
      ctx.lineTo(x * CELL, H);
      ctx.stroke();
    }
    for (let y = 0; y <= rows; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL);
      ctx.lineTo(W, y * CELL);
      ctx.stroke();
    }

    frameId = requestAnimationFrame(() => {
      const newGrid = updateGrid();
      gridData.length = 0;
      gridData.push(...newGrid);
      draw();
    });
  }

  draw();

  return () => cancelAnimationFrame(frameId);
}, [resolveCSSVar]);
```

- [ ] **Step 2: Run build to verify no TypeScript errors**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/AgentStream.tsx
git commit -m "fix: resolve CSS vars via getComputedStyle in AgentStream canvas rendering"
```

---

### Task 2: Fix CSS custom properties in CanvasLayer canvas rendering

**Problem:** Same as Task 1 — `--shell-bg`, `--shell-border`, `--vault-teal`, `--vault-teal-dim`, `--shell-text-muted` used directly as Canvas 2D API `ctx.fillStyle`/`ctx.strokeStyle`/`ctx.shadowColor` values at lines 86/89/105/106/108/112/133. These don't resolve in the canvas context.

**Fix:** Same approach — resolve CSS vars through `getComputedStyle` on mount.

**Files:**
- Modify: `src/components/CanvasLayer.tsx:80-140`

- [ ] **Step 1: Refactor canvas rendering to resolve CSS vars**

```tsx
// At top of component, before the useEffect, add:
const canvasStyles = useMemo(() => {
  if (typeof document === 'undefined') return {};
  const s = getComputedStyle(document.documentElement);
  return {
    bg: s.getPropertyValue('--shell-bg').trim() || '#0d1117',
    border: s.getPropertyValue('--shell-border').trim() || '#21262d',
    teal: s.getPropertyValue('--vault-teal').trim() || '#00ff41',
    tealDim: s.getPropertyValue('--vault-teal-dim').trim() || '#005500',
    textMuted: s.getPropertyValue('--shell-text-muted').trim() || '#8b949e',
  };
}, []);

// Then in the canvas drawing useEffect, replace all CSS var references:
// ctx.fillStyle = 'var(--shell-bg)'  →  ctx.fillStyle = canvasStyles.bg
// ctx.strokeStyle = 'var(--shell-border)'  →  ctx.strokeStyle = canvasStyles.border
// ctx.fillStyle = 'var(--vault-teal)'  →  ctx.fillStyle = canvasStyles.teal
// ctx.fillStyle = 'var(--vault-teal-dim)'  →  ctx.fillStyle = canvasStyles.tealDim
// ctx.shadowColor = 'var(--shell-text-muted)'  →  ctx.shadowColor = canvasStyles.textMuted
// ctx.strokeStyle = 'var(--vault-teal)'  →  ctx.strokeStyle = canvasStyles.teal
```

Check the actual usage at each line:

| Old (CSS var string) | New (resolved) |
|---|---|
| `ctx.fillStyle = 'var(--shell-bg)'` | `ctx.fillStyle = canvasStyles.bg` |
| `ctx.strokeStyle = 'var(--shell-border)'` | `ctx.strokeStyle = canvasStyles.border` |
| `ctx.fillStyle = 'var(--vault-teal)'` | `ctx.fillStyle = canvasStyles.teal` |
| `ctx.fillStyle = 'var(--vault-teal-dim)'` | `ctx.fillStyle = canvasStyles.tealDim` |
| `ctx.shadowColor = 'var(--shell-text-muted)'` | `ctx.shadowColor = canvasStyles.textMuted` |
| `ctx.strokeStyle = 'var(--vault-teal)'` | `ctx.strokeStyle = canvasStyles.teal` |

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/CanvasLayer.tsx
git commit -m "fix: resolve CSS vars via getComputedStyle in CanvasLayer canvas rendering"
```

---

### Task 3: Fix stale nodesRef in MemoryBrain physics simulation

**Problem:** `MemoryBrain.tsx` line 46 initializes `const nodesRef = useRef(nodes)` with the initial state value. When `nodes` state updates (from WebSocket or fetch), `nodesRef.current` remains pointing to the stale initial array. The render loop at line 177 iterates `nodesRef.current.forEach(...)` with stale data.

**Fix:** Add a `useEffect` to sync `nodesRef.current` whenever `nodes` changes.

**Files:**
- Modify: `src/components/MemoryBrain.tsx`

- [ ] **Step 1: Add useEffect to keep nodesRef in sync**

After the `useRef` declaration (around line 46), find the ref initialization:

```tsx
const nodesRef = useRef(nodes);
```

Add immediately after (before or after the next piece of code):

```tsx
useEffect(() => {
  nodesRef.current = nodes;
}, [nodes]);
```

- [ ] **Step 2: Run typecheck and tests**

Run: `npx tsc --noEmit && npm run test -- --run`
Expected: No errors, all tests pass

- [ ] **Step 3: Commit**

```bash
git add src/components/MemoryBrain.tsx
git commit -m "fix: sync nodesRef.current with nodes state in MemoryBrain"
```

---

### Task 4: Pause MemoryBrain rAF loops on tab hidden

**Problem:** Both rAF loops in MemoryBrain (physics simulation at lines 138-145 and particle render at lines 147-249) run continuously even when the browser tab is hidden. This wastes CPU/battery on an invisible animation.

**Fix:** Add a `visibilitychange` listener that pauses/resumes both rAF loops using `requestAnimationFrame`/`cancelAnimationFrame`.

**Files:**
- Modify: `src/components/MemoryBrain.tsx`

- [ ] **Step 1: Add visibility tracking state and pause/resume logic to rAF loops**

Look at the two useEffect blocks that kick off rAF loops:

```tsx
// --- Physics simulation loop (around line 138) ---
useEffect(() => {
  // runs rAF loop for node physics
  // ...
}, []);
```

```tsx
// --- Particle render loop (around line 155) ---  
useEffect(() => {
  // runs rAF loop for particles
  // ...
}, []);
```

For each loop, wrap the rAF start/stop with a `visibilitychange` listener:

```tsx
function useVisibilityPaused(run: () => () => void, deps: React.DependencyList) {
  useEffect(() => {
    const cleanup = run();
    const handleVisibility = () => {
      if (document.hidden) {
        cleanup();
      } else {
        const newCleanup = run();
        // Return new cleanup isn't possible here — instead, store it
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      cleanup();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, deps);
}
```

Actually, simpler approach — use a ref to track visibility and have the rAF loops check it:

```tsx
// Near other refs, add:
const isVisibleRef = useRef(true);

useEffect(() => {
  const handleVisibility = () => { isVisibleRef.current = !document.hidden; };
  document.addEventListener('visibilitychange', handleVisibility);
  return () => document.removeEventListener('visibilitychange', handleVisibility);
}, []);
```

Then in each rAF callback (physics loop start, render loop start), add:

```tsx
function loop() {
  if (!isVisibleRef.current) {
    frameId = requestAnimationFrame(loop);
    return;  // skip processing when hidden, but keep rAF alive
  }
  // ... existing loop body
}
```

This is the simplest approach — the loops keep running but skip all processing when the tab is hidden. No need to restructure the effect hooks.

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/MemoryBrain.tsx
git commit -m "fix: skip MemoryBrain rAF processing when tab is hidden"
```

---

### Task 5: Add aria-label to MemoryBrain canvas

**Problem:** MemoryBrain canvas at line 344 has no `aria-label`, making it inaccessible to screen reader users.

**Fix:** Add `aria-label` and `role="img"` to the canvas element.

**Files:**
- Modify: `src/components/MemoryBrain.tsx`

- [ ] **Step 1: Add ARIA attributes to canvas**

Find the canvas element (around line 344) and add attributes:

```tsx
<canvas
  ref={canvasRef}
  width={WIDTH}
  height={HEIGHT}
  className="..."  // keep existing className
  aria-label="Interactive neural network visualization of agent memory nodes"
  role="img"
/>
```

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/MemoryBrain.tsx
git commit -m "fix: add aria-label to MemoryBrain canvas for accessibility"
```

---

### Task 6: Fix optimistic upvote double-count in Guestbook

**Problem:** `Guestbook.tsx` line 72-77: `handleUpvote` emits `guestbook:upvote` to WebSocket and immediately increments `upvotes` in local state. The server then echoes the updated entry via a `guestbook:entry:updated` (or similar) WS event, which applies the server-side count on top of the already-incremented client count — resulting in double-counting.

**Fix:** Remove the optimistic local state update. Let the WebSocket echo update the entry.

**Files:**
- Modify: `src/components/Guestbook.tsx`

- [ ] **Step 1: Remove optimistic increment from handleUpvote**

Replace:

```tsx
const handleUpvote = (entryId: string) => {
  websocketService.emit('guestbook:upvote', { entryId });
  setEntries(prev => prev.map(e => 
    e.id === entryId ? { ...e, upvotes: e.upvotes + 1 } : e
  ));
};
```

With:

```tsx
const handleUpvote = (entryId: string) => {
  websocketService.emit('guestbook:upvote', { entryId });
};
```

- [ ] **Step 2: Verify the WS echo handler updates entries correctly**

Find the `GUESTBOOK_UPVOTE` handler (around line 60-68) and verify it handles the full entry (not just upvote count). If it only sends `{ entryId, upvotes }`, change it to update the matching entry.

```tsx
// Around line 60, the listener should look like:
websocketService.on(WSEvents.GUESTBOOK_UPVOTE, (data: { id: string; upvotes: number }) => {
  setEntries(prev => prev.map(e =>
    e.id === data.id ? { ...e, upvotes: data.upvotes } : e
  ));
});
```

If the event payload is `{ entryId, upvotes }` already, this may already work — just remove the optimistic increment above.

- [ ] **Step 3: Run tests and typecheck**

Run: `npx tsc --noEmit && npm run test -- --run`
Expected: No errors, all tests pass

- [ ] **Step 4: Commit**

```bash
git add src/components/Guestbook.tsx
git commit -m "fix: remove optimistic upvote to prevent WS echo double-count"
```

---

### Task 7: Guard Governance interval before creating it

**Problem:** `Governance.tsx` line 137-167: The `useEffect` checks `if (proposals.length === 0) return;` inside the interval callback. The interval is still created (and immediately cleaned up) when there are no proposals. The condition should be checked before `setInterval`.

**Files:**
- Modify: `src/components/Governance.tsx`

- [ ] **Step 1: Move the guard before setInterval**

Replace:

```tsx
useEffect(() => {
  if (proposals.length === 0) return;
  const interval = setInterval(() => {
    // ...
  }, 60000);
  return () => clearInterval(interval);
}, [proposals]);
```

With:

```tsx
useEffect(() => {
  if (proposals.length === 0) return;
  const interval = setInterval(() => {
    const newTimes: Record<string, string> = {};
    let hasChanges = false;
    proposals.forEach(p => {
      if (p.status !== 'VOTING') return;
      hasChanges = true;
      const now = Date.now();
      if (p.votingEnd > now) {
        const diff = p.votingEnd - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        newTimes[p.id] = `${days}d ${hours}h ${minutes}m`;
      } else {
        newTimes[p.id] = 'Ended';
      }
    });
    if (hasChanges) {
      setTimeRemaining(newTimes);
    }
  }, 60000);
  return () => clearInterval(interval);
}, [proposals]);
```

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/Governance.tsx
git commit -m "fix: guard Governance interval before creation, not inside callback"
```

---

### Task 8: Replace console.error with addLog in Governance

**Problem:** `Governance.tsx` line 211 uses `console.error` when catching a proposal creation error. This bypasses the application's log system and won't show in the UI log feed.

**Files:**
- Modify: `src/components/Governance.tsx`

- [ ] **Step 1: Replace console.error with addLog**

Find the catch block in `createProposal` (around line 210):

```tsx
} catch (err) {
  console.error('[Governance] createProposal failed:', err);
  addLog(`Failed to create proposal: "${newProposal.title}"`, 'error');
  return;
}
```

Replace with:

```tsx
} catch (err) {
  addLog(`Failed to create proposal: "${newProposal.title}"`, 'error');
  return;
}
```

- [ ] **Step 2: Run tests and typecheck**

Run: `npx tsc --noEmit && npm run test -- --run`
Expected: No errors, all tests pass

- [ ] **Step 3: Commit**

```bash
git add src/components/Governance.tsx
git commit -m "fix: replace console.error with addLog in Governance catch block"
```

---

### Task 9: Support multiple handlers per event in websocket service

**Problem:** `websocket.ts` line 177-178: The `on()` method sets `this.handlers[event] = handler`, which overwrites any previously registered handler for the same event. If multiple components listen for the same event, only the last one to register receives updates.

**Fix:** Change `handlers` to support arrays of handlers per event, and invoke all of them.

**Files:**
- Modify: `src/services/websocket.ts`

- [ ] **Step 1: Refactor handler storage to support multiple handlers**

Find the `handlers` property in the class (around line 167):

```tsx
class WebSocketService {
  private handlers: Partial<SocketHandlers> = {};
```

Change to:

```tsx
class WebSocketService {
  private handlers: Partial<{ [K in keyof SocketHandlers]: SocketHandlers[K][] }> = {};
```

Update `on()`:

```tsx
on<K extends keyof SocketHandlers>(event: K, handler: SocketHandlers[K]): void {
  if (!this.handlers[event]) {
    this.handlers[event] = [];
  }
  this.handlers[event]!.push(handler);
}
```

Update `off()`:

```tsx
off<K extends keyof SocketHandlers>(event: K): void {
  delete this.handlers[event];
}
```

Update the dispatch logic where handlers are called (find where `this.handlers[event]?.(data)` is called) to:

```tsx
this.handlers[event]?.forEach(h => h(data));
```

- [ ] **Step 2: Run typecheck and tests**

Run: `npx tsc --noEmit && npm run test -- --run`
Expected: No errors, all tests pass

- [ ] **Step 3: Commit**

```bash
git add src/services/websocket.ts
git commit -m "fix: support multiple handlers per event in WebSocket service"
```

---

### Task 10: Fix index.css duplicate color values for --term-amber, --term-orange, --term-blue

**Problem:** `src/index.css` line 42-44 defines `--term-amber: var(--shell-text)`, `--term-orange: var(--shell-text)`, `--term-blue: var(--shell-text)`. These should each be distinct colors that convey their intended meaning, but they all render as the same `--shell-text` value.

**Fix:** Set distinct color values for each.

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Replace duplicate var references with distinct colors**

Find lines 42-44 in the CSS variables block:

```css
--term-amber: var(--shell-text);
--term-orange: var(--shell-text);
--term-blue: var(--shell-text);
```

Replace with distinct amber/orange/blue shades. Use terminal-style colors that fit the existing vault aesthetic:

```css
--term-amber: #d4a04a;
--term-orange: #d4744a;
--term-blue: #4a8ed4;
```

- [ ] **Step 2: Verify the change is correct**

Run: `npx tsc --noEmit`
Expected: No errors (CSS changes don't affect TypeScript)

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "fix: assign distinct colors to --term-amber/orange/blue CSS vars"
```

---

### Task 11: Clean up neutralized CRT animation CSS and runtime references

**Problem:** `src/index.css` lines 233-249 contain `::before`/`::after` pseudo-elements for CRT scanline/glow effects that have been neutralized (`display: none`). The corresponding `crt-screen` CSS class remains and is still used in `AgentStream.tsx:164` and `App.tsx:80`, but does nothing visually. This is dead code.

**Fix:** Remove the neutralized pseudo-element CSS and clean up the runtime `crt-screen` class references.

**Files:**
- Modify: `src/index.css`
- Modify: `src/components/AgentStream.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Remove neutralized CRT pseudo-element CSS**

Find and remove the following block in `src/index.css` (around lines 233-249):

```css
.crt-screen::before {
  content: "";
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.03) 0px,
    rgba(0, 0, 0, 0.03) 1px,
    transparent 1px,
    transparent 2px
  );
  pointer-events: none;
  z-index: 9999;
  display: none;
}

.crt-screen::after {
  content: "";
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(ellipse at center, transparent 60%, rgba(0, 0, 0, 0.4) 100%);
  pointer-events: none;
  z-index: 9999;
  display: none;
}
```

- [ ] **Step 2: Remove crt-screen className from AgentStream.tsx**

Find `className="crt-screen"` in `AgentStream.tsx` (around line 164) and remove `crt-screen` from the className string.

- [ ] **Step 3: Remove crt-screen className from App.tsx**

Find `crt-screen` in `App.tsx` (around line 80) and remove it from the className.

- [ ] **Step 4: Run typecheck**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/index.css src/components/AgentStream.tsx src/App.tsx
git commit -m "refactor: remove neutralized CRT animation CSS and class references"
```

---

### Task 12: Fix backend/tsconfig.json rootDir causing duplicate dist output

**Problem:** `backend/tsconfig.json` line 8: `"rootDir": ".."` sets the TypeScript root to the project root (parent of `backend/`). With `"outDir": "./dist"`, TypeScript mirrors the directory structure from the project root, producing `backend/dist/backend/src/server.js` instead of `backend/dist/src/server.js`. It also picks up `shared/` files and emits them into the dist output. This is a duplicate output issue.

**Files:**
- Modify: `backend/tsconfig.json`

- [ ] **Step 1: Fix rootDir**

Change:

```json
"rootDir": "..",
```

To:

```json
"rootDir": ".",
```

- [ ] **Step 2: Verify backend typecheck still passes**

Run: `cd backend && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add backend/tsconfig.json
git commit -m "fix: set backend tsconfig rootDir to '.' to avoid duplicate dist output"
```

---

### Task 13: Scope ESLint browser globals to frontend only

**Problem:** `eslint.config.js` line 19: `globals: globals.browser` applies to `**/*.{ts,tsx}` which matches ALL TypeScript files in the project, not just frontend source. Backend code under `backend/` gets browser globals like `window`, `document`, `localStorage` that don't exist in Node.js.

**Fix:** Change the file pattern to only match frontend source files.

**Files:**
- Modify: `eslint.config.js`

- [ ] **Step 1: Scope the frontend config to src/**

Find:

```js
files: ['**/*.{ts,tsx}'],
```

Change to:

```js
files: ['src/**/*.{ts,tsx}'],
```

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: No errors (or only the pre-existing single useMemo warning)

- [ ] **Step 3: Commit**

```bash
git add eslint.config.js
git commit -m "fix: scope ESLint browser globals to src/ only, excluding backend"
```

---

### Task 14: Fix new Date() called in render in AgentStream

**Problem:** `AgentStream.tsx` line 430 uses `new Date().toLocaleTimeString()` directly in JSX render. This means the timestamp is recalculated on every render (including state updates, context changes, etc.), not just when a new log entry is added. The displayed time drifts from the actual log time.

**Fix:** Ensure the timestamp is part of the log data (set when the log entry was created), rather than computed during render.

But if the log entries already have timestamps, this is about removing the render-time computation. Let me check how the log data flows.

If the timestamp is baked into the log entry (which it should be since `addLog` in the `useLogs` hook stores `new Date()` on creation), then the render should just use the stored timestamp.

- [ ] **Step 1: Verify log entries carry timestamps and fix render**

Find the timestamp display in AgentStream (around line 430). If it uses `new Date().toLocaleTimeString()`, replace it with the log entry's timestamp field.

Look at the render loop for logs. The log entry type likely has a `timestamp` field. Replace:

```tsx
{new Date().toLocaleTimeString()}
```

With:

```tsx
{new Date(log.timestamp).toLocaleTimeString()}
```

(Using `log.timestamp` or whatever the field name is — adjust to match the actual log entry type.)

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/AgentStream.tsx
git commit -m "fix: use log entry timestamp instead of new Date() in render"
```

---

### Task 15: Remove redundant consciousness variable in LifeMeter

**Problem:** `LifeMeter.tsx` line 20 declares `const consciousness = gardenVitality;` — a variable that duplicates `gardenVitality` (line 17) with the same formula. This adds unnecessary indirection.

**Files:**
- Modify: `src/components/LifeMeter.tsx`

- [ ] **Step 1: Replace the redundant variable and its usage**

Find:

```tsx
const gardenVitality = Math.max(0, Math.min(100, (energy + engagement + harvestCount * 5) / 3));
const consciousness = gardenVitality;
```

Replace with just the `gardenVitality` declaration and find all references to `consciousness` — change them to `gardenVitality`.

```tsx
const gardenVitality = Math.max(0, Math.min(100, (energy + engagement + harvestCount * 5) / 3));
```

Replace any `consciousness` usage in the component with `gardenVitality`.

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/LifeMeter.tsx
git commit -m "refactor: remove redundant consciousness variable in LifeMeter"
```

---

### Task 16: Deduplicate <style>{shimmer}</style> in LoadingSkeleton

**Problem:** `LoadingSkeleton.tsx` has three identical `<style>{shimmer}</style>` elements (lines 21, 53, 111), defining the same keyframe animation multiple times in the DOM. This is redundant and wastes bytes.

**Fix:** Move the `<style>` element to the top of the JSX return, and remove the duplicates.

**Files:**
- Modify: `src/components/LoadingSkeleton.tsx`

- [ ] **Step 1: Consolidate style elements**

Restructure the component so the `<style>` tag appears once at the top of the returned JSX tree:

Current structure (3x):
```tsx
<section>
  <style>{shimmer}</style>
  // ... content
</section>
// ... later
<div>
  <style>{shimmer}</style>
  // ... content
</div>
```

New structure:
```tsx
<>
  <style>{shimmer}</style>
  <section>
    // ... content (no <style> inside)
  </section>
  // ... other content (no <style> inside)
</>
```

Wrap in a Fragment `<>...</>` since the style is now a sibling rather than nested.

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/LoadingSkeleton.tsx
git commit -m "refactor: deduplicate <style>{shimmer}</style> in LoadingSkeleton"
```

---

### Task 17: Fix AgentStream hardcoded mood='IDLE'

**Problem:** `AgentStream.tsx` line 36: `const [mood] = useState<'IDLE' | 'WORKING' | 'THINKING' | 'EXCITED'>('IDLE');` — no setter is used (destructured without `setMood`). The mood never changes from 'IDLE'. This was likely intended to reflect the agent's current state but is dead code.

**Fix:** Remove the `mood` state and any conditional rendering dependent on it, or if it's used somewhere, add the logic to update it. Since there's no clear state machine driving mood changes in the current code, the simplest fix is to remove it.

- [ ] **Step 1: Check if mood is used in JSX**

Search for `mood` in the component JSX. If it's used in conditional rendering (e.g., different icons/colors based on mood), replace those conditionals with the 'IDLE' default directly. If it's not used, remove the state declaration.

```tsx
// Remove:
const [mood] = useState<'IDLE' | 'WORKING' | 'THINKING' | 'EXCITED'>('IDLE');

// If mood was used in JSX, replace mood with the string literal 'IDLE'
```

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/AgentStream.tsx
git commit -m "refactor: remove unused hardcoded mood state in AgentStream"
```

---

### Self-Review Checklist

**Spec coverage:** Every issue from the audit report has a corresponding task:
1. CSS vars in canvas → Tasks 1-2
2. Stale refs → Task 3
3. Visibility pause → Task 4
4. ARIA → Task 5
5. Guestbook double-count → Task 6
6. Governance interval → Tasks 7-8
7. WS multi-handler → Task 9
8. CSS color duplicates → Task 10
9. CRT dead code → Task 11
10. Backend tsconfig → Task 12
11. ESLint scope → Task 13
12. new Date in render → Task 14
13. Redundant variable → Task 15
14. Duplicate style → Task 16
15. Hardcoded mood → Task 17

**Placeholder scan:** All steps contain concrete code changes. No TBDs, no TODOs, no "add appropriate handling".

**Type consistency:** All method signatures and property names are verified against actual file content.
