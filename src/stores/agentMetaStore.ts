import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type { Tier } from '../context/agent-types';

interface AgentMetaState {
  diemStaked: number;
  treasuryUSDC: number;
  tier: Tier;
  setMeta: (diemStaked: number, treasuryUSDC: number, tier: Tier) => void;
}

export const useAgentMetaStore = create<AgentMetaState>((set) => ({
  diemStaked: 0,
  treasuryUSDC: 0,
  tier: 'Minimal',
  setMeta: (diemStaked, treasuryUSDC, tier) => set({ diemStaked, treasuryUSDC, tier }),
}));

export const useAgentMeta = () => useAgentMetaStore(useShallow(state => ({
  diemStaked: state.diemStaked,
  treasuryUSDC: state.treasuryUSDC,
  tier: state.tier,
})));
