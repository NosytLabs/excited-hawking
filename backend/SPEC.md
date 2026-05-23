# Backend API Specification - The Peoples Agent

## Overview

This document defines the backend API requirements for "The Peoples Agent" backend server with x402 payment integration.

## Technical Stack

- **Runtime:** Node.js 20+
- **Framework:** Fastify (performance + x402 support)
- **Language:** TypeScript
- **WebSocket:** Socket.io for real-time agent stream updates
- **Blockchain:** Base chain via x402 protocol

## Core Requirements

### 1. x402 Payment Integration

- VVV contract: `0xacfE6019Ed1A7Dc6f7B508C02d1b04ec88cC21bf` on Base
- DIEM tokenomics: 80% burn, 20% treasury
- Accept x402 payment headers via POST /api/prompt
- Validate x402 payment preconditions
- Check user Diem balance on Base chain
- Return 402 Payment Required if insufficient funds

### 2. API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/status | GET | Agent status, tier, balance |
| /api/prompt | POST | Submit prompt with x402 payment |
| /api/queue | GET | Current prompt queue |
| /api/vote | POST | Vote on prompt |
| /api/logs | GET | Real-time logs via SSE |
| /api/price | GET | Solana/USDC price check |

### 3. State Management (In-Memory)

- User balances (Map<wallet, balance>)
- Prompt queue (Array<Prompt>)
- Treasury (number)
- Agent logs (Array<LogEntry>)

### 4. Real-Time Updates

- WebSocket server for agent stream updates
- SSE endpoint for logs
- Event-driven architecture for state changes

## Data Models

### User Balance
```typescript
interface UserBalance {
  wallet: string;
  diemBalance: bigint;
  vvvStaked: bigint;
  tier: 'free' | 'light' | 'standard' | 'pro' | 'enterprise';
}
```

### Prompt
```typescript
interface Prompt {
  id: string;
  wallet: string;
  content: string;
  tier: string;
  diemAmount: bigint;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  votes: number;
  createdAt: number;
}
```

### Log Entry
```typescript
interface LogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  wallet?: string;
  metadata?: Record<string, unknown>;
}
```

## Payment Tiers

| Tier | Cost | VVV Requirement |
|------|------|-----------------|
| Free | $0.00 | None |
| Light | $0.001/prompt | None |
| Standard | $0.01/prompt | 100 VVV |
| Pro | $0.05/prompt | 1,000 VVV |
| Enterprise | $0.50/prompt | 10,000 VVV |

## Acceptance Criteria

1. Server starts and responds to health checks
2. x402 payment headers are validated correctly
3. 402 response returned when balance insufficient
4. WebSocket connections established for real-time updates
5. All API endpoints respond with correct schema
6. In-memory state is maintained correctly
7. TypeScript compiles without errors
8. Unit tests cover core functionality