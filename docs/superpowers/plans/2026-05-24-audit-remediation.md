# Codebase Audit Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix critical bugs, improve performance, and refactor architecture based on the 7-phase codebase audit.

**Architecture:** We will systematically apply targeted fixes across the codebase. We'll start with critical bugs (timers, missing event handlers, validation), then move to architectural improvements (extracting WebSocket logic, code splitting), and finish with performance enhancements (memoization, virtualization).

**Tech Stack:** React, TypeScript, Fastify, Socket.io, TailwindCSS

---

### Task 1: Fix Critical Performance Issue in Governance Timer

**Files:**
- Modify: `src/components/Governance.tsx`

- [ ] **Step 1: Replace interval with throttled update or remove if unused**

The current implementation has an interval that runs every second, forcing a re-render of the entire `Governance` component. We will replace it with a more efficient approach or fix the dependencies.

```tsx
// Inside src/components/Governance.tsx
// Find the useEffect with setInterval at line 107
// Replace it with:
useEffect(() => {
  if (proposals.length === 0) return;
  
  // Only update time remaining if there are active proposals
  const interval = setInterval(() => {
    const newTimes: Record<string, string> = {};
    let hasChanges = false;
    
    proposals.forEach(p => {
      if (p.status !== 'VOTING') return;
      const now = Date.now();
      if (p.votingEnd > now) {
        hasChanges = true;
        const diff = p.votingEnd - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        newTimes[p.id] = `${days}d ${hours}h ${minutes}m`;
      } else {
        newTimes[p.id] = 'Ended';
      }
    });
    
    // Only trigger re-render if there are active voting proposals
    if (hasChanges) {
      setTimeRemaining(newTimes);
    }
  }, 60000); // Run every minute instead of every second
  
  // Initial calculation
  const newTimes: Record<string, string> = {};
  proposals.forEach(p => {
    if (p.status !== 'VOTING') return;
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
  setTimeRemaining(newTimes);
  
  return () => clearInterval(interval);
}, [proposals]);
```

- [ ] **Step 2: Fix Governance double scrollbar**

```tsx
// Find line 344 in src/components/Governance.tsx
// Change:
// <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin">
// To:
<div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1 scrollbar-thin">
```

- [ ] **Step 3: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/Governance.tsx
git commit -m "perf: optimize Governance timer and fix scrollbar"
```

### Task 2: Fix WelcomeAgent Buttons and Add Accessibility

**Files:**
- Modify: `src/components/WelcomeAgent.tsx`
- Modify: `src/components/Governance.tsx`
- Modify: `src/components/AgentStream.tsx`

- [ ] **Step 1: Add onClick handlers to WelcomeAgent buttons**

```tsx
// Inside src/components/WelcomeAgent.tsx
// Find the buttons around line 68-79 and update them:
<div className="flex gap-4 mb-12">
  <button 
    onClick={() => document.querySelector<HTMLDivElement>('.prompt-box')?.scrollIntoView({ behavior: 'smooth' })}
    className="px-6 py-3 bg-term-green text-term-void font-bold uppercase tracking-wider hover:bg-white transition-colors"
  >
    Start Session
  </button>
  <button 
    onClick={() => window.open('https://github.com/obra/excited-hawking', '_blank')}
    className="px-6 py-3 border border-term-green text-term-green font-bold uppercase tracking-wider hover:bg-term-green/10 transition-colors"
  >
    View Docs
  </button>
</div>
```

- [ ] **Step 2: Add aria-labels to Governance icon buttons**

```tsx
// In src/components/Governance.tsx
// Find the buttons and add aria-labels:
<button
  aria-label="Manage Delegation"
  onClick={() => setShowDelegation(!showDelegation)}
  // existing props
>
// ...
<button
  aria-label="Create New Proposal"
  onClick={() => setShowCreateForm(true)}
  // existing props
>
```

- [ ] **Step 3: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/WelcomeAgent.tsx src/components/Governance.tsx
git commit -m "fix: add cta handlers and accessibility labels"
```

### Task 3: Extract WebSocket Logic and Standardize Events

**Files:**
- Create: `shared/events.ts`
- Create: `src/hooks/useWebSocket.ts`
- Modify: `src/context/AgentContext.tsx`
- Modify: `backend/src/routes/prompt.ts`
- Modify: `backend/src/services/websocket.ts`

- [ ] **Step 1: Create shared events constants**

```typescript
// Create shared/events.ts
export const WS_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  PROMPT_NEW: 'prompt:new',
  PROMPT_COMPLETE: 'prompt:complete',
  QUEUE_UPDATE: 'queue:update',
  LOG_NEW: 'log:new',
  EMERGENCE_UPDATE: 'emergence:update',
  MEMORIES_UPDATE: 'memories:update',
  DREAM_START: 'dream:start',
  DREAM_COMPLETE: 'dream:complete'
} as const;
```

- [ ] **Step 2: Create useWebSocket hook**

```typescript
// Create src/hooks/useWebSocket.ts
import { useEffect, useCallback } from 'react';
import { websocketService } from '../services/websocket';
import { WS_EVENTS } from '../../shared/events';

export function useWebSocket() {
  const connect = useCallback(() => {
    websocketService.connect();
  }, []);

  const disconnect = useCallback(() => {
    websocketService.disconnect();
  }, []);

  const subscribe = useCallback(<T>(event: string, callback: (data: T) => void) => {
    websocketService.on(event, callback);
    return () => websocketService.off(event, callback);
  }, []);

  return {
    connect,
    disconnect,
    subscribe,
    service: websocketService
  };
}
```

- [ ] **Step 3: Refactor AgentContext.tsx to use constants and hook**

```tsx
// In src/context/AgentContext.tsx
import { WS_EVENTS } from '../../shared/events';
import { useWebSocket } from '../hooks/useWebSocket';

// Inside AgentProvider:
const { connect, subscribe } = useWebSocket();

// Update useEffect that sets up listeners:
useEffect(() => {
  if (!backendAvailable) return;
  
  const unsubQueue = subscribe(WS_EVENTS.QUEUE_UPDATE, (data: PromptItem[]) => {
    setPrompts(data);
  });
  
  const unsubLog = subscribe(WS_EVENTS.LOG_NEW, (data: LogItem) => {
    setLogs(prev => [...prev, data]);
  });
  
  // Update other listeners similarly...
  
  return () => {
    unsubQueue();
    unsubLog();
    // ...
  };
}, [backendAvailable, subscribe]);
```

- [ ] **Step 4: Update backend files to use constants**

```typescript
// In backend/src/routes/prompt.ts and backend/src/services/websocket.ts
// Replace string literals with WS_EVENTS constants
import { WS_EVENTS } from '../../../shared/events.js';
```

- [ ] **Step 5: Run tests and typecheck**

Run: `npx tsc --noEmit && cd backend && npx tsc --noEmit && npm test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add shared/ src/hooks/ src/context/AgentContext.tsx backend/src/routes/prompt.ts backend/src/services/websocket.ts
git commit -m "refactor: extract websocket logic and standardize events"
```

### Task 4: Fix Input Validation in Backend Agent Tool

**Files:**
- Modify: `backend/src/lib/agent.ts`

- [ ] **Step 1: Add validation to get_balance tool**

```typescript
// In backend/src/lib/agent.ts
// Find the get_balance tool handler around line 269
case 'get_balance': {
  let { address } = input as { address: string };
  
  if (!address || typeof address !== 'string') {
    return { success: false, error: 'Address must be a string' };
  }
  
  address = address.trim().toLowerCase();
  
  if (!/^0x[a-f0-9]{40}$/i.test(address)) {
    return { success: false, error: 'Invalid Ethereum address format' };
  }
  
  const balance = await getBalance(address);
  return {
    success: true,
    data: { address, balance }
  };
}
```

- [ ] **Step 2: Run backend tests**

Run: `cd backend && npm test`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add backend/src/lib/agent.ts
git commit -m "fix(security): add validation to get_balance tool"
```

### Task 5: Implement Code Splitting and Memoization

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/AgentStream.tsx`
- Modify: `src/components/Governance.tsx`

- [ ] **Step 1: Implement code splitting in App.tsx**

```tsx
// In src/App.tsx
import React, { Suspense, lazy } from 'react';
import { AgentProvider } from './context/AgentContext';
import { WelcomeAgent } from './components/WelcomeAgent';
import { OnboardingBanner } from './components/OnboardingBanner';
import { PromptBox } from './components/PromptBox';
import { PromptQueue } from './components/PromptQueue';
import { LifeMeter } from './components/LifeMeter';
import { SocialSharing } from './components/SocialSharing';

// Lazy load heavy components that aren't above the fold
const AgentStream = lazy(() => import('./components/AgentStream').then(m => ({ default: m.AgentStream })));
const Governance = lazy(() => import('./components/Governance').then(m => ({ default: m.Governance })));
const CanvasLayer = lazy(() => import('./components/CanvasLayer').then(m => ({ default: m.CanvasLayer })));
const Guestbook = lazy(() => import('./components/Guestbook').then(m => ({ default: m.Guestbook })));

// Update rendering to use Suspense
// Wrap the lazy components in <Suspense fallback={<div className="p-8 text-center text-term-green">Loading...</div>}>
```

- [ ] **Step 2: Memoize Governance computed values**

```tsx
// In src/components/Governance.tsx
import { useMemo } from 'react';

// Wrap filteredProposals in useMemo
const filteredProposals = useMemo(() => {
  return proposals.filter(p => {
    if (filter === 'ACTIVE') return p.status === 'VOTING';
    if (filter === 'PASSED') return p.status === 'PASSED' || p.status === 'EXECUTED';
    if (filter === 'REJECTED') return p.status === 'REJECTED' || p.status === 'FAILED';
    if (filter === 'MY_PROPOSALS') return p.proposer === walletAddress;
    return true;
  });
}, [proposals, filter, walletAddress]);

// Wrap quadraticWeight in useMemo
const quadraticWeight = useMemo(() => Math.sqrt(diemStaked), [diemStaked]);
```

- [ ] **Step 3: Wrap AgentStream in React.memo**

```tsx
// In src/components/AgentStream.tsx
// At the bottom of the file:
export const AgentStream = React.memo(AgentStreamComponent);
// Rename export const AgentStream = ... to const AgentStreamComponent = ...
```

- [ ] **Step 4: Run build**

Run: `npm run build`
Expected: SUCCESS with smaller initial bundle size

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/components/AgentStream.tsx src/components/Governance.tsx
git commit -m "perf: add code splitting and memoization"
```
