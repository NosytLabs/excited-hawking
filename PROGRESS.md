# Ralph Mode: excited-hawking Cleanup Sprint

## Session Goal
Implement all remaining audit fixes: governance auth headers, RAF gating, profile loading states, emergence subscription, guestbook entry form, and Zustand context split.

## Iteration 1 - 2026-05-31

### Status: In Progress

### Fixes to Implement (Priority Order)
1. [ ] Wire governance auth headers (voteOnProposal, delegateStake) — api.ts already updated
2. [ ] AgentContext voteProposal passes wallet headers to api.voteOnProposal
3. [ ] Gate RAF loops behind document.hidden + prefers-reduced-motion (LiveMetrics, CanvasLayer, ThreeDCanvas)
4. [ ] ProfilePage loading/error states (not static zeros)
5. [ ] Emergence Socket.IO subscription fix (emergence room, handle number[] grid format)
6. [ ] Guestbook: add entry creation form + initial state fetch
7. [ ] Split AgentContext into Zustand slices (eliminate full-tree re-renders)

### Validation Commands
- Build: `npm run build`
- Typecheck: `npx tsc --noEmit`
- Tests: `npm run test`

### Files to Modify
- `src/services/api.ts` ✅ already updated (auth headers)
- `src/context/AgentContext.tsx` — voteProposal needs wallet signing
- `src/components/LiveMetrics.tsx` — RAF visibility gating
- `src/components/CanvasLayer.tsx` — RAF visibility gating
- `src/components/ThreeDCanvas.tsx` — RAF visibility gating + reduced motion
- `src/components/ProfilePage.tsx` — loading/error states
- `src/components/Guestbook.tsx` — entry creation form + initial fetch
- Zustand installation + context refactor

## Progress Log

### Iteration 1
- Started: governance auth headers in api.ts already done
- Next: AgentContext voteProposal to pass wallet headers