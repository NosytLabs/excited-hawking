import { io, Socket } from 'socket.io-client';
import { WSEvents, WSEvent } from '../types/events';

export type SocketEvent = WSEvent;

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
  [WSEvents.CONNECT]: EventHandler<void>;
  [WSEvents.DISCONNECT]: EventHandler<void>;
  [WSEvents.CONNECT_ERROR]: EventHandler<void>;
  [WSEvents.PROMPT_NEW]: EventHandler<PromptEvent>;
  [WSEvents.PROMPT_COMPLETE]: EventHandler<PromptEvent>;
  [WSEvents.QUEUE_UPDATE]: EventHandler<PromptEvent[]>;
  [WSEvents.BALANCE_UPDATE]: EventHandler<BalanceEvent>;
  [WSEvents.TREASURY_UPDATE]: EventHandler<TreasuryEvent>;
  [WSEvents.TIER_CHANGE]: EventHandler<TierEvent>;
  [WSEvents.LOG_NEW]: EventHandler<LogEvent>;
  [WSEvents.GOVERNANCE_PROPOSAL]: EventHandler<GovernanceEvent>;
  [WSEvents.GOVERNANCE_PROPOSAL_NEW]: EventHandler<GovernanceEvent>;
  [WSEvents.GOVERNANCE_PROPOSAL_UPDATE]: EventHandler<GovernanceEvent>;
  [WSEvents.GOVERNANCE_VOTE]: EventHandler<GovernanceEvent>;
  [WSEvents.GOVERNANCE_CLOSE]: EventHandler<GovernanceEvent>;
  [WSEvents.GOVERNANCE_UPDATE]: EventHandler<Record<string, unknown>>;
  [WSEvents.EMERGENCE_UPDATE]: EventHandler<EmergenceEvent>;
}

const WS_URL = import.meta.env.VITE_WS_URL || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`;
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

    this.socket.on(WSEvents.CONNECT, () => {
      this.isConnected = true;
      const handler = this.handlers[WSEvents.CONNECT] as EventHandler | undefined;
      if (handler) handler({});
    });

    this.socket.on(WSEvents.DISCONNECT, () => {
      this.isConnected = false;
      const handler = this.handlers[WSEvents.DISCONNECT] as EventHandler | undefined;
      if (handler) handler({});
    });

    this.socket.on(WSEvents.CONNECT_ERROR, () => {
      this.isConnected = false;
      const handler = this.handlers[WSEvents.CONNECT_ERROR] as EventHandler | undefined;
      if (handler) handler({});
    });

    const events: SocketEvent[] = [
      WSEvents.PROMPT_NEW,
      WSEvents.PROMPT_COMPLETE,
      WSEvents.QUEUE_UPDATE,
      WSEvents.BALANCE_UPDATE,
      WSEvents.TREASURY_UPDATE,
      WSEvents.TIER_CHANGE,
      WSEvents.LOG_NEW,
      WSEvents.GOVERNANCE_PROPOSAL,
      WSEvents.GOVERNANCE_PROPOSAL_NEW,
      WSEvents.GOVERNANCE_PROPOSAL_UPDATE,
      WSEvents.GOVERNANCE_VOTE,
      WSEvents.GOVERNANCE_CLOSE,
      WSEvents.GOVERNANCE_UPDATE,
      WSEvents.EMERGENCE_UPDATE,
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
