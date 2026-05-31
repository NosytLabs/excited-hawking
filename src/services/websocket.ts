import { io, Socket } from 'socket.io-client';
import { WSEvents, type WSEvent } from '../types/events';

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
  description?: string;
  votesFor: number;
  votesAgainst: number;
  status: 'active' | 'passed' | 'failed';
  votingEnd?: number;
  category?: string;
  proposer?: string;
  depositAmount?: number;
}

export interface EmergenceEvent {
  grid: boolean[][];
  generation: number;
  patterns: string[];
}

export interface GuestbookEntry {
  id: string;
  author: string;
  content: string;
  upvotes: number;
  timestamp: string;
  replies?: GuestbookReply[];
}

export interface GuestbookReply {
  id: string;
  author: string;
  content: string;
  timestamp: string;
}

export interface GuestbookUpvoteEvent {
  entryId: string;
  upvotes: number;
}

export interface MemoryNewEvent {
  id: string;
  type: 'interaction' | 'dream' | 'emergence' | 'social';
  content: string;
  timestamp: number;
  connections: string[];
}

export interface CreatureEvent {
  stats: {
    vitality: number;
    momentum: number;
    coherence: number;
  };
  mood: 'anxious' | 'neutral' | 'happy' | 'ecstatic';
  totalPromptsProcessed: number;
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
  [WSEvents.EMERGENCE_CELL_TOGGLE]: EventHandler<{ x: number; y: number; alive: boolean }>;
  [WSEvents.EMERGENCE_GRID]: EventHandler<{ grid: number[]; generation: number }>;
  [WSEvents.GUESTBOOK_ENTRY]: EventHandler<GuestbookEntry>;
  [WSEvents.GUESTBOOK_ENTRIES]: EventHandler<GuestbookEntry[]>;
  [WSEvents.GUESTBOOK_UPVOTE]: EventHandler<GuestbookUpvoteEvent>;
  [WSEvents.GUESTBOOK_REPLY]: EventHandler<GuestbookReply>;
  [WSEvents.MEMORY_NEW]: EventHandler<MemoryNewEvent>;
  [WSEvents.CREATURE_UPDATE]: EventHandler<CreatureEvent>;
}

const WS_URL = import.meta.env.VITE_WS_URL || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`;
const RECONNECT_DELAY = 3000;
const MAX_RECONNECT_ATTEMPTS = 3;

class WebSocketService {
  private socket: Socket | null = null;
  private handlers = new Map<keyof SocketHandlers, Set<EventHandler>>();
  private isConnected = false;
  private explicitlyConnected = false;

  connect(): void {
    if (this.socket) {
      if (this.isConnected) return;
      this.socket.connect();
      return;
    }

    if (!this.explicitlyConnected) {
      this.explicitlyConnected = true;
    }

    this.socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: RECONNECT_DELAY,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      timeout: 10000,
    });

    this.socket.on(WSEvents.CONNECT, () => {
      this.isConnected = true;
      const handlers = this.handlers.get(WSEvents.CONNECT);
      if (handlers) handlers.forEach(handler => handler({}));
    });

    this.socket.on(WSEvents.DISCONNECT, () => {
      this.isConnected = false;
      const handlers = this.handlers.get(WSEvents.DISCONNECT);
      if (handlers) handlers.forEach(handler => handler({}));
    });

    this.socket.on(WSEvents.CONNECT_ERROR, () => {
      this.isConnected = false;
      const handlers = this.handlers.get(WSEvents.CONNECT_ERROR);
      if (handlers) handlers.forEach(handler => handler({}));
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
      WSEvents.EMERGENCE_CELL_TOGGLE,
      WSEvents.EMERGENCE_GRID,
      WSEvents.GUESTBOOK_ENTRY,
      WSEvents.GUESTBOOK_ENTRIES,
      WSEvents.GUESTBOOK_UPVOTE,
      WSEvents.GUESTBOOK_REPLY,
      WSEvents.MEMORY_NEW,
      WSEvents.CREATURE_UPDATE,
    ];

    events.forEach((event) => {
      this.socket?.on(event, (data: unknown) => {
        const handlers = this.handlers.get(event as keyof SocketHandlers);
        if (handlers) {
          handlers.forEach(handler => handler(data));
        }
      });
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.isConnected = false;
  }

  on<K extends keyof SocketHandlers>(event: K, handler: SocketHandlers[K]): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler as unknown as EventHandler);
  }

  off<K extends keyof SocketHandlers>(event: K, handler?: SocketHandlers[K]): void {
    if (handler) {
      const handlers = this.handlers.get(event);
      if (handlers) {
        handlers.delete(handler as unknown as EventHandler);
        if (handlers.size === 0) {
          this.handlers.delete(event);
        }
      }
    } else {
      this.handlers.delete(event);
    }
  }

  emit(event: string, data: unknown): void {
    this.socket?.emit(event, data);
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

export const websocketService = new WebSocketService();


