import { Server } from 'socket.io';
import type { Server as HttpServer } from 'http';

const WSEvents = {
  PROMPT_NEW: 'prompt:new',
  PROMPT_COMPLETE: 'prompt:complete',
  QUEUE_UPDATE: 'queue:update',
  BALANCE_UPDATE: 'balance:update',
  TREASURY_UPDATE: 'treasury:update',
  LOG_NEW: 'log:new',
  TIER_CHANGE: 'tier:change',
  EMERGENCE_UPDATE: 'emergence:update',
  EMERGENCE_CELL_TOGGLE: 'emergence:cell-toggle',
  GOVERNANCE_PROPOSAL_NEW: 'governance:proposal:new',
  GOVERNANCE_PROPOSAL_UPDATE: 'governance:proposal:update',
  GOVERNANCE_UPDATE: 'governance:update',
  MEMORY_NEW: 'memory:new',
  CREATURE_UPDATE: 'creature:update',
} as const;

let io: Server | null = null;

function getAllowedOrigins(): string[] {
  const envOrigins = process.env.ALLOWED_ORIGINS;
  if (envOrigins) {
    return envOrigins.split(',').map(s => s.trim());
  }
  if (process.env.NODE_ENV === 'production') {
    return [];
  }
  return ['localhost:3000', 'localhost:4173', 'localhost:5173', 'localhost:5174', '127.0.0.1:3000', '127.0.0.1:4173', '127.0.0.1:5173', '127.0.0.1:5174', 'http://localhost:3000', 'http://localhost:4173', 'http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:3000', 'http://127.0.0.1:4173', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'];
}

function corsValidator(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void): void {
  const allowedOrigins = getAllowedOrigins();

  if (process.env.NODE_ENV === 'production') {
    if (!origin) {
      console.warn('[WS] Connection rejected: missing origin in production');
      callback(null, false);
      return;
    }
    if (!allowedOrigins.includes(origin)) {
      console.warn(`[WS] Connection rejected: unauthorized origin "${origin}"`);
      callback(null, false);
      return;
    }
  } else {
    if (origin && !allowedOrigins.includes(origin)) {
      console.warn(`[WS] Connection rejected: unauthorized origin "${origin}"`);
      callback(null, false);
      return;
    }
  }

  callback(null, true);
}

export function initWebSocket(httpServer: HttpServer): Server {
  const allowedOrigins = getAllowedOrigins();

  io = new Server(httpServer, {
    cors: {
      origin: corsValidator,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  console.log(`[WS] CORS enabled with allowed origins: ${allowedOrigins.length > 0 ? allowedOrigins.join(', ') : '(none - production mode requires explicit origins)'}`);

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error('WebSocket not initialized');
  return io;
}

export function emitPromptNew(promptId: string, content: string, wallet: string): void {
  io?.emit(WSEvents.PROMPT_NEW, { id: promptId, content, wallet, timestamp: Date.now() });
}

export function emitPromptComplete(promptId: string): void {
  io?.emit(WSEvents.PROMPT_COMPLETE, { id: promptId, timestamp: Date.now() });
}

export function emitQueueUpdate(prompts: unknown[]): void {
  io?.emit(WSEvents.QUEUE_UPDATE, { prompts, timestamp: Date.now() });
}

export function emitBalanceUpdate(wallet: string, balance: string): void {
  io?.emit(WSEvents.BALANCE_UPDATE, { wallet, balance, timestamp: Date.now() });
}

export function emitTreasuryUpdate(amount: number): void {
  io?.emit(WSEvents.TREASURY_UPDATE, { amount, timestamp: Date.now() });
}

export function emitLogNew(message: string, level: string): void {
  io?.emit(WSEvents.LOG_NEW, { message, level, timestamp: Date.now() });
}

export function emitTierChange(tier: string): void {
  io?.emit(WSEvents.TIER_CHANGE, { tier, timestamp: Date.now() });
}

export function emitEmergenceUpdate(data: { grid: boolean[][]; generation: number; patterns: string[] }): void {
  io?.to('emergence').emit(WSEvents.EMERGENCE_UPDATE, { ...data, timestamp: Date.now() });
}

export function emitEmergenceCellToggle(data: { x: number; y: number; alive: boolean }): void {
  io?.to('emergence').emit(WSEvents.EMERGENCE_CELL_TOGGLE, data);
}

export function emitProposalNew(proposal: unknown): void {
  io?.emit(WSEvents.GOVERNANCE_PROPOSAL_NEW, { proposal, timestamp: Date.now() });
}

export function emitProposalUpdate(proposal: unknown): void {
  io?.emit(WSEvents.GOVERNANCE_PROPOSAL_UPDATE, { proposal, timestamp: Date.now() });
}

export function emitGovernanceUpdate(data: Record<string, unknown>): void {
  io?.emit(WSEvents.GOVERNANCE_UPDATE, { ...data, timestamp: Date.now() });
}

export function emitMemoryNew(data: { id: string; type: string; content: string; timestamp: number; connections: string[] }): void {
  io?.emit(WSEvents.MEMORY_NEW, { ...data, timestamp: Date.now() });
}

export function emitCreatureUpdate(data: { stats: { vitality: number; momentum: number; coherence: number }; mood: string; totalPromptsProcessed: number }): void {
  io?.emit(WSEvents.CREATURE_UPDATE, { ...data, timestamp: Date.now() });
}