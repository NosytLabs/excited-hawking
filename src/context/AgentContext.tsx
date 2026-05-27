import { createContext, useState, useMemo, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { websocketService } from '../services/websocket';
import { WSEvents } from '../types/events';
import type { PromptEvent, BalanceEvent, TreasuryEvent, TierEvent, LogEvent, GovernanceEvent, CreatureEvent } from '../services/websocket';
import { api } from '../services/api';
import { getWalletMode, canVoteWithCurrentWallet, getVoteDisabledReason } from './walletMode';
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
  description?: string;
  votesFor: number;
  votesAgainst: number;
  status: 'active' | 'passed' | 'failed';
  votingEnd?: number;
  category?: string;
  proposer?: string;
  depositAmount?: number;
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
  connectWallet: (wallet: string) => void;
  disconnectWallet: () => void;
  setProposals: React.Dispatch<React.SetStateAction<Proposal[]>>;
  walletMode: WalletMode;
  creatureStats: { vitality: number; momentum: number; coherence: number };
  creatureMood: 'anxious' | 'neutral' | 'happy' | 'ecstatic';
  totalPromptsProcessed: number;
  canVote: boolean;
  voteDisabledReason: string;
}

const initialState: AgentState = {
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
};

// eslint-disable-next-line react-refresh/only-export-components
export const AgentContext = createContext<AgentState>(initialState);

export const AgentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [diemStaked, setDiemStaked] = useState(0);
  const [treasuryUSDC, setTreasuryUSDC] = useState(0);
  const [tier, setTier] = useState<Tier>('Minimal');
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState(() => websocketService.getConnectionStatus());
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const logsIdCounter = useRef(0);

  const [creatureStats, setCreatureStats] = useState({ vitality: 60, momentum: 50, coherence: 50 });
  const [creatureMood, setCreatureMood] = useState<'anxious' | 'neutral' | 'happy' | 'ecstatic'>('neutral');
  const [totalPromptsProcessed, setTotalPromptsProcessed] = useState(0);

  const walletMode = useMemo(() => getWalletMode(), []);
  const canVote = useMemo(() => canVoteWithCurrentWallet(walletMode, walletAddress), [walletMode, walletAddress]);
  const voteDisabledReason = useMemo(() => getVoteDisabledReason(walletMode), [walletMode]);

  useEffect(() => {
    const handleConnect = () => {
      setIsConnected(true);
      setBackendAvailable(true);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setBackendAvailable(false);
    };

    const handleConnectError = () => {
      setIsConnected(false);
      setBackendAvailable(false);
    };

    const handlePromptEvent = (event: PromptEvent) => {
      setPrompts(prev => {
        const existing = prev.find(p => p.id === event.id);
        if (existing) {
          return prev.map(p => p.id === event.id ? { ...p, ...event } : p);
        }

        const optimisticMatch = prev.find(p =>
          p.id.startsWith('prompt-') &&
          p.text === event.text &&
          p.cost === event.cost &&
          p.status === event.status
        );

        if (optimisticMatch) {
          return prev.map(p => p.id === optimisticMatch.id ? { ...event } : p);
        }

        return [...prev, event as PromptItem];
      });
    };

    const handleBalance = (event: BalanceEvent) => {
      setDiemStaked(event.diemStaked);
    };

    const handleTreasury = (event: TreasuryEvent) => {
      setTreasuryUSDC(event.treasuryUSDC);
    };

    const handleTier = (event: TierEvent) => {
      setTier(event.tier);
    };

    const handleLog = (event: LogEvent) => {
      setLogs(prev => [...prev.slice(-99), { ...event, id: `log-${logsIdCounter.current++}` }]);
    };

    const handleGovernance = (event: GovernanceEvent) => {
      setProposals(prev => {
        const existing = prev.find(p => p.id === event.id);
        if (existing) {
          return prev.map(p => p.id === event.id ? { ...p, ...event } : p);
        }
        return [...prev, event as Proposal];
      });
    };

    const handleCreatureUpdate = (event: CreatureEvent) => {
      setCreatureStats(event.stats);
      setCreatureMood(event.mood);
      setTotalPromptsProcessed(event.totalPromptsProcessed);
    };

    websocketService.on(WSEvents.CONNECT, handleConnect);
    websocketService.on(WSEvents.DISCONNECT, handleDisconnect);
    websocketService.on(WSEvents.CONNECT_ERROR, handleConnectError);
    websocketService.on(WSEvents.PROMPT_NEW, handlePromptEvent);
    websocketService.on(WSEvents.BALANCE_UPDATE, handleBalance);
    websocketService.on(WSEvents.TREASURY_UPDATE, handleTreasury);
    websocketService.on(WSEvents.TIER_CHANGE, handleTier);
    websocketService.on(WSEvents.LOG_NEW, handleLog);
    websocketService.on(WSEvents.GOVERNANCE_PROPOSAL, handleGovernance);
    websocketService.on(WSEvents.CREATURE_UPDATE, handleCreatureUpdate);

    websocketService.connect();

    return () => {
      websocketService.off(WSEvents.CONNECT, handleConnect);
      websocketService.off(WSEvents.DISCONNECT, handleDisconnect);
      websocketService.off(WSEvents.CONNECT_ERROR, handleConnectError);
      websocketService.off(WSEvents.PROMPT_NEW, handlePromptEvent);
      websocketService.off(WSEvents.BALANCE_UPDATE, handleBalance);
      websocketService.off(WSEvents.TREASURY_UPDATE, handleTreasury);
      websocketService.off(WSEvents.TIER_CHANGE, handleTier);
      websocketService.off(WSEvents.LOG_NEW, handleLog);
      websocketService.off(WSEvents.GOVERNANCE_PROPOSAL, handleGovernance);
      websocketService.off(WSEvents.CREATURE_UPDATE, handleCreatureUpdate);
    };
  }, []);

  const addPrompt = useCallback((text: string, cost: number) => {
    const id = `prompt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const newPrompt: PromptItem = { id, user: 'You', text, votes: 1, cost, status: 'queued' };
    setPrompts(prev => [...prev, newPrompt]);
    if (backendAvailable) {
      api.submitPrompt(text).catch((err: unknown) => console.error('[AgentContext] submitPrompt failed:', err));
    }
  }, [backendAvailable]);

  const votePrompt = useCallback((id: string) => {
    if (!canVote) {
      console.warn(`[AgentContext] ${voteDisabledReason}`);
      return;
    }
    
    // In preview mode, even if canVote were somehow true, we wouldn't have signed credentials.
    console.warn(`[AgentContext] Signed wallet voting is not available for prompt ${id} in this preview.`);
  }, [canVote, voteDisabledReason]);

  const addLog = useCallback((message: string, type: LogItem['type'] = 'info') => {
    const newLog: LogItem = {
      id: `log-${logsIdCounter.current++}`,
      timestamp: new Date().toISOString(),
      message,
      type,
    };
    setLogs(prev => [...prev.slice(-99), newLog]);
  }, []);

  const voteProposalRef = useRef<Map<string, Proposal>>(new Map());

  const voteProposal = useCallback((id: string, vote: 'for' | 'against' | 'abstain') => {
    if (!canVote) {
      console.warn(`[AgentContext] ${voteDisabledReason}`);
      return;
    }

    setProposals(prev => {
      const original = prev.find(p => p.id === id);
      if (original) {
        voteProposalRef.current.set(id, { ...original });
      }
      return prev.map(p => {
        if (p.id === id) {
          return {
            ...p,
            votesFor: vote === 'for' ? p.votesFor + 1 : p.votesFor,
            votesAgainst: vote === 'against' ? p.votesAgainst + 1 : p.votesAgainst,
          };
        }
        return p;
      });
    });
    if (backendAvailable) {
      api.voteOnProposal(id, vote).catch((err: unknown) => {
        console.error('[AgentContext] voteOnProposal failed:', err);
        const original = voteProposalRef.current.get(id);
        if (original) {
          setProposals(prev => prev.map(p => p.id === id ? original : p));
          voteProposalRef.current.delete(id);
        }
      });
    }
  }, [backendAvailable, canVote, voteDisabledReason]);

  const connectWallet = useCallback((wallet: string) => {
    setWalletAddress(wallet);
    setIsConnected(true);
    addLog(`Wallet connected: ${wallet.slice(0, 6)}...${wallet.slice(-4)}`, 'success');
  }, [addLog]);

  const disconnectWallet = useCallback(() => {
    setWalletAddress(null);
    setIsConnected(false);
    addLog('Wallet disconnected', 'info');
  }, [addLog]);

  const value = useMemo(() => ({
    diemStaked,
    treasuryUSDC,
    tier,
    prompts,
    logs,
    canvasPixels: [] as string[],
    proposals,
    addPrompt,
    votePrompt,
    addLog,
    voteProposal,
    isConnected,
    backendAvailable,
    walletAddress,
    connectWallet,
    disconnectWallet,
    setProposals,
    walletMode,
    creatureStats,
    creatureMood,
    totalPromptsProcessed,
    canVote,
    voteDisabledReason,
  }), [diemStaked, treasuryUSDC, tier, prompts, logs, proposals, addPrompt, votePrompt, addLog, voteProposal, isConnected, backendAvailable, walletAddress, connectWallet, disconnectWallet, walletMode, canVote, voteDisabledReason, creatureStats, creatureMood, totalPromptsProcessed]);

  return (
    <AgentContext.Provider value={value}>
      {children}
    </AgentContext.Provider>
  );
};
