import { describe, it, expect, beforeEach } from 'vitest';
import {
  getBalance,
  setBalance,
  deductBalance,
  addToTreasury,
  getState,
  addPrompt,
  getPrompts,
  checkRateLimit,
  getClientIp
} from '../services/state.js';

import {
  createProposal,
  getProposal,
  getAllProposals,
  castVote,
  getVotes,
  resetGovernance
} from '../services/governance.js';

import { conwayEngine } from '../lib/emergence.js';
import { socialEngine } from '../lib/social.js';

describe('State Service', () => {
  beforeEach(() => {
    setBalance('test_wallet', 0n);
  });

  it('should get and set balance', () => {
    setBalance('test_wallet', 1000000n);
    const balance = getBalance('test_wallet');
    expect(balance).toBe(1000000n);
  });

  it('should deduct balance successfully', () => {
    setBalance('test_wallet', 1000000n);
    const result = deductBalance('test_wallet', 500000n);
    expect(result).toBe(true);
    expect(getBalance('test_wallet')).toBe(500000n);
  });

  it('should fail deduct when insufficient balance', () => {
    setBalance('test_wallet', 100000n);
    const result = deductBalance('test_wallet', 500000n);
    expect(result).toBe(false);
  });

  it('should add to treasury', () => {
    const state = getState();
    const initial = state.treasuryUSDC;
    addToTreasury(100000n);
    expect(getState().treasuryUSDC).toBe(initial + 100000);
  });

  it('should add and get prompts', () => {
    addPrompt({
      id: 'test123',
      wallet: 'test_wallet',
      content: 'Test prompt',
      tier: 'free',
      diemAmount: 0n,
      status: 'queued',
      votes: 0,
      createdAt: Date.now()
    });
    const prompts = getPrompts();
    expect(prompts.length).toBeGreaterThan(0);
  });
});

describe('Governance Service', () => {
  beforeEach(() => {
    resetGovernance();
    setBalance('proposer_wallet', 1000000000n);
    setBalance('voter_wallet', 1000000000n);
  });

  it('should create a proposal', () => {
    const result = createProposal(
      'proposer_wallet',
      'Test Proposal',
      'Test description',
      'protocol',
      5000n,
      null,
      false
    );
    expect('id' in result).toBe(true);
    expect((result as any).title).toBe('Test Proposal');
  });

  it('should get a proposal', () => {
    const created = createProposal(
      'proposer_wallet',
      'Get Test',
      'Description',
      'treasury',
      5000n,
      null,
      false
    );
    const proposal = getProposal((created as any).id);
    expect(proposal).not.toBeNull();
    expect((proposal as any).title).toBe('Get Test');
  });

  it('should get all proposals', () => {
    const proposals = getAllProposals();
    expect(Array.isArray(proposals)).toBe(true);
  });

  it('should cast a vote', () => {
    const proposal = createProposal(
      'voter_wallet',
      'Vote Test',
      'Description',
      'parameter',
      5000n,
      null,
      false
    );

    const result = castVote('voter_wallet', (proposal as any).id, 'for');
    expect('id' in result).toBe(true);
  });

  it('should get votes for a proposal', () => {
    const proposal = createProposal(
      'voter_wallet',
      'Votes Test',
      'Description',
      'social',
      5000n,
      null,
      false
    );

    castVote('voter_wallet', (proposal as any).id, 'for');
    const votes = getVotes((proposal as any).id);
    expect(Array.isArray(votes)).toBe(true);
    expect(votes.length).toBeGreaterThan(0);
  });
});

describe('Conway Engine', () => {
  beforeEach(() => {
    conwayEngine.reset();
  });

  it('should get grid state', () => {
    const state = conwayEngine.getGridState();
    expect(state).toHaveProperty('grid');
    expect(state).toHaveProperty('generation');
    expect(state).toHaveProperty('alive');
    expect(state).toHaveProperty('density');
  });

  it('should step the simulation', () => {
    conwayEngine.seedFromPrompts(['test prompt']);
    const result = conwayEngine.step();
    expect(result).toHaveProperty('grid');
    expect(result).toHaveProperty('generation');
    expect(result.generation).toBe(1);
  });

  it('should get emergence score', () => {
    const score = conwayEngine.getEmergenceScore();
    expect(typeof score).toBe('number');
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it('should reset', () => {
    conwayEngine.seedFromPrompts(['test']);
    conwayEngine.reset();
    const state = conwayEngine.getGridState();
    expect(state.generation).toBe(0);
  });
});

describe('Social Engine', () => {
  it('should create a share link', () => {
    const share = socialEngine.createShareLink('wallet123', 'prompt456', 'twitter');
    expect(share).toHaveProperty('id');
    expect(share.platform).toBe('twitter');
    expect(share.wallet).toBe('wallet123');
  });

  it('should create referral', () => {
    const referral = socialEngine.createReferral('referrer1', 'referee1');
    expect(referral).toHaveProperty('id');
    expect(referral.referrer).toBe('referrer1');
    expect(referral.status).toBe('pending');
  });

  it('should get metrics', () => {
    const metrics = socialEngine.getMetrics();
    expect(metrics).toHaveProperty('totalShares');
    expect(metrics).toHaveProperty('totalClicks');
    expect(metrics).toHaveProperty('referralCount');
  });
});

describe('Rate Limiting', () => {
  it('should allow requests within limit for prompts', () => {
    const result = checkRateLimit('192.168.1.1', 'prompt', 'wallet1');
    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(10);
  });

  it('should block requests after limit exceeded for prompts', () => {
    const wallet = 'ratelimit_wallet_' + Date.now();
    for (let i = 0; i < 10; i++) {
      checkRateLimit('192.168.1.100', 'prompt', wallet);
    }
    const result = checkRateLimit('192.168.1.100', 'prompt', wallet);
    expect(result.allowed).toBe(false);
    expect(result.isWalletLimited).toBe(true);
  });

  it('should allow requests within limit for votes', () => {
    const result = checkRateLimit('192.168.1.2', 'vote', 'wallet2');
    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(30);
  });

  it('should allow requests within limit for proposals', () => {
    const result = checkRateLimit('192.168.1.3', 'proposal', 'wallet3');
    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(5);
  });

  it('should track IPs for wallet rate limiting', () => {
    const wallet = 'multiip_wallet_' + Date.now();
    checkRateLimit('10.0.0.1', 'prompt', wallet);
    checkRateLimit('10.0.0.2', 'prompt', wallet);
    const result = checkRateLimit('10.0.0.2', 'prompt', wallet);
    expect(result.allowed).toBe(true);
  });

  it('should get client IP from x-forwarded-for header', () => {
    const request = {
      headers: { 'x-forwarded-for': '203.0.113.1, 70.41.3.18, 150.172.238.178' }
    };
    const ip = getClientIp(request);
    expect(ip).toBe('203.0.113.1');
  });

  it('should get client IP from request.ip', () => {
    const request = {
      ip: '192.168.1.100',
      headers: {}
    };
    const ip = getClientIp(request);
    expect(ip).toBe('192.168.1.100');
  });
});