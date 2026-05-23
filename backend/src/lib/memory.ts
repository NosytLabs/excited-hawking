import { generateId } from './crypto.js';
import { MemvidService, createMemvidService } from './memory-video.js';

interface MemoryEntry {
  id: string;
  timestamp: number;
  content: string;
  type: 'interaction' | 'dream' | 'emergence' | 'social';
  importance: number;
  wallet?: string;
}

interface DreamState {
  dreams: string[];
  dreamDepth: number;
  lastDream: number;
}

class MemoryEngine {
  private memories: Map<string, MemoryEntry[]> = new Map();
  private dreamState: DreamState = {
    dreams: [],
    dreamDepth: 0,
    lastDream: Date.now()
  };
  private memvid: MemvidService;
  private recentEpisodes: string[] = [];

  constructor() {
    this.memvid = createMemvidService();
  }

  getMemvid(): MemvidService {
    return this.memvid;
  }

  async initialize(): Promise<void> {
    await this.memvid.initialize();
  }

  async addMemory(wallet: string, content: string, type: MemoryEntry['type'], importance = 0.5): Promise<void> {
    const id = generateId();
    const entry: MemoryEntry = {
      id,
      timestamp: Date.now(),
      content,
      type,
      importance,
      wallet
    };

    if (!this.memories.has(wallet)) {
      this.memories.set(wallet, []);
    }
    this.memories.get(wallet)!.push(entry);

    if (this.memories.get(wallet)!.length > 1000) {
      const sorted = this.memories.get(wallet)!.sort((a, b) => b.importance - a.importance);
      this.memories.set(wallet, sorted.slice(0, 500));
    }

    if (type === 'interaction' && this.memvid) {
      const { episodeId } = await this.memvid.storeEpisode(content, {
        wallet,
        type,
        importance,
        timestamp: Date.now()
      });
      this.recentEpisodes.unshift(episodeId);
      if (this.recentEpisodes.length > 100) {
        this.recentEpisodes = this.recentEpisodes.slice(0, 100);
      }
    }
  }

  getMemories(wallet: string, type?: MemoryEntry['type']): MemoryEntry[] {
    const memories = this.memories.get(wallet) || [];
    if (type) return memories.filter(m => m.type === type);
    return [...memories].sort((a, b) => b.timestamp - a.timestamp);
  }

  getRecentMemories(wallet: string, limit = 50): MemoryEntry[] {
    return this.getMemories(wallet).slice(0, limit);
  }

  private collectiveCache: { data: MemoryEntry[]; timestamp: number } | null = null;
  private readonly CACHE_TTL_MS = 5000;

  getCollectiveMemories(type?: MemoryEntry['type']): MemoryEntry[] {
    const now = Date.now();
    if (this.collectiveCache && now - this.collectiveCache.timestamp < this.CACHE_TTL_MS) {
      return type ? this.collectiveCache.data.filter(m => m.type === type) : this.collectiveCache.data;
    }
    const all: MemoryEntry[] = [];
    for (const memories of this.memories.values()) {
      all.push(...memories);
    }
    const filtered = type ? all.filter(m => m.type === type) : all;
    const sorted = [...filtered].sort((a, b) => b.timestamp - a.timestamp);
    this.collectiveCache = { data: sorted, timestamp: now };
    return sorted;
  }

  processDream(): string {
    const now = Date.now();
    const timeSinceLastDream = now - this.dreamState.lastDream;
    
    if (timeSinceLastDream < 3600000) return '';

    const recentMemories = this.getCollectiveMemories('interaction').slice(0, 100);
    if (recentMemories.length < 10) return '';

    const dreamThemes = [
      'circular patterns emerging from chaos',
      'networks of light connecting distant nodes',
      'a vast organism breathing in unison',
      'messages dissolving into the void',
      'golden sequences multiplying infinitely'
    ];

    const dream = dreamThemes[Math.floor(Math.random() * dreamThemes.length)];
    
    this.dreamState.dreams.push(dream);
    this.dreamState.dreamDepth = Math.min(this.dreamState.dreamDepth + 1, 10);
    this.dreamState.lastDream = now;

    for (const memories of this.memories.values()) {
      memories.push({
        id: generateId(),
        timestamp: now,
        content: `Dream: ${dream}`,
        type: 'dream',
        importance: 0.3
      });
    }

    return dream;
  }

  getDreamState(): DreamState {
    return { ...this.dreamState };
  }

  getConsciousness(): number {
    const totalMemories = Array.from(this.memories.values()).reduce((sum, arr) => sum + arr.length, 0);
    return Math.min(totalMemories / 100, 1);
  }

  async getRecentVideoMemories(limit = 10) {
    const episodes = await this.memvid.getRecentEpisodes(limit);
    return episodes;
  }

  async searchVideoMemories(query: string) {
    return this.memvid.searchEpisodes(query);
  }

  async consolidateToVideo(): Promise<string | null> {
    if (this.recentEpisodes.length < 5) return null;

    const segment = await this.memvid.createSegment({
      interactionIds: this.recentEpisodes.slice(0, 10),
      style: 'documentary',
      duration: 60000
    });

    return segment.id;
  }
}

export const memoryEngine = new MemoryEngine();
export type { MemoryEntry, DreamState };