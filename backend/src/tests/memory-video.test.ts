import { describe, it, expect, beforeEach } from 'vitest';
import { MemvidService, createMemvidService } from '../lib/memory-video.js';

describe('MemvidService', () => {
  let memvid: MemvidService;

  beforeEach(() => {
    memvid = createMemvidService();
  });

  describe('storeEpisode', () => {
    it('should create an episode with frames from text', async () => {
      const text = 'This is a test episode. It contains multiple sentences. Each sentence becomes a frame.';
      const result = await memvid.storeEpisode(text, {});

      expect(result.episodeId).toBeDefined();
      expect(result.frameCount).toBeGreaterThan(0);
    });

    it('should store episode and make it retrievable', async () => {
      const text = 'A single important experience worth remembering.';
      const { episodeId } = await memvid.storeEpisode(text, {});

      const episode = await memvid.retrieveEpisode(episodeId);
      expect(episode).not.toBeNull();
      expect(episode?.id).toBe(episodeId);
      expect(episode?.frames.length).toBeGreaterThan(0);
    });

    it('should extract emotion tags from text', async () => {
      const text = 'I am so happy and excited about this wonderful day!';
      const { episodeId } = await memvid.storeEpisode(text, {});

      const episode = await memvid.retrieveEpisode(episodeId);
      expect(episode?.emotionTags).toContain('joy');
      expect(episode?.emotionTags).toContain('anticipation');
    });
  });

  describe('retrieveEpisode', () => {
    it('should return null for non-existent episode', async () => {
      const episode = await memvid.retrieveEpisode('non-existent-id');
      expect(episode).toBeNull();
    });

    it('should increment access count on retrieval', async () => {
      const text = 'An experience to retrieve.';
      const { episodeId } = await memvid.storeEpisode(text, {});

      const ep1 = await memvid.retrieveEpisode(episodeId);
      expect(ep1?.accessCount).toBe(1);

      const ep2 = await memvid.retrieveEpisode(episodeId);
      expect(ep2?.accessCount).toBe(2);
    });
  });

  describe('searchEpisodes', () => {
    it('should find episodes by keyword', async () => {
      const mv = createMemvidService();
      await mv.storeEpisode('The weather today is sunny and warm.', {});
      await mv.storeEpisode('I love eating pizza with friends.', {});
      await mv.storeEpisode('Coding in TypeScript is enjoyable.', {});

      const results = await mv.searchEpisodes('sunny weather');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should return results sorted by relevance', async () => {
      const mv = createMemvidService();
      await mv.storeEpisode('Cats are wonderful pets. They are independent and playful.', {});
      await mv.storeEpisode('Dogs offer unconditional love and loyalty.', {});

      const results = await mv.searchEpisodes('pet animals');
      expect(results.length).toBe(2);
      expect(results[0].relevanceScore).toBeGreaterThanOrEqual(results[1].relevanceScore);
    });
  });

  describe('compressEpisode', () => {
    it('should return null for non-existent episode', async () => {
      const result = await memvid.compressEpisode('non-existent');
      expect(result).toBeNull();
    });

    it('should compress episode to summary if too short', async () => {
      const text = 'Short text.';
      const { episodeId } = await memvid.storeEpisode(text, {});
      const result = await memvid.compressEpisode(episodeId);
      expect(result).toBeDefined();
    });

    it('should reduce frame count for long episodes', async () => {
      const mv = createMemvidService();
      const longText = Array(20).fill('This is a sentence about an experience. It has meaning.').join(' ');
      const { episodeId } = await mv.storeEpisode(longText, {});

      const beforeEpisode = await mv.retrieveEpisode(episodeId);
      const originalFrameCount = beforeEpisode?.frames.length || 0;

      await mv.compressEpisode(episodeId);

      const afterEpisode = await mv.retrieveEpisode(episodeId);
      expect((afterEpisode?.frames.length || 0)).toBeLessThan(originalFrameCount);
    });
  });

  describe('getRecentEpisodes', () => {
    it('should return empty array when no episodes exist', async () => {
      const results = await memvid.getRecentEpisodes(10);
      expect(results).toEqual([]);
    });

    it('should return most recent episodes', async () => {
      const mv = createMemvidService();
      await mv.storeEpisode('First episode stored.', {});
      await mv.storeEpisode('Second episode stored.', {});
      await mv.storeEpisode('Third episode stored.', {});

      const results = await mv.getRecentEpisodes(3);
      expect(results.length).toBe(3);
      const titles = results.map(r => r.title);
      expect(titles).toContain('Third episode stored.');
    });

    it('should respect limit parameter', async () => {
      const mv = createMemvidService();
      for (let i = 0; i < 5; i++) {
        await mv.storeEpisode(`Episode ${i} content.`);
      }
      const results = await mv.getRecentEpisodes(3);
      expect(results.length).toBe(3);
    });
  });

  describe('getStats', () => {
    it('should return accurate statistics', async () => {
      const mv = createMemvidService();
      await mv.storeEpisode('First episode content.', {});
      await mv.storeEpisode('Second episode content.', {});

      const stats = mv.getStats();
      expect(stats.totalEpisodes).toBe(2);
      expect(stats.totalFrames).toBeGreaterThan(0);
      expect(stats.averageFramesPerEpisode).toBeGreaterThan(0);
      expect(stats.storageBytes).toBeGreaterThan(0);
    });
  });

  describe('prune', () => {
    it('should delete old episodes when prune count is exceeded', async () => {
      const mv = createMemvidService();
      for (let i = 0; i < 5; i++) {
        await mv.storeEpisode(`Episode ${i} content to remember.`);
      }
      const deleted = await mv.prune(3);
      expect(deleted).toBe(2);
      const stats = mv.getStats();
      expect(stats.totalEpisodes).toBe(3);
    });
  });

  describe('exportMemories / importMemories', () => {
    it('should export and import memories correctly', async () => {
      const mv = createMemvidService();
      const text = 'An important memory to preserve.';
      const { episodeId } = await mv.storeEpisode(text, {});

      const exported = await mv.exportMemories();

      const newMemvid = createMemvidService();
      await newMemvid.importMemories(exported);

      const retrieved = await newMemvid.retrieveEpisode(episodeId);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.frames[0].content).toContain('important memory');
    });
  });

  describe('createSegment', () => {
    it('should create a segment from multiple episodes', async () => {
      const mv = createMemvidService();
      const { episodeId: id1 } = await mv.storeEpisode('First interaction content.', {});
      const { episodeId: id2 } = await mv.storeEpisode('Second interaction content.', {});

      const segment = await mv.createSegment({
        interactionIds: [id1, id2],
        style: 'documentary',
        duration: 30000,
      });

      expect(segment.id).toBeDefined();
      expect(segment.summary).toBeDefined();
    });
  });
});