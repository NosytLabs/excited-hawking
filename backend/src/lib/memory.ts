import { generateId } from './crypto.js';
import { MemvidService, createMemvidService } from './memory-video.js';
import { emitMemoryNew } from '../services/websocket.js';
import { persistToFile, loadFromFile } from './persistence.js';

// Bounded snapshot system - frozen memory files for session injection
// Inspired by Hermes Agent's MEMORY.md / USER.md bounded stores
const MAX_COLLECTIVE_CHARS = 2200;
const MAX_USER_CHARS = 1375;
const DELIMITER = '§';

class BoundedSnapshot {
  private collective: string = '';
  private user: string = '';
  private dirty: boolean = false;

  getCollective(): string {
    return this.collective;
  }

  getUser(wallet: string): string {
    const userEntry = this.user.split(DELIMITER).find(e => e.startsWith(`${wallet}:`));
    return userEntry ? userEntry.split(':')[1] || '' : '';
  }

  updateCollective(content: string): void {
    if (content.length > MAX_COLLECTIVE_CHARS) {
      content = content.slice(-MAX_COLLECTIVE_CHARS);
    }
    this.collective = content;
    this.dirty = true;
  }

  updateUser(wallet: string, content: string): void {
    if (content.length > MAX_USER_CHARS) {
      content = content.slice(-MAX_USER_CHARS);
    }
    const existing = this.user.split(DELIMITER).filter(e => !e.startsWith(`${wallet}:`));
    existing.push(`${wallet}:${content}`);
    this.user = existing.join(DELIMITER);
    this.dirty = true;
  }

  appendToCollective(entry: string): void {
    const separator = this.collective ? ' | ' : '';
    this.updateCollective(this.collective + separator + entry);
  }

  appendToUser(wallet: string, entry: string): void {
    const current = this.getUser(wallet);
    const separator = current ? ' | ' : '';
    this.updateUser(wallet, current + separator + entry);
  }

  isDirty(): boolean {
    return this.dirty;
  }

  clearDirty(): void {
    this.dirty = false;
  }

  toJSON(): { collective: string; user: string } {
    return { collective: this.collective, user: this.user };
  }

  fromJSON(data: { collective: string; user: string }): void {
    this.collective = data.collective || '';
    this.user = data.user || '';
    this.dirty = false;
  }
}

const boundedSnapshot = new BoundedSnapshot();

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

  persist(): void {
    try {
      const serialized = {
        memories: Array.from(this.memories.entries()),
        dreamState: this.dreamState,
        recentEpisodes: this.recentEpisodes,
        boundedSnapshot: boundedSnapshot.toJSON()
      };
      persistToFile('memory.json', serialized).catch(err => {
        console.error('[Memory] Persist failed:', err);
      });
    } catch (err) {
      console.error('[Memory] Persist failed:', err);
    }
  }

  async restore(): Promise<void> {
    const data = await loadFromFile<{
      memories: [string, MemoryEntry[]][];
      dreamState: { dreams: string[]; dreamDepth: number; lastDream: number };
      recentEpisodes: string[];
      boundedSnapshot: unknown;
    } | null>('memory.json', null);
    if (!data) return;
    try {
      this.memories = new Map<string, MemoryEntry[]>(data.memories as [string, MemoryEntry[]][]);
      this.dreamState = data.dreamState as { dreams: string[]; dreamDepth: number; lastDream: number };
      this.recentEpisodes = data.recentEpisodes || [];
      if (data.boundedSnapshot) {
        boundedSnapshot.fromJSON(data.boundedSnapshot as { collective: string; user: string });
      }
      console.log('[Memory] State restored');
    } catch (err) {
      console.error('[Memory] Restore failed:', err);
    }
  }

  constructor() {
    this.memvid = createMemvidService();
  }

  getMemvid(): MemvidService {
    return this.memvid;
  }

  async initialize(): Promise<void> {
    await this.restore();
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
    this.persist();

    if (type === 'interaction' && this.memvid) {
      try {
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
      } catch (err) {
        console.error('[Memory] Memvid storeEpisode failed:', err);
      }
    }

    try {
      emitMemoryNew({
        id,
        type,
        content,
        timestamp: Date.now(),
        connections: []
      });
    } catch (err) {
      console.error('[Memory] Failed to emit memory:new event:', err);
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
    this.persist();

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

  // Bounded snapshot methods - for session injection
  getBoundedSnapshot(): { collective: string; user: string } {
    return boundedSnapshot.toJSON();
  }

  updateBoundedFromExperience(wallet: string, content: string, type: string): void {
    if (type === 'interaction' && content.length < 200) {
      boundedSnapshot.appendToCollective(content.slice(0, 100));
      boundedSnapshot.appendToUser(wallet, content.slice(0, 80));
    }
    if (boundedSnapshot.isDirty()) {
      this.persist();
      boundedSnapshot.clearDirty();
    }
  }
}

export const memoryEngine = new MemoryEngine();
export type { MemoryEntry, DreamState };
export { boundedSnapshot };