import { io, Socket } from 'socket.io-client';

export type SocketEvent =
  | 'connect'
  | 'disconnect'
  | 'connect_error'
  | 'prompt:new'
  | 'prompt:complete'
  | 'queue:update'
  | 'balance:update'
  | 'treasury:update'
  | 'tier:change'
  | 'log:new'
  | 'governance:proposal'
  | 'governance:vote'
  | 'governance:close'
  | 'emergence:update';

export interface PromptEvent {
  id: string;
  user: string;
  text: string;
  votes: number;
  cost: number;
  status: 'queued' | 'processing' | 'done';
}

export interface BalanceEvent {
  diemStaked: number;
}

export interface TreasuryEvent {
  treasuryUSDC: number;
}

export interface TierEvent {
  tier: 'Thriving' | 'Surviving' | 'Minimal' | 'Dying';
}

export interface LogEvent {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'action' | 'success' | 'warning' | 'error';
}

export interface GovernanceEvent {
  id: string;
  title: string;
  votesFor: number;
  votesAgainst: number;
  status: 'active' | 'passed' | 'failed';
}

export interface EmergenceEvent {
  grid: boolean[][];
  generation: number;
  patterns: string[];
}

type EventHandler<T = unknown> = (data: T) => void;

interface SocketHandlers {
  'connect': EventHandler<void>;
  'disconnect': EventHandler<void>;
  'connect_error': EventHandler<void>;
  'prompt:new': EventHandler<PromptEvent>;
  'prompt:complete': EventHandler<PromptEvent>;
  'queue:update': EventHandler<PromptEvent[]>;
  'balance:update': EventHandler<BalanceEvent>;
  'treasury:update': EventHandler<TreasuryEvent>;
  'tier:change': EventHandler<TierEvent>;
  'log:new': EventHandler<LogEvent>;
  'governance:proposal': EventHandler<GovernanceEvent>;
  'governance:vote': EventHandler<GovernanceEvent>;
  'governance:close': EventHandler<GovernanceEvent>;
  'emergence:update': EventHandler<EmergenceEvent>;
}

const WS_URL = 'ws://localhost:3001';
const RECONNECT_DELAY = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;

class WebSocketService {
  private socket: Socket | null = null;
  private handlers: Partial<SocketHandlers> = {};
  private isConnected = false;

  connect(): void {
    if (this.socket?.connected) return;

    this.socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: RECONNECT_DELAY,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      const handler = this.handlers['connect' as keyof SocketHandlers] as EventHandler | undefined;
      if (handler) handler({});
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      const handler = this.handlers['disconnect' as keyof SocketHandlers] as EventHandler | undefined;
      if (handler) handler({});
    });

    this.socket.on('connect_error', () => {
      this.isConnected = false;
    });

    const events: SocketEvent[] = [
      'prompt:new',
      'prompt:complete',
      'queue:update',
      'balance:update',
      'treasury:update',
      'tier:change',
      'log:new',
      'governance:proposal',
      'governance:vote',
      'governance:close',
      'emergence:update',
    ];

    events.forEach((event) => {
      this.socket?.on(event, (data: unknown) => {
        const handler = this.handlers[event as keyof SocketHandlers] as EventHandler | undefined;
        if (handler) {
          handler(data);
        }
      });
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.isConnected = false;
  }

  on<K extends keyof SocketHandlers>(event: K, handler: SocketHandlers[K]): void {
    this.handlers[event] = handler;
  }

  off<K extends keyof SocketHandlers>(event: K): void {
    delete this.handlers[event];
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

export const websocketService = new WebSocketService();

export function useWebSocket() {
  return {
    connect: () => websocketService.connect(),
    disconnect: () => websocketService.disconnect(),
    on: <K extends keyof SocketHandlers>(event: K, handler: SocketHandlers[K]) => websocketService.on(event, handler),
    off: <K extends keyof SocketHandlers>(event: K) => websocketService.off(event),
    isConnected: () => websocketService.getConnectionStatus(),
  };
}