export {};

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
    };
  }
}

export type WalletMode = 'preview' | 'signed';

export function getWalletMode(): WalletMode {
  if (typeof window !== 'undefined' && window.ethereum?.isMetaMask) {
    return 'signed';
  }
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
