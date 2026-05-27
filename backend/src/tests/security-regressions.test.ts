import { beforeEach, describe, expect, it } from 'vitest';
import type { FastifyRequest } from 'fastify';
import { createVoteNonce, verifyVoteNonce } from '../middleware/auth.js';
import { setBalance } from '../services/state.js';
import {
  calculateInferenceBudget,
  calculateVotingPower,
  getStakingPosition,
  resetStaking,
  stakeDiem,
} from '../services/staking.js';
import { validatePayment } from '../services/x402.js';

const TEST_WALLET = '0x1234567890abcdef1234567890abcdef12345678';

describe('Auth vote nonce', () => {
  it('should allow a created vote nonce exactly once', () => {
    const challenge = createVoteNonce(TEST_WALLET);

    expect(challenge).not.toBeNull();
    if (!challenge) {
      return;
    }

    expect(verifyVoteNonce(TEST_WALLET, challenge.nonce)).toBe(true);
    expect(verifyVoteNonce(TEST_WALLET, challenge.nonce)).toBe(false);
  });
});

describe('x402 payment validation', () => {
  it('should reject partial signature header sets', async () => {
    const request = {
      headers: {
        authorization: 'x402 usdc:5',
        'x-signature': '0xdeadbeef',
      },
    } as unknown as FastifyRequest;

    const result = await validatePayment(request, 1n);

    expect(result.valid).toBe(false);
  });
});

describe('staking restake recomputation', () => {
  beforeEach(() => {
    resetStaking();
    setBalance(TEST_WALLET, 1_000n);
  });

  it('should recompute voting power and inference budget when adding to an existing stake', () => {
    expect(stakeDiem(TEST_WALLET, 25n).success).toBe(true);
    expect(stakeDiem(TEST_WALLET, 15n).success).toBe(true);

    const position = getStakingPosition(TEST_WALLET);
    expect(position).toBeDefined();
    expect(position?.amount).toBe(40n);
    expect(position?.votingPower).toBe(calculateVotingPower(40n));
    expect(position?.inferenceBudget).toBe(calculateInferenceBudget(40n));
  });
});
