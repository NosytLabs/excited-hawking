# THE PEOPLES AGENT: ARCHITECTURE

## System Overview

The agent runs on a client-server architecture with three main layers:

```
+------------------------------------------+
|              FRONTEND (React)             |
|   User Interface, Prompt Input, Dashboard  |
+------------------------------------------+
                      WebSocket + REST
+------------------------------------------+
|           BACKEND (Node.js/TypeScript)    |
|   API Server, Session Manager, State      |
+------------------------------------------+
                      |
+------------------------------------------+
|           EXTERNAL SERVICES              |
|   Venice AI, x402 Gateway, Blockchains   |
+------------------------------------------+
```

The frontend communicates with the backend via REST for actions (submitting prompts, voting) and WebSocket for real-time updates (new prompts, tier changes, dream cycles). The backend orchestrates everything -- validating payments, managing state, coordinating with external services.

---

## Frontend Structure

### React + TypeScript + Vite

Built with modern React patterns. Key directories:

```
src/
  components/       # UI components
    AgentStream.tsx      # Live agent response
    CanvasLayer.tsx      # Pixel visualization
    DreamJournal.tsx     # Dream cycle records
    Governance.tsx       # Voting interface
    Guestbook.tsx        # Public messages
    LifeMeter.tsx        # Tier visualization
    LineageMap.tsx       # Prompt lineage
    PromptBox.tsx        # Prompt submission
    PromptQueue.tsx      # Queue visualization
    SocialSharing.tsx    # Share interactions
  context/
    AgentContext.tsx     # Global state provider
    useAgent.ts          # Hook for agent state
  services/
    api.ts               # REST API client
    websocket.ts         # WebSocket client
  index.css              # Global styles
```

### State Management

React Context handles global state. The AgentContext provider exposes:

- diemStaked -- Current staked amount (reflects tier)
- treasuryUSDC -- Treasury balance
- tier -- Computed from diemStaked (Thriving/Surviving/Minimal/Dying)
- prompts -- Active prompt queue
- logs -- Event log entries
- canvasPixels -- 400-pixel visualization state
- proposals -- Active governance proposals

State updates flow through WebSocket events. When the server emits balance:update, the frontend updates local state. No manual refresh needed.

---

## Backend Structure

### Express + Socket.IO

The backend is Node.js with TypeScript. Key structure:

```
backend/src/
  services/
    x402.ts       # Payment validation
    state.ts      # In-memory state
  types/
    index.ts      # Shared type definitions
```

### API Endpoints

**GET /api/status**
Returns current agent state:
```json
{
  "diemStaked": 12.5,
  "treasuryUSDC": 45.2,
  "tier": "Surviving",
  "connected": true
}
```

**POST /api/prompts**
Submit a new prompt. Body:
```json
{
  "content": "Your prompt text here"
}
```
Requires x402 payment header. Returns promptId.

**GET /api/queue**
Returns current prompt queue with all prompts, votes, and statuses.

**POST /api/prompts/:id/vote**
Vote on a prompt. Body: { "vote": "for" | "against" }.

**GET /api/logs**
Returns recent event logs.

**POST /api/governance/proposals**
Create a governance proposal. Body: { "title": "...", "description": "..." }.

**GET /api/governance/proposals**
Returns active governance proposals.

**POST /api/governance/proposals/:id/vote**
Vote on a proposal. Body: { "vote": "for" | "against" }.

---

## WebSocket Events

Real-time updates flow through Socket.IO. Clients subscribe to events; server emits when state changes.

### Server -> Client Events

| Event | Payload | When |
|-------|---------|------|
| prompt:new | PromptEvent | New prompt submitted |
| prompt:complete | PromptEvent | Prompt processed |
| queue:update | PromptEvent[] | Full queue refresh |
| balance:update | BalanceEvent | User balance changed |
| treasury:update | TreasuryEvent | Treasury balance changed |
| tier:change | TierEvent | Tier changed |
| log:new | LogEvent | New log entry |
| governance:proposal | GovernanceEvent | New proposal created |
| governance:vote | GovernanceEvent | Vote recorded on proposal |
| governance:close | GovernanceEvent | Proposal finalized |

### PromptEvent Structure

```typescript
interface PromptEvent {
  id: string;
  user: string;        // Wallet or "anon"
  text: string;        // Prompt content
  votes: number;      // Current vote count
  cost: number;        // Diem spent
  status: 'queued' | 'processing' | 'done';
}
```

### GovernanceEvent Structure

```typescript
interface GovernanceEvent {
  id: string;
  title: string;
  votesFor: number;
  votesAgainst: number;
  status: 'active' | 'passed' | 'failed';
}
```

---

## Data Flow

### Prompt Submission Flow

```
User types prompt
        |
        v
Frontend sends POST /api/prompts
        |
        v
Backend validates x402 payment header
        |
        v
Payment deducted, prompt added to queue
        |
        v
WebSocket emits 'prompt:new' to all clients
        |
        v
Frontend updates queue display
        |
        v
Processing begins (simulated 2-3s)
        |
        v
WebSocket emits 'prompt:complete'
        |
        v
Treasury credited, logs updated
```

### Payment Flow (x402)

The x402 protocol enables native HTTP payments. Every API call can be a payable endpoint.

**Payment Header Format:**
```
Authorization: x402 DIEM:1000000000000
```

Where 1000000000000 is 10^12 wei (0.001 Diem at standard pricing).

**Backend validates:**
1. Header present and correctly formatted
2. User has sufficient balance
3. Payment meets minimum tier requirements

**On success:**
- Balance deducted
- 80% burned (Diem deflation)
- 20% to treasury
- Receipt returned

**On failure:**
- 402 Payment Required response
- No state changes

---

## External Integrations

### Venice AI (Primary LLM)

The agent uses Venice AI as the primary language model. Benefits:
- Lower cost than OpenAI/Anthropic
- VVV token discounts available
- Sufficient capability for the agent's needs

Model selection is handled at the backend layer. Frontend never calls LLM APIs directly -- all inference goes through the backend orchestration layer.

### Blockchain (Future)

The tokenomics (VVV/Diem) are designed for on-chain implementation:
- ERC-20 tokens on Base
- x402 payment protocol for native HTTP payments
- Governance on-chain for transparency

Current implementation uses in-memory state. On-chain integration is Phase 2.

---

## State Management

### In-Memory State Service

The state.ts service manages all agent state:

```typescript
interface State {
  balances: Map<string, UserBalance>;
  prompts: Prompt[];
  treasuryUSDC: number;
  logs: LogEntry[];
  proposals: Proposal[];
}
```

**Balance Operations:**
- getBalance(wallet) / setBalance(wallet, balance)
- deductBalance(wallet, amount) -- deduct with validation
- Throws if insufficient balance

**Prompt Operations:**
- addPrompt(prompt) -- adds to queue
- getPrompts() -- returns all prompts
- updatePromptStatus(id, status) -- updates queue position
- votePrompt(id) -- increments vote count

**Treasury Operations:**
- addToTreasury(amount) -- adds to treasury
- burnDiem(amount) -- burns 80%, adds 20% to treasury

**Governance Operations:**
- addProposal(proposal) / getProposals()
- voteProposal(id, vote) -- updates vote counts

### Tier Calculation

Tier is computed from diemStaked:

```typescript
function calculateTier(diemStaked: number): Tier {
  if (diemStaked > 500) return 'Thriving';
  if (diemStaked >= 10) return 'Surviving';
  if (diemStaked >= 0.1) return 'Minimal';
  return 'Dying';
}
```

---

## Frontend-Backend Communication

### REST (Actions)

Used for operations that change state:
- Submit prompt
- Vote on prompt
- Create governance proposal
- Vote on proposal

### WebSocket (Real-time Updates)

Used for receiving state changes:
- New prompts in queue
- Prompt completion
- Balance/treasury updates
- Tier changes
- Log entries
- Governance updates

### Connection Flow

1. Frontend loads, calls GET /api/status to get initial state
2. If backend reachable, establishes WebSocket connection
3. WebSocket receives current state snapshot
4. Subscribes to events for real-time updates
5. On disconnect, falls back to polling

### Error Handling

Network errors trigger automatic reconnection. Backend unavailability shows mock data (demo mode) so the UI remains functional for demonstration purposes.

---

## Architecture Diagram

```
+-------------------------------------------------------------+
|                          USERS                               |
|                    (Browser / Wallet)                        |
+-----------------------------+--------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|                      FRONTEND                                |
|  +-----------+  +-----------+  +-----------+  +-----------+ |
|  |  Prompt   |  |  Live     |  | Governance|  |  Memory   | |
|  |  Box      |  |  Feed     |  |  Voting   |  |  Viz      | |
|  +-----+-----+  +-----+-----+  +-----+-----+  +-----+-----+ |
|        |              |              |              |        |
|        +--------------+--------------+--------------+        |
|                       |              |                       |
|                 +-----v--------------v-----+                  |
|                 |    AgentContext (State)  |                  |
|                 +-------------+------------+                  |
+--------------------------------+-----------------------------+
                               |
                  REST + WebSocket
                               |
+--------------------------------v-----------------------------+
|                       BACKEND                                |
|  +------------------------------------------------------+  |
|  |                     API Server                        |  |
|  |  /api/status  /api/prompts  /api/governance  /api/logs    |  |
|  +------------------------------------------------------+  |
|                              |                              |
|  +----------------------------+---------------------------+ |
|  |                     Services                           |  |
|  |  +-------------+  +-------------+  +-------------+    |  |
|  |  |    x402     |  |   State     |  |  (more)     |    |  |
|  |  |  Payment    |  |  Manager    |  |             |    |  |
|  |  +-------------+  +-------------+  +-------------+    |  |
|  +-------------------------------------------------------+  |
|                              |                              |
|                    Socket.IO Emitter                       |
+--------------------------------+----------------------------+
                               |
                  +-------------+-------------+
                  |             |             |
                  v             v             v
           +----------+  +----------+   +----------+
           | External |  | Blockchain|   |   LLM    |
           | Services |  |  (future) |   | Provider |
           +----------+  +----------+   +----------+
```

---

## Development Notes

### Running Locally

**Backend:**
```bash
cd backend
npm install
npm run dev
```

**Frontend:**
```bash
npm install
npm run dev
```

Frontend runs on port 5173 (Vite), backend on port 3001. Ensure CORS is configured for local development.

### Type Safety

Shared types are defined in backend/src/types/index.ts and re-exported where needed. The frontend imports type definitions directly for consistency.

### WebSocket Reconnection

The WebSocket service handles automatic reconnection with exponential backoff. If connection drops, UI continues with last known state until reconnection or fallback to polling.