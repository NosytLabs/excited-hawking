import { describe, it, expect } from 'vitest';
import { getWalletMode, canVoteWithCurrentWallet, getVoteDisabledReason } from './walletMode';

describe('Wallet Mode', () => {
  it('returns preview mode', () => {
    expect(getWalletMode()).toBe('preview');
  });

  it('prevents voting in preview mode', () => {
    expect(canVoteWithCurrentWallet('preview', '0x123')).toBe(false);
  });

  it('returns proper disabled reason for preview mode', () => {
    expect(getVoteDisabledReason('preview')).toBe('Signed wallet voting is not available in this preview.');
  });
});
