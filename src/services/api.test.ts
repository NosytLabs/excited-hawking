import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api, normalizeStatusResponse } from './api';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe('API Service', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('normalizeStatusResponse', () => {
    it('flattens nested agent status into StatusResponse', () => {
      const payload = {
        agent: {
          diemStaked: 1000,
          treasuryUSDC: 500,
          tier: 'Seed',
          status: 'alive',
          uptime: 12345,
          version: '1.0.0'
        },
        wallet: '0x123',
        balance: '100',
        timestamp: 1234567890
      };

      const result = normalizeStatusResponse(payload);
      
      expect(result).toEqual({
        diemStaked: 1000,
        treasuryUSDC: 500,
        tier: 'Seed',
        connected: true
      });
    });
  });

  describe('submitPrompt', () => {
    it('posts to /api/prompt', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ promptId: '123' })
      });

      const res = await api.submitPrompt('hello world');
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/prompt'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ content: 'hello world' })
        })
      );
      expect(res.promptId).toBe('123');
    });
  });

  describe('vote', () => {
    it('posts signed vote request correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      await api.vote({
        promptId: '123',
        vote: 'up',
        walletAddress: '0x123',
        signature: 'sig',
        nonce: 'nonce',
        wallet: '0x123'
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/vote'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'x-wallet-address': '0x123',
            'x-signature': 'sig',
            'x-nonce': 'nonce'
          }),
          body: JSON.stringify({ promptId: '123', vote: 'up', wallet: '0x123' })
        })
      );
    });
  });
});