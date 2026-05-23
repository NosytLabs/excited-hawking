import { createContext, useState, useMemo, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { websocketService } from '../services/websocket';
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
  voteProposal: (id: string, vote: 'for' | 'against') => void;
  isConnected: boolean;
}

const AgentContext = createContext<AgentState | undefined>(undefined);

export { AgentContext };

export type { AgentState };

const generateId = () => crypto.randomUUID();

const COLORS = ['#ef4444', '#00d992', '#0ea5e9', '#eab308'];

const MOCK_PROMPTS: PromptItem[] = [
  { id: generateId(), user: '0x12..34', text: 'Cross-reference ETH/USDC price on Uniswap', votes: 12, cost: 0.05, status: 'queued' },
  { id: generateId(), user: 'anon', text: 'Verify if Solana mainnet is up', votes: 8, cost: 0.02, status: 'queued' },
];

const MOCK_LOGS: LogItem[] = [
  { id: generateId(), timestamp: new Date().toISOString(), message: 'Agent initialized. Tier: Surviving.', type: 'info' },
];

const MOCK_PROPOSALS: Proposal[] = [
  { id: generateId(), title: 'Route 10% treasury to buy $VVV stake', votesFor: 145, votesAgainst: 12, status: 'active' },
  { id: generateId(), title: 'Increase prompt price floor to $0.05', votesFor: 89, votesAgainst: 210, status: 'active' },
];

export const AgentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [diemStaked, setDiemStaked] = useState<number>(12.5);
  const [treasuryUSDC, setTreasuryUSDC] = useState<number>(45.2);
  const [prompts, setPrompts] = useState<PromptItem[]>(MOCK_PROMPTS);
  const [logs, setLogs] = useState<LogItem[]>(MOCK_LOGS);
  const [canvasPixels, setCanvasPixels] = useState<string[]>(() => {
    return Array(400).fill('').map(() => Math.random() > 0.9 ? COLORS[Math.floor(Math.random() * COLORS.length)] : '');
  });
  const [proposals, setProposals] = useState<Proposal[]>(MOCK_PROPOSALS);
  const [isConnected, setIsConnected] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState(false);
  const initRef = useRef(false);

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

    websocketService.on('prompt:new', (data: PromptEvent) => {
      setPrompts(prev => [...prev, { ...data, status: 'queued' }]);
    });

    websocketService.on('prompt:complete', (data: PromptEvent) => {
      setPrompts(prev => prev.map(p => p.id === data.id ? data : p));
    });

    websocketService.on('queue:update', (data: PromptEvent[]) => {
      setPrompts(data);
    });

    websocketService.on('balance:update', (data: BalanceEvent) => {
      setDiemStaked(data.diemStaked);
    });

    websocketService.on('treasury:update', (data: TreasuryEvent) => {
      setTreasuryUSDC(data.treasuryUSDC);
    });

    websocketService.on('tier:change', (_data: TierEvent) => {
      // tier computed from diemStaked, no action needed
    });

    websocketService.on('log:new', (data: LogEvent) => {
      setLogs(prev => [...prev, data]);
    });

    websocketService.on('governance:proposal', (data: GovernanceEvent) => {
      setProposals(prev => [...prev, data]);
    });

    websocketService.on('governance:vote', (data: GovernanceEvent) => {
      setProposals(prev => prev.map(p => p.id === data.id ? data : p));
    });

    websocketService.on('governance:close', (data: GovernanceEvent) => {
      setProposals(prev => prev.map(p => p.id === data.id ? data : p));
    });

    return () => {
      websocketService.disconnect();
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
      api.submitPrompt(text).catch(() => {});
    }

    setPrompts(prev => [...prev, newPrompt]);
    setLogs(prev => [...prev, { id: generateId(), timestamp: new Date().toISOString(), message: `Received prompt: "${text}" via x402 payment ($${cost.toFixed(2)})`, type: 'info' }]);

    setCanvasPixels(prev => {
      const next = [...prev];
      const idx = Math.floor(Math.random() * 400);
      next[idx] = '#00d992';
      return next;
    });

    setTimeout(() => {
      setPrompts(prev => prev.map(p => p.id === newPrompt.id ? { ...p, status: 'processing' } : p));
      setLogs(prev => [...prev, { id: generateId(), timestamp: new Date().toISOString(), message: `Processing prompt: "${text}"`, type: 'action' }]);

      setTimeout(() => {
        setPrompts(prev => prev.map(p => p.id === newPrompt.id ? { ...p, status: 'done' } : p));
        setLogs(prev => [...prev, { id: generateId(), timestamp: new Date().toISOString(), message: `Completed prompt: "${text}". Earned fees.`, type: 'success' }]);
        setTreasuryUSDC(prev => prev + (cost * 0.5));
        setDiemStaked(prev => prev + (cost * 0.5));
      }, 3000);
    }, 2000);
  }, [backendAvailable]);

  const votePrompt = useCallback((id: string) => {
    if (backendAvailable) {
      api.vote(id, 'for').catch(() => {});
    }
    setPrompts(prev => prev.map(p => p.id === id ? { ...p, votes: p.votes + 1 } : p));
  }, [backendAvailable]);

  const voteProposal = useCallback((id: string, vote: 'for' | 'against') => {
    if (backendAvailable) {
      api.voteOnProposal(id, vote).catch(() => {});
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
      }}
    >
      {children}
    </AgentContext.Provider>
  );
};