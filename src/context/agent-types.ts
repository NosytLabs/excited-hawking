import type { Dispatch, SetStateAction } from 'react';
import type { WalletMode } from './walletMode';

export type Tier = 'Thriving' | 'Surviving' | 'Minimal' | 'Dying';

export interface PromptItem {
  id: string;
  user: string;
  text: string;
  votes: number;
  cost: number;
  status: 'queued' | 'processing' | 'done';
}

export interface LogItem {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'action' | 'success' | 'warning' | 'error';
}

export interface Proposal {
  id: string;
  title: string;
  status: 'active' | 'passed' | 'failed';
  votesFor: number;
  votesAgainst: number;
}

export interface AgentMemoryNode {
  id: string;
  type: 'interaction' | 'dream' | 'emergence' | 'social';
  content: string;
  timestamp: number;
  connections: string[];
}

export interface AgentState {
  diemStaked: number;
  treasuryUSDC: number;
  tier: Tier;
  prompts: PromptItem[];
  logs: LogItem[];
  canvasPixels: string[];
  proposals: Proposal[];
  addPrompt: (text: string, cost: number) => void;
  votePrompt: (id: string) => void;
  addLog: (message: string, type?: LogItem['type']) => void;
  voteProposal: (id: string, vote: 'for' | 'against' | 'abstain') => void;
  isConnected: boolean;
  backendAvailable: boolean;
  walletAddress: string | null;
  connectWallet: () => void;
  disconnectWallet: () => void;
  setProposals: Dispatch<SetStateAction<Proposal[]>>;
  walletMode: WalletMode;
  creatureStats: { vitality: number; momentum: number; coherence: number };
  creatureMood: 'anxious' | 'neutral' | 'happy' | 'ecstatic';
  totalPromptsProcessed: number;
  canVote: boolean;
  voteDisabledReason: string;
  emergenceGeneration: number;
  emergencePatterns: string[];
  agentMemoryNodes: AgentMemoryNode[];
  totalObservers: number;
  uptimeSeconds: number;
}

export const initialAgentState: AgentState = {
  diemStaked: 0,
  treasuryUSDC: 0,
  tier: 'Minimal',
  prompts: [],
  logs: [],
  canvasPixels: [],
  proposals: [],
  addPrompt: () => {},
  votePrompt: () => {},
  addLog: () => {},
  voteProposal: () => {},
  isConnected: false,
  backendAvailable: false,
  walletAddress: null,
  connectWallet: () => {},
  disconnectWallet: () => {},
  setProposals: () => {},
  walletMode: 'preview',
  creatureStats: { vitality: 60, momentum: 50, coherence: 50 },
  creatureMood: 'neutral',
  totalPromptsProcessed: 0,
  canVote: false,
  voteDisabledReason: '',
  emergenceGeneration: 0,
  emergencePatterns: [],
  agentMemoryNodes: [],
  totalObservers: 127,
  uptimeSeconds: 0,
};