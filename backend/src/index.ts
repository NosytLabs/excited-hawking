import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { buildApp } from './app.js';
import { initWebSocket, getIO } from './services/websocket.js';
import { getLogs, loadPersistedState, initPersistence, getPrompts } from './services/state.js';

const PORT = parseInt(process.env.PORT || '3001', 10);

const PROMPT_ID_REGEX = /^[a-zA-Z0-9_-]{8,64}$/;
const WALLET_REGEX = /^0x[a-fA-F0-9]{40}$/;

const MAX_CONNECTIONS_PER_WALLET = 5;
const connectionCounts = new Map<string, number>();

interface SubscriptionRequest {
  promptId?: string;
  wallet?: string;
}

function isValidPromptId(promptId: string): boolean {
  return PROMPT_ID_REGEX.test(promptId);
}

function isValidWalletAddress(wallet: string): boolean {
  return WALLET_REGEX.test(wallet);
}

function checkConnectionLimit(wallet: string): boolean {
  const count = connectionCounts.get(wallet) || 0;
  return count < MAX_CONNECTIONS_PER_WALLET;
}

function incrementConnection(wallet: string): void {
  connectionCounts.set(wallet, (connectionCounts.get(wallet) || 0) + 1);
}

function decrementConnection(wallet: string): void {
  const count = connectionCounts.get(wallet) || 0;
  if (count > 0) {
    connectionCounts.set(wallet, count - 1);
  }
}

function verifyPromptOwnership(promptId: string, wallet: string): boolean {
  const prompts = getPrompts();
  const prompt = prompts.find(p => p.id === promptId);
  if (!prompt) {
    return false;
  }
  return prompt.wallet.toLowerCase() === wallet.toLowerCase();
}

function logSuspiciousAttempt(socket: Socket, room: string, reason: string, wallet?: string): void {
  console.warn(`[WS][SECURITY] Suspicious subscription attempt - Socket: ${socket.id}, Room: ${room}, Reason: ${reason}, Wallet: ${wallet || 'unknown'}, IP: ${socket.handshake.address}`);
}

async function setupWebSocketHandlers(io: Server): Promise<void> {
  io.on('connection', (socket) => {
    const wallet = socket.handshake.auth.wallet as string | undefined;
    const validWallet = wallet && isValidWalletAddress(wallet) ? wallet : undefined;

    console.log(`[WS] Client connected: ${socket.id}, Wallet: ${validWallet || 'anonymous'}`);

    if (validWallet) {
      if (!checkConnectionLimit(validWallet)) {
        console.warn(`[WS][SECURITY] Connection limit exceeded for wallet ${validWallet}, socket ${socket.id}`);
        socket.emit('error', { code: 'CONNECTION_LIMIT_EXCEEDED', message: 'Too many connections from this wallet' });
        socket.disconnect(true);
        return;
      }
      incrementConnection(validWallet);
    }

    socket.on('prompt:subscribe', (data: SubscriptionRequest, callback: ((res: { success: boolean; error?: string }) => void) | undefined) => {
      const promptId = data?.promptId;
      const socketWallet = validWallet;

      if (!promptId) {
        logSuspiciousAttempt(socket, 'prompt:unknown', 'Missing promptId');
        const cb = typeof callback === 'function' ? callback : () => {};
        cb({ success: false, error: 'promptId required' });
        return;
      }

      if (!isValidPromptId(promptId)) {
        logSuspiciousAttempt(socket, `prompt:${promptId}`, 'Invalid promptId format');
        const cb = typeof callback === 'function' ? callback : () => {};
        cb({ success: false, error: 'Invalid promptId format' });
        return;
      }

      if (!socketWallet) {
        logSuspiciousAttempt(socket, `prompt:${promptId}`, 'No wallet authentication');
        const cb = typeof callback === 'function' ? callback : () => {};
        cb({ success: false, error: 'Wallet authentication required' });
        return;
      }

      if (!verifyPromptOwnership(promptId, socketWallet)) {
        logSuspiciousAttempt(socket, `prompt:${promptId}`, 'Ownership verification failed', socketWallet);
        const cb = typeof callback === 'function' ? callback : () => {};
        cb({ success: false, error: 'Access denied: you do not own this prompt' });
        return;
      }

      socket.join(`prompt:${promptId}`);
      console.log(`[WS] ${socket.id} (${socketWallet}) subscribed to prompt:${promptId}`);
      if (typeof callback === 'function') {
        callback({ success: true });
      }
    });

    socket.on('prompt:unsubscribe', (data: SubscriptionRequest, callback: ((res: { success: boolean }) => void) | undefined) => {
      const promptId = data?.promptId;
      if (promptId && isValidPromptId(promptId)) {
        socket.leave(`prompt:${promptId}`);
        console.log(`[WS] ${socket.id} unsubscribed from prompt:${promptId}`);
      }
      if (typeof callback === 'function') {
        callback({ success: true });
      }
    });

    socket.on('queue:subscribe', (_data: unknown, callback: ((res: { success: boolean }) => void) | undefined) => {
      socket.join('public:queue');
      console.log(`[WS] ${socket.id} subscribed to public:queue`);
      if (typeof callback === 'function') {
        callback({ success: true });
      }
    });

    socket.on('queue:unsubscribe', (_data: unknown, callback: ((res: { success: boolean }) => void) | undefined) => {
      socket.leave('public:queue');
      console.log(`[WS] ${socket.id} unsubscribed from public:queue`);
      if (typeof callback === 'function') {
        callback({ success: true });
      }
    });

    socket.on('governance:subscribe', (_data: unknown, callback: ((res: { success: boolean }) => void) | undefined) => {
      socket.join('public:governance');
      console.log(`[WS] ${socket.id} subscribed to public:governance`);
      if (typeof callback === 'function') {
        callback({ success: true });
      }
    });

    socket.on('governance:unsubscribe', (_data: unknown, callback: ((res: { success: boolean }) => void) | undefined) => {
      socket.leave('public:governance');
      console.log(`[WS] ${socket.id} unsubscribed from public:governance`);
      if (typeof callback === 'function') {
        callback({ success: true });
      }
    });

    socket.on('logs:subscribe', (_data: unknown, callback: ((res: { success: boolean }) => void) | undefined) => {
      socket.join('public:logs');
      console.log(`[WS] ${socket.id} subscribed to public:logs`);
      if (typeof callback === 'function') {
        callback({ success: true });
      }
    });

    socket.on('logs:unsubscribe', (_data: unknown, callback: ((res: { success: boolean }) => void) | undefined) => {
      socket.leave('public:logs');
      console.log(`[WS] ${socket.id} unsubscribed from public:logs`);
      if (typeof callback === 'function') {
        callback({ success: true });
      }
    });

    socket.on('emergence:subscribe', (_data: unknown, callback: ((res: { success: boolean }) => void) | undefined) => {
      socket.join('emergence');
      console.log(`[WS] ${socket.id} subscribed to emergence`);
      if (typeof callback === 'function') {
        callback({ success: true });
      }
    });

    socket.on('emergence:unsubscribe', (_data: unknown, callback: ((res: { success: boolean }) => void) | undefined) => {
      socket.leave('emergence');
      console.log(`[WS] ${socket.id} unsubscribed from emergence`);
      if (typeof callback === 'function') {
        callback({ success: true });
      }
    });

    socket.on('ping', (callback: (data: { timestamp: number }) => void) => {
      callback({ timestamp: Date.now() });
    });

    socket.on('disconnect', (reason) => {
      console.log(`[WS] Client disconnected: ${socket.id}, reason: ${reason}`);
      if (validWallet) {
        decrementConnection(validWallet);
      }
    });

    socket.on('error', (error) => {
      console.error(`[WS] Socket error for ${socket.id}:`, error);
      if (validWallet) {
        decrementConnection(validWallet);
      }
    });
  });
}

async function startServer(): Promise<void> {
  const app = await buildApp();

  const httpServer = createServer(app.server);

  initWebSocket(httpServer);
  await setupWebSocketHandlers(getIO());

  await loadPersistedState();
  initPersistence();

  app.get('/api/logs/stream', async (request, reply) => {
    const _wallet = request.headers['x-wallet-address'] as string || 'anonymous';
    void _wallet;

    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    });

    const sendLog = (_message: string, _level: string, _logWallet?: string): void => {
      // SSE sends periodic batched logs, individual log events handled via socket.io
    };

    // Store reference for potential future per-socket log streaming
    void sendLog;

    const checkInterval = setInterval(async () => {
      try {
        const logs = getLogs().slice(0, 50);
        const data = JSON.stringify({ logs, timestamp: Date.now() });
        reply.raw.write(`event: logs\ndata: ${data}\n\n`);
      } catch {
        clearInterval(checkInterval);
      }
    }, 5000);

    const heartbeatInterval = setInterval(() => {
      reply.raw.write(`: heartbeat\n\n`);
    }, 30000);

    request.raw.on('close', () => {
      clearInterval(checkInterval);
      clearInterval(heartbeatInterval);
    });
  });

  httpServer.on('error', (error: Error) => {
    console.error('[SERVER] HTTP Server error:', error);
  });

  try {
    await app.listen({ port: PORT, host: '0.0.0.0' });

    console.log('\n=================================================');
    console.log('  THE PEOPLES AGENT IS ALIVE');
    console.log('=================================================');
    console.log(`  Server running on port ${PORT}`);
    console.log(`  Health check: http://localhost:${PORT}/health`);
    console.log(`  WebSocket ready for connections`);
    console.log('  State persistence: enabled');
    console.log('=================================================\n');

    const shutdown = async (signal: string): Promise<void> => {
      console.log(`\n[SERVER] Received ${signal}, shutting down gracefully...`);

      getIO().close();
      httpServer.close();
      await app.close();

      console.log('[SERVER] Shutdown complete');
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    console.error('[SERVER] Failed to start:', error);
    process.exit(1);
  }
}

startServer();