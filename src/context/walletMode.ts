export type WalletMode = 'preview' | 'signed';

export function getWalletMode(): WalletMode {
  return 'preview';
}

export function canVoteWithCurrentWallet(mode: WalletMode, walletAddress?: string | null): boolean {
  if (mode === 'preview') {
    return false;
  }
  return !!walletAddress;
}

export function getVoteDisabledReason(mode: WalletMode): string {
  if (mode === 'preview') {
    return 'Signed wallet voting is not available in this preview.';
  }
  return 'Connect wallet to vote.';
}
