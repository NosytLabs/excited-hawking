import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type { Proposal } from '../context/agent-types';

interface GovernanceState {
  proposals: Proposal[];
  setProposals: (proposals: Proposal[] | ((prev: Proposal[]) => Proposal[])) => void;
  voteProposal: (id: string, vote: 'for' | 'against' | 'abstain') => void;
}

export const useGovernanceStore = create<GovernanceState>((set) => ({
  proposals: [],
  setProposals: (value) => {
    if (typeof value === 'function') {
      set((state) => ({ proposals: value(state.proposals) }));
    } else {
      set({ proposals: value });
    }
  },
  voteProposal: (id, vote) => set((state) => ({
    proposals: state.proposals.map(p => p.id === id ? {
      ...p,
      votesFor: vote === 'for' ? p.votesFor + 1 : p.votesFor,
      votesAgainst: vote === 'against' ? p.votesAgainst + 1 : p.votesAgainst,
    } : p),
  })),
}));

export const useGovernance = () => useGovernanceStore(useShallow(state => ({
  proposals: state.proposals,
  setProposals: state.setProposals,
  voteProposal: state.voteProposal,
})));
