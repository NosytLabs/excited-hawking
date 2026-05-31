import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { websocketService } from '../services/websocket';

interface ConnectionState {
  isConnected: boolean;
  backendAvailable: boolean;
  walletAddress: string | null;
  walletSignature: string | undefined;
  walletNonce: string | undefined;
  setConnected: (isConnected: boolean, backendAvailable: boolean) => void;
  setWalletAddress: (address: string | null) => void;
  setWalletSignature: (signature: string | undefined) => void;
  setWalletNonce: (nonce: string | undefined) => void;
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  isConnected: false,
  backendAvailable: websocketService.getConnectionStatus(),
  walletAddress: null,
  walletSignature: undefined,
  walletNonce: undefined,
  setConnected: (isConnected, backendAvailable) => set({ isConnected, backendAvailable }),
  setWalletAddress: (address) => set({ walletAddress: address, isConnected: address !== null }),
  setWalletSignature: (signature) => set({ walletSignature: signature }),
  setWalletNonce: (nonce) => set({ walletNonce: nonce }),
}));

export const useConnection = () => useConnectionStore(useShallow(state => ({
  isConnected: state.isConnected,
  backendAvailable: state.backendAvailable,
  walletAddress: state.walletAddress,
  walletSignature: state.walletSignature,
  walletNonce: state.walletNonce,
})));
