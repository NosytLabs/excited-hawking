# The Commons Agent

User-Owned Public AI - A decentralized AI agent social experiment.

## Quick Start

```bash
npm install
npm run dev
```

## Stack

- **Frontend:** React 19, TypeScript, Vite, TailwindCSS, Lucide icons
- **Backend:** Fastify, Socket.io, x402 payment protocol
- **State:** In-memory (demo mode)

## Features

- Real-time agent stream with Conway's Game of Life emergence visualization
- x402 payment integration for prompt submission
- Governance proposals with quadratic voting
- Public pixel canvas (1 prompt = 1 pixel)
- Tier system: Dying → Minimal → Surviving → Thriving

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Production build
- `npm run preview` - Preview production build

## Architecture

```
src/
├── App.tsx                 # Main layout
├── context/
│   ├── AgentContext.tsx     # Global state provider
│   └── useAgent.ts          # Context hook
├── components/
│   ├── AgentStream.tsx      # Live log + emergence visualization
│   ├── CanvasLayer.tsx      # Public pixel canvas
│   ├── Governance.tsx        # Proposal voting
│   ├── Guestbook.tsx         # Wall of contributions + leaderboard
│   ├── LifeMeter.tsx        # Tier/status display
│   ├── PromptBox.tsx         # Prompt submission
│   ├── PromptQueue.tsx       # Public prompt queue
│   └── SocialSharing.tsx     # Referral + share
└── services/
    ├── api.ts               # REST API client
    └── websocket.ts         # WebSocket client

backend/
├── src/
│   ├── routes/              # API endpoints
│   ├── services/            # Business logic (x402, state, governance)
│   └── lib/                 # Agent, LLM, memory systems
    └── index.ts             # Server entry
```