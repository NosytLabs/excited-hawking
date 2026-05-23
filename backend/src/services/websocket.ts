import { Server } from 'socket.io';
import type { Server as HttpServer } from 'http';

let io: Server | null = null;

function getAllowedOrigins(): string[] {
  const envOrigins = process.env.ALLOWED_ORIGINS;
  if (envOrigins) {
    return envOrigins.split(',').map(s => s.trim());
  }
  if (process.env.NODE_ENV === 'production') {
    return [];
  }
  return ['localhost:3000', 'localhost:5173'];
}

function corsValidator(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void): void {
  const allowedOrigins = getAllowedOrigins();

  if (process.env.NODE_ENV === 'production') {
    if (!origin) {
      console.warn('[WS] Connection rejected: missing origin in production');
      callback(new Error('Origin required'));
      return;
    }
    if (!allowedOrigins.includes(origin)) {
      console.warn(`[WS] Connection rejected: unauthorized origin "${origin}"`);
      callback(new Error('Origin not allowed'));
      return;
    }
  } else {
    if (origin && !allowedOrigins.includes(origin)) {
      console.warn(`[WS] Connection rejected: unauthorized origin "${origin}"`);
      callback(new Error('Origin not allowed'));
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
  io?.emit('prompt:new', { id: promptId, content, wallet, timestamp: Date.now() });
}

export function emitPromptComplete(promptId: string): void {
  io?.emit('prompt:complete', { id: promptId, timestamp: Date.now() });
}

export function emitQueueUpdate(prompts: unknown[]): void {
  io?.emit('queue:update', { prompts, timestamp: Date.now() });
}

export function emitBalanceUpdate(wallet: string, balance: string): void {
  io?.emit('balance:update', { wallet, balance, timestamp: Date.now() });
}

export function emitTreasuryUpdate(amount: number): void {
  io?.emit('treasury:update', { amount, timestamp: Date.now() });
}

export function emitLogNew(message: string, level: string): void {
  io?.emit('log:new', { message, level, timestamp: Date.now() });
}

export function emitTierChange(tier: string): void {
  io?.emit('tier:change', { tier, timestamp: Date.now() });
}

export function emitEmergenceUpdate(data: { grid: boolean[][]; generation: number; patterns: string[] }): void {
  io?.to('emergence').emit('emergence:update', { ...data, timestamp: Date.now() });
}

export function emitProposalNew(proposal: unknown): void {
  io?.emit('governance:proposal:new', { proposal, timestamp: Date.now() });
}

export function emitProposalUpdate(proposal: unknown): void {
  io?.emit('governance:proposal:update', { proposal, timestamp: Date.now() });
}

export function emitGovernanceUpdate(data: Record<string, unknown>): void {
  io?.emit('governance:update', { ...data, timestamp: Date.now() });
}