import { createContext, useState, useMemo, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { websocketService } from '../services/websocket';
import { WSEvents } from '../types/events';
import type { PromptEvent, BalanceEvent, TreasuryEvent, TierEvent, LogEvent, GovernanceEvent } from '../services/websocket';
import { api } from '../services/api';

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
  votesFor: number;
  votesAgainst: number;
  status: 'active' | 'passed' | 'failed';
}

interface AgentState {
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
}

const AgentContext = createContext<AgentState | undefined>(undefined);

export { AgentContext };

export type { AgentState };

const generateId = () => crypto.randomUUID();



export const AgentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [diemStaked, setDiemStaked] = useState<number>(0);
  const [treasuryUSDC, setTreasuryUSDC] = useState<number>(0);
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [canvasPixels] = useState<string[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const initRef = useRef(false);

  const timeoutIds = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const tryConnect = async () => {
      try {
        await api.getStatus();
        setBackendAvailable(true);
        websocketService.connect();
      } catch {
        setBackendAvailable(false);
        setIsConnected(false);
      }
    };

    tryConnect();

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    websocketService.on('connect', handleConnect);
    websocketService.on('disconnect', handleDisconnect);
    websocketService.on('connect_error', handleDisconnect);

    websocketService.on(WSEvents.PROMPT_NEW, (data: PromptEvent) => {
      setPrompts(prev => [...prev, { ...data, status: 'queued' }]);
    });

    websocketService.on(WSEvents.PROMPT_COMPLETE, (data: PromptEvent) => {
      setPrompts(prev => prev.map(p => p.id === data.id ? data : p));
    });

    websocketService.on(WSEvents.QUEUE_UPDATE, (data: PromptEvent[]) => {
      setPrompts(data);
    });

    websocketService.on(WSEvents.BALANCE_UPDATE, (data: BalanceEvent) => {
      setDiemStaked(data.diemStaked);
    });

    websocketService.on(WSEvents.TREASURY_UPDATE, (data: TreasuryEvent) => {
      setTreasuryUSDC(data.treasuryUSDC);
    });

    websocketService.on(WSEvents.TIER_CHANGE, (_data: TierEvent) => {
      // Tier is computed from diemStaked via useMemo - no direct action needed
    });

    websocketService.on(WSEvents.LOG_NEW, (data: LogEvent) => {
      setLogs(prev => [...prev, data]);
    });

    websocketService.on(WSEvents.GOVERNANCE_PROPOSAL, (data: GovernanceEvent) => {
      setProposals(prev => [...prev, data]);
    });

    websocketService.on(WSEvents.GOVERNANCE_VOTE, (data: GovernanceEvent) => {
      setProposals(prev => prev.map(p => p.id === data.id ? data : p));
    });

    websocketService.on(WSEvents.GOVERNANCE_CLOSE, (data: GovernanceEvent) => {
      setProposals(prev => prev.map(p => p.id === data.id ? data : p));
    });

    return () => {
      websocketService.off('connect');
      websocketService.off('disconnect');
      websocketService.off('connect_error');
      websocketService.off(WSEvents.PROMPT_NEW);
      websocketService.off(WSEvents.PROMPT_COMPLETE);
      websocketService.off(WSEvents.QUEUE_UPDATE);
      websocketService.off(WSEvents.BALANCE_UPDATE);
      websocketService.off(WSEvents.TREASURY_UPDATE);
      websocketService.off(WSEvents.TIER_CHANGE);
      websocketService.off(WSEvents.LOG_NEW);
      websocketService.off(WSEvents.GOVERNANCE_PROPOSAL);
      websocketService.off(WSEvents.GOVERNANCE_VOTE);
      websocketService.off(WSEvents.GOVERNANCE_CLOSE);
      websocketService.disconnect();
      timeoutIds.current.forEach(clearTimeout);
      timeoutIds.current = [];
    };
  }, []);

  const tier = useMemo<Tier>(() => {
    if (diemStaked > 500) return 'Thriving';
    if (diemStaked >= 10) return 'Surviving';
    if (diemStaked >= 0.1) return 'Minimal';
    return 'Dying';
  }, [diemStaked]);

  const addLog = useCallback((message: string, type: LogItem['type'] = 'info') => {
    setLogs(prev => [...prev, { id: generateId(), timestamp: new Date().toISOString(), message, type }]);
  }, []);

  const addPrompt = useCallback((text: string, cost: number) => {
    const newPrompt: PromptItem = {
      id: generateId(),
      user: 'You',
      text,
      votes: 1,
      cost,
      status: 'queued',
    };

    if (backendAvailable) {
      api.submitPrompt(text).catch(err => console.error('[AgentContext] submitPrompt failed:', err));
    } else {
      setPrompts(prev => [...prev, newPrompt]);
    }
  }, [backendAvailable]);

  const votePrompt = useCallback((id: string) => {
    if (backendAvailable) {
      api.vote(id, 'for').catch(err => console.error('[AgentContext] vote failed:', err));
    }
    setPrompts(prev => prev.map(p => p.id === id ? { ...p, votes: p.votes + 1 } : p));
  }, [backendAvailable]);

  const voteProposal = useCallback((id: string, vote: 'for' | 'against' | 'abstain') => {
    if (backendAvailable) {
      api.voteOnProposal(id, vote).catch(err => console.error('[AgentContext] voteOnProposal failed:', err));
    }
    setProposals(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          votesFor: vote === 'for' ? p.votesFor + 1 : p.votesFor,
          votesAgainst: vote === 'against' ? p.votesAgainst + 1 : p.votesAgainst,
        };
      }
      return p;
    }));
  }, [backendAvailable]);

  const connectWallet = useCallback((wallet: string) => {
    setWalletAddress(wallet);
  }, []);

  const disconnectWallet = useCallback(() => {
    setWalletAddress(null);
  }, []);

  return (
    <AgentContext.Provider
      value={{
        diemStaked,
        treasuryUSDC,
        tier,
        prompts,
        logs,
        canvasPixels,
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
      }}
    >
      {children}
    </AgentContext.Provider>
  );
};