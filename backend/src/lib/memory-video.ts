import { randomBytes } from 'crypto';

const veniceConfig = {
  apiKey: process.env.VENICE_API_KEY || '',
  baseUrl: process.env.VENICE_API_URL || 'https://api.venice.ai/api/v1',
};

async function getVeniceEmbedding(text: string): Promise<number[]> {
  if (!veniceConfig.apiKey) {
    return computeEmbeddingSyncFallback(text);
  }

  try {
    const response = await fetch(`${veniceConfig.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${veniceConfig.apiKey}`,
      },
      body: JSON.stringify({
        input: text.slice(0, 8000),
        model: 'embedding'
      })
    });

    if (!response.ok) {
      return computeEmbeddingSyncFallback(text);
    }

    const data = await response.json() as { data?: Array<{ embedding: number[] }> };
    return data.data?.[0]?.embedding || computeEmbeddingSyncFallback(text);
  } catch {
    return computeEmbeddingSyncFallback(text);
  }
}

function computeEmbeddingSyncFallback(text: string): number[] {
  const simpleHash = simpleTextHashFn(text);
  const dimensions = 384;
  const embedding = new Array(dimensions).fill(0);

  for (let i = 0; i < dimensions; i++) {
    const h1 = (simpleHash + i * 31) % 1000000;
    const h2 = (simpleHash + i * 17) % 1000000;
    embedding[i] = Math.sin(h1 / 100) * Math.cos(h2 / 100);
  }

  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return magnitude > 0 ? embedding.map((val) => val / magnitude) : embedding;
}

function simpleTextHashFn(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export interface MemvidFrame {
  id: string;
  episodeId: string;
  sequenceIndex: number;
  content: string;
  embedding: number[];
  timestamp: number;
  duration: number;
  emotionTags: string[];
  keyMoment: boolean;
  metadata: Record<string, unknown>;
}

export interface MemvidEpisode {
  id: string;
  title: string;
  frames: MemvidFrame[];
  createdAt: number;
  updatedAt: number;
  totalDuration: number;
  summary: string;
  emotionTags: string[];
  metadata: Record<string, unknown>;
  style: 'documentary' | 'noir' | 'comedy' | 'abstract' | 'default';
  accessCount: number;
  lastAccessed: number;
}

export interface MemvidSegment {
  id: string;
  start_time: number;
  end_time: number;
  summary: string;
  emotion_tags: string[];
  key_moments: string[];
}

export interface EpisodeSearchResult {
  episode: MemvidEpisode;
  relevanceScore: number;
  matchedFrames: number;
}

export interface MemvidStats {
  totalEpisodes: number;
  totalFrames: number;
  totalDuration: number;
  averageFramesPerEpisode: number;
  storageBytes: number;
}

function generateUUID(): string {
  return randomBytes(16).toString('hex');
}

export class MemvidService {
  private episodes: Map<string, MemvidEpisode> = new Map();
  private frameIndex: Map<string, string[]> = new Map();
  private embeddingIndex: Map<string, number[]> = new Map();
  private keywordIndex: Map<string, Set<string>> = new Map();
  private episodeFrames: Map<string, MemvidFrame[]> = new Map();

  async initialize(): Promise<void> {
    console.log('[Memvid] Initialized - Episodic video memory system ready');
  }

  async storeEpisode(
    text: string,
    metadata: Record<string, unknown> = {}
  ): Promise<{ episodeId: string; frameCount: number }> {
    const episodeId = generateUUID();

    const useRealEmbedding = text.length < 500 && veniceConfig.apiKey;
    const fullEmbedding = useRealEmbedding
      ? await getVeniceEmbedding(text)
      : undefined;

    if (useRealEmbedding) {
      console.log('[Memvid] Using Venice embedding for short text');
    }

    const frames = this.createFramesFromText(text, episodeId, metadata, fullEmbedding);
    const durationPerFrame = 2000;
    const totalDuration = frames.length * durationPerFrame;

    const emotionTags = this.extractEmotionTags(text);

    const episode: MemvidEpisode = {
      id: episodeId,
      title: this.generateTitle(text),
      frames,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      totalDuration,
      summary: this.generateSummary(text),
      emotionTags,
      metadata,
      style: (metadata.style as MemvidEpisode['style']) || 'default',
      accessCount: 0,
      lastAccessed: Date.now(),
    };

    this.episodes.set(episodeId, episode);
    this.episodeFrames.set(episodeId, frames);

    for (const frame of frames) {
      this.embeddingIndex.set(frame.id, frame.embedding);
      if (!this.frameIndex.has(episodeId)) {
        this.frameIndex.set(episodeId, []);
      }
      this.frameIndex.get(episodeId)!.push(frame.id);

      const keywords = this.extractKeywords(frame.content);
      for (const keyword of keywords) {
        if (!this.keywordIndex.has(keyword)) {
          this.keywordIndex.set(keyword, new Set());
        }
        this.keywordIndex.get(keyword)!.add(episodeId);
      }
    }

    return { episodeId, frameCount: frames.length };
  }

  async retrieveEpisode(episodeId: string): Promise<MemvidEpisode | null> {
    const episode = this.episodes.get(episodeId);
    if (episode) {
      episode.accessCount++;
      episode.lastAccessed = Date.now();
      return episode;
    }
    return null;
  }

  async searchEpisodes(query: string): Promise<EpisodeSearchResult[]> {
    const queryEmbedding = await this.computeEmbedding(query);
    const queryKeywords = this.extractKeywords(query);

    const candidateIds = new Set<string>();
    for (const keyword of queryKeywords) {
      const ids = this.keywordIndex.get(keyword.toLowerCase());
      if (ids) {
        for (const id of ids) {
          candidateIds.add(id);
        }
      }
    }

    if (candidateIds.size === 0) {
      for (const id of this.episodes.keys()) {
        candidateIds.add(id);
      }
    }

    const results: EpisodeSearchResult[] = [];

    for (const id of candidateIds) {
      const episode = this.episodes.get(id);
      if (!episode) continue;

      let totalSimilarity = 0;
      let matchedFrames = 0;

      for (const frame of episode.frames) {
        const similarity = this.cosineSimilarity(queryEmbedding, frame.embedding);
        if (similarity > 0.3) {
          totalSimilarity += similarity;
          matchedFrames++;
        }
      }

      const relevanceScore = episode.frames.length > 0
        ? totalSimilarity / episode.frames.length
        : 0;

      if (relevanceScore > 0.1) {
        results.push({ episode, relevanceScore, matchedFrames });
      }
    }

    results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    return results;
  }

  async compressEpisode(episodeId: string): Promise<string | null> {
    const episode = this.episodes.get(episodeId);
    if (!episode) return null;

    const originalFrameCount = episode.frames.length;

    if (originalFrameCount <= 3) {
      return episode.summary;
    }

    const keepFrames = Math.max(3, Math.floor(originalFrameCount * 0.3));
    const compressedFrames = episode.frames.slice(0, keepFrames);

    for (let i = keepFrames; i < episode.frames.length; i++) {
      const frame = episode.frames[i];
      this.embeddingIndex.delete(frame.id);
    }

    episode.frames = compressedFrames;
    episode.totalDuration = compressedFrames.length * 2000;
    episode.updatedAt = Date.now();

    return episode.summary;
  }

  async createSegment(options: {
    interactionIds: string[];
    style?: MemvidEpisode['style'];
    duration?: number;
  }): Promise<MemvidSegment> {
    const { interactionIds, duration = 60000 } = options;
    const allContent: string[] = [];

    for (const id of interactionIds) {
      const episode = this.episodes.get(id);
      if (episode) {
        allContent.push(...episode.frames.map(f => f.content));
      }
    }

    const combinedContent = allContent.join(' ');
    const startTime = Date.now();
    const endTime = startTime + duration;

    const segment: MemvidSegment = {
      id: generateUUID(),
      start_time: startTime,
      end_time: endTime,
      summary: this.generateSummary(combinedContent),
      emotion_tags: this.extractEmotionTags(combinedContent),
      key_moments: this.extractKeyMoments(combinedContent),
    };

    return segment;
  }

  private createFramesFromText(
    text: string,
    episodeId: string,
    metadata: Record<string, unknown>,
    fullEmbedding?: number[]
  ): MemvidFrame[] {
    const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
    const frames: MemvidFrame[] = [];
    const chunkSize = metadata.chunkSize ? Number(metadata.chunkSize) : 3;
    const durationPerFrame = metadata.durationPerFrame
      ? Number(metadata.durationPerFrame)
      : 2000;

    for (let i = 0; i < sentences.length; i += chunkSize) {
      const chunk = sentences.slice(i, i + chunkSize);
      const content = chunk.join(' ');
      const frameNumber = Math.floor(i / chunkSize);

      frames.push({
        id: generateUUID(),
        episodeId,
        sequenceIndex: frameNumber,
        content,
        embedding: fullEmbedding && i === 0 ? fullEmbedding : computeEmbeddingSyncFallback(content),
        timestamp: Date.now() + (frameNumber * durationPerFrame),
        duration: durationPerFrame,
        emotionTags: this.extractEmotionTags(content),
        keyMoment: this.isKeyMoment(content),
        metadata: {},
      });
    }

    return frames;
  }

  private computeEmbedding(text: string): Promise<number[]> {
    return Promise.resolve(this.computeEmbeddingSync(text));
  }

  private computeEmbeddingSync(text: string): number[] {
    const simpleHash = simpleTextHashFn(text);
    const dimensions = 384;
    const embedding = new Array(dimensions).fill(0);

    for (let i = 0; i < dimensions; i++) {
      const h1 = (simpleHash + i * 31) % 1000000;
      const h2 = (simpleHash + i * 17) % 1000000;
      embedding[i] = Math.sin(h1 / 100) * Math.cos(h2 / 100);
    }

    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? embedding.map((val) => val / magnitude) : embedding;
  }

  

  private extractKeywords(text: string): string[] {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
      'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought',
      'used', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which',
      'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are', 'was',
    ]);

    const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
    return [...new Set(words)].filter((w) => !stopWords.has(w));
  }

  private extractEmotionTags(text: string): string[] {
    const emotionPatterns: Record<string, RegExp[]> = {
      'joy': [/happy/, /joy/, /excited/, /delighted/, /pleased/],
      'sadness': [/sad/, /unhappy/, /depressed/, /melancholy/, /grief/],
      'anger': [/angry/, /furious/, /annoyed/, /frustrated/, /irritated/],
      'fear': [/afraid/, /scared/, /worried/, /anxious/, /nervous/],
      'surprise': [/surprised/, /amazed/, /astonished/, /shocked/],
      'trust': [/trust/, /believe/, /confident/, /reliable/],
      'anticipation': [/excited/, /looking forward/, /hoping/, /awaiting/],
    };

    const tags: string[] = [];
    const lowerText = text.toLowerCase();

    for (const [emotion, patterns] of Object.entries(emotionPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(lowerText)) {
          tags.push(emotion);
          break;
        }
      }
    }

    return [...new Set(tags)];
  }

  private isKeyMoment(content: string): boolean {
    const keyIndicators = [
      'important', 'significant', 'remember', 'key', 'critical',
      'decision', 'choice', 'realized', 'discovered', ' breakthrough',
    ];

    const lowerContent = content.toLowerCase();
    return keyIndicators.some(indicator => lowerContent.includes(indicator));
  }

  private generateTitle(text: string): string {
    const words = text.split(/\s+/).slice(0, 5);
    const title = words.join(' ');
    return title.length > 50 ? title.slice(0, 47) + '...' : title;
  }

  private generateSummary(text: string): string {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    if (sentences.length === 0) return text.slice(0, 100);

    if (sentences.length <= 2) return sentences.join('. ').trim();

    return sentences.slice(0, 2).join('. ').trim() + '.';
  }

  private extractKeyMoments(text: string): string[] {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const keySentences = sentences.filter(s => {
      return this.isKeyMoment(s) || s.length > 50;
    });

    return keySentences.slice(0, 5).map(s => s.trim());
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    let dotProduct = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
    }
    return dotProduct;
  }

  getStats(): MemvidStats {
    let totalFrames = 0;
    let totalDuration = 0;

    for (const episode of this.episodes.values()) {
      totalFrames += episode.frames.length;
      totalDuration += episode.totalDuration;
    }

    const episodesArray = Array.from(this.episodes.values());
    const estimatedBytes = episodesArray.reduce((acc, ep) => {
      return acc + JSON.stringify(ep).length;
    }, 0);

    return {
      totalEpisodes: this.episodes.size,
      totalFrames,
      totalDuration,
      averageFramesPerEpisode: this.episodes.size > 0 ? totalFrames / this.episodes.size : 0,
      storageBytes: estimatedBytes,
    };
  }

  async getRecentEpisodes(limit: number): Promise<MemvidEpisode[]> {
    const sorted = Array.from(this.episodes.values())
      .sort((a, b) => b.createdAt - a.createdAt);

    return sorted.slice(0, limit);
  }

  async prune(keepCount: number): Promise<number> {
    const sorted = Array.from(this.episodes.values()).sort(
      (a, b) => b.accessCount - a.accessCount
    );

    const toDelete = sorted.slice(keepCount);
    for (const episode of toDelete) {
      for (const frame of episode.frames) {
        this.embeddingIndex.delete(frame.id);
      }
      this.episodeFrames.delete(episode.id);
      this.episodes.delete(episode.id);
    }

    return toDelete.length;
  }

  async exportMemories(): Promise<string> {
    const data = {
      version: '1.0',
      timestamp: Date.now(),
      episodes: Array.from(this.episodes.values()),
      stats: this.getStats(),
    };
    return JSON.stringify(data);
  }

  async importMemories(data: string): Promise<void> {
    const parsed = JSON.parse(data);
    this.episodes.clear();
    this.frameIndex.clear();
    this.embeddingIndex.clear();
    this.keywordIndex.clear();
    this.episodeFrames.clear();

    for (const episode of parsed.episodes) {
      this.episodes.set(episode.id, episode);
      this.episodeFrames.set(episode.id, episode.frames);

      for (const frame of episode.frames) {
        this.embeddingIndex.set(frame.id, frame.embedding);
        if (!this.frameIndex.has(episode.id)) {
          this.frameIndex.set(episode.id, []);
        }
        this.frameIndex.get(episode.id)!.push(frame.id);

        const keywords = this.extractKeywords(frame.content);
        for (const keyword of keywords) {
          if (!this.keywordIndex.has(keyword)) {
            this.keywordIndex.set(keyword, new Set());
          }
          this.keywordIndex.get(keyword)!.add(episode.id);
        }
      }
    }
  }
}

export const createMemvidService = () => new MemvidService();