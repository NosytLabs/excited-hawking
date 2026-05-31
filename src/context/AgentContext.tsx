import { createContext, useState, useMemo, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { websocketService } from '../services/websocket';
import { WSEvents } from '../types/events';
import type { PromptEvent, BalanceEvent, TreasuryEvent, TierEvent, LogEvent, GovernanceEvent, CreatureEvent, MemoryNewEvent, EmergenceEvent } from '../services/websocket';
import { api } from '../services/api';
import { getWalletMode, canVoteWithCurrentWallet, getVoteDisabledReason } from './walletMode';
import type { AgentState, PromptItem, LogItem, Proposal, AgentMemoryNode, Tier } from './agent-types';
import { initialAgentState } from './agent-types';
import { showToast } from '../lib/toast';

export type { Tier, PromptItem, LogItem, Proposal, AgentMemoryNode } from './agent-types';
export type { AgentState } from './agent-types';

const AgentContext = createContext<AgentState>(initialAgentState);

interface AgentProviderState {
  diemStaked: number;
  treasuryUSDC: number;
  tier: Tier;
  prompts: PromptItem[];
  logs: LogItem[];
  proposals: Proposal[];
  isConnected: boolean;
  backendAvailable: boolean;
  walletAddress: string | null;
  creatureStats: { vitality: number; momentum: number; coherence: number };
  creatureMood: 'anxious' | 'neutral' | 'happy' | 'ecstatic';
  totalPromptsProcessed: number;
  emergenceGrid: string[];
  emergenceGeneration: number;
  emergencePatterns: string[];
  agentMemoryNodes: AgentMemoryNode[];
  totalObservers: number;
  uptimeSeconds: number;
}

export const AgentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AgentProviderState>({
    diemStaked: 0,
    treasuryUSDC: 0,
    tier: 'Minimal',
    prompts: [],
    logs: [],
    proposals: [],
    isConnected: false,
    backendAvailable: websocketService.getConnectionStatus(),
    walletAddress: null,
    creatureStats: { vitality: 60, momentum: 50, coherence: 50 },
    creatureMood: 'neutral',
    totalPromptsProcessed: 0,
    emergenceGrid: [],
    emergenceGeneration: 0,
    emergencePatterns: [],
    agentMemoryNodes: [],
    totalObservers: 127,
    uptimeSeconds: 0,
  });

  const logsIdCounter = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const voteProposalRollbackRef = useRef<Map<string, Proposal>>(new Map());

  const walletMode = useMemo(() => getWalletMode(), []);
  const canVote = useMemo(() => canVoteWithCurrentWallet(walletMode, state.walletAddress), [walletMode, state.walletAddress]);
  const voteDisabledReason = useMemo(() => getVoteDisabledReason(walletMode), [walletMode]);

  const handlersRef = useRef<Record<string, (data: unknown) => void>>({});

  useEffect(() => {
    abortControllerRef.current = new AbortController();

    const handleConnect = () => setState(prev => ({ ...prev, isConnected: true, backendAvailable: true }));
    const handleDisconnect = () => {
      setState(prev => ({ ...prev, isConnected: false, backendAvailable: false }));
      showToast('Backend disconnected. Attempting to reconnect...', 'warning');
    };
    const handleConnectError = () => {
      setState(prev => ({ ...prev, isConnected: false, backendAvailable: false }));
      showToast('Connection error. Retrying...', 'error');
    };
    const handlePromptNew = (event: PromptEvent) => {
      setState(prev => {
        const existing = prev.prompts.find(p => p.id === event.id);
        if (existing) return { ...prev, prompts: prev.prompts.map(p => p.id === event.id ? { ...p, ...event } : p) };
        const optimisticMatch = prev.prompts.find(p => p.id.startsWith('prompt-') && p.text === event.text && p.cost === event.cost && p.status === event.status);
        if (optimisticMatch) return { ...prev, prompts: prev.prompts.map(p => p.id === optimisticMatch.id ? { ...event } : p) };
        return { ...prev, prompts: [...prev.prompts, event as PromptItem] };
      });
    };
    const handleBalanceUpdate = (event: BalanceEvent) => setState(prev => ({ ...prev, diemStaked: event.diemStaked }));
    const handleTreasuryUpdate = (event: TreasuryEvent) => setState(prev => ({ ...prev, treasuryUSDC: event.treasuryUSDC }));
    const handleTierChange = (event: TierEvent) => setState(prev => ({ ...prev, tier: event.tier }));
    const handleLogNew = (event: LogEvent) => {
      setState(prev => ({ ...prev, logs: [...prev.logs.slice(-99), { ...event, id: `log-${logsIdCounter.current++}` }] }));
    };
    const handleGovernanceProposal = (event: GovernanceEvent) => {
      setState(prev => {
        const existing = prev.proposals.find(p => p.id === event.id);
        if (existing) return { ...prev, proposals: prev.proposals.map(p => p.id === event.id ? { ...p, ...event } : p) };
        return { ...prev, proposals: [...prev.proposals, event as Proposal] };
      });
    };
    const handleCreatureUpdate = (event: CreatureEvent) => {
      setState(prev => ({ ...prev, creatureStats: event.stats, creatureMood: event.mood, totalPromptsProcessed: event.totalPromptsProcessed }));
    };
    const handleEmergenceUpdate = (event: EmergenceEvent) => {
      const flatGrid: string[] = event.grid.flatMap(row => row.map(alive => (alive ? '1' : '')));
      setState(prev => ({ ...prev, emergenceGrid: flatGrid, emergenceGeneration: event.generation, emergencePatterns: event.patterns }));
    };
    const handleMemoryNew = (event: MemoryNewEvent) => {
      setState(prev => {
        const newNode: AgentMemoryNode = { id: event.id, type: event.type, content: event.content, timestamp: event.timestamp, connections: event.connections };
        const updated = [newNode, ...prev.agentMemoryNodes];
        return { ...prev, agentMemoryNodes: updated.length > 50 ? updated.slice(0, 50) : updated };
      });
    };
    handlersRef.current = {
      [WSEvents.CONNECT]: handleConnect,
      [WSEvents.DISCONNECT]: handleDisconnect,
      [WSEvents.CONNECT_ERROR]: handleConnectError,
      [WSEvents.PROMPT_NEW]: handlePromptNew as (data: unknown) => void,
      [WSEvents.BALANCE_UPDATE]: handleBalanceUpdate as (data: unknown) => void,
      [WSEvents.TREASURY_UPDATE]: handleTreasuryUpdate as (data: unknown) => void,
      [WSEvents.TIER_CHANGE]: handleTierChange as (data: unknown) => void,
      [WSEvents.LOG_NEW]: handleLogNew as (data: unknown) => void,
      [WSEvents.GOVERNANCE_PROPOSAL]: handleGovernanceProposal as (data: unknown) => void,
      [WSEvents.CREATURE_UPDATE]: handleCreatureUpdate as (data: unknown) => void,
      [WSEvents.EMERGENCE_UPDATE]: handleEmergenceUpdate as (data: unknown) => void,
      [WSEvents.MEMORY_NEW]: handleMemoryNew as (data: unknown) => void,
    } as Record<string, (data: unknown) => void>;

    websocketService.on(WSEvents.CONNECT, handlersRef.current[WSEvents.CONNECT]);
    websocketService.on(WSEvents.DISCONNECT, handlersRef.current[WSEvents.DISCONNECT]);
    websocketService.on(WSEvents.CONNECT_ERROR, handlersRef.current[WSEvents.CONNECT_ERROR]);
    websocketService.on(WSEvents.PROMPT_NEW, handlersRef.current[WSEvents.PROMPT_NEW]);
    websocketService.on(WSEvents.BALANCE_UPDATE, handlersRef.current[WSEvents.BALANCE_UPDATE]);
    websocketService.on(WSEvents.TREASURY_UPDATE, handlersRef.current[WSEvents.TREASURY_UPDATE]);
    websocketService.on(WSEvents.TIER_CHANGE, handlersRef.current[WSEvents.TIER_CHANGE]);
    websocketService.on(WSEvents.LOG_NEW, handlersRef.current[WSEvents.LOG_NEW]);
    websocketService.on(WSEvents.GOVERNANCE_PROPOSAL, handlersRef.current[WSEvents.GOVERNANCE_PROPOSAL]);
    websocketService.on(WSEvents.CREATURE_UPDATE, handlersRef.current[WSEvents.CREATURE_UPDATE]);
    websocketService.on(WSEvents.EMERGENCE_UPDATE, handlersRef.current[WSEvents.EMERGENCE_UPDATE]);
    websocketService.on(WSEvents.MEMORY_NEW, handlersRef.current[WSEvents.MEMORY_NEW]);

    websocketService.connect();

    const controller = abortControllerRef.current;

    Promise.all([
      api.getStatus(),
      fetch(`${window.location.origin}/api/emergence/state`, { signal: controller.signal }).then(r => r.json()),
      fetch(`${window.location.origin}/api/agent/memory?limit=20`, { signal: controller.signal }).then(r => r.json()),
    ]).then(([status, emergenceData, memoryData]) => {
      setState(prev => ({
        ...prev,
        diemStaked: status.diemStaked,
        treasuryUSDC: status.treasuryUSDC,
        tier: status.tier as Tier,
        emergenceGrid: (emergenceData as { grid?: boolean[][]; generation?: number; patterns?: string[] }).grid
          ? (emergenceData as { grid: boolean[][]; generation: number; patterns: string[] }).grid.flatMap((row: boolean[]) => row.map((alive: boolean) => (alive ? '1' : '')))
          : [],
        emergenceGeneration: (emergenceData as { grid?: boolean[][]; generation?: number }).generation ?? 0,
        emergencePatterns: (emergenceData as { grid: boolean[][]; generation: number; patterns: string[] }).patterns,
        agentMemoryNodes: ((memoryData as { memories?: Array<{ id: string; type: string; content: string; timestamp: number; connections?: string[] }> }).memories || []).map(m => ({
          id: m.id, type: m.type as AgentMemoryNode['type'], content: m.content, timestamp: m.timestamp, connections: m.connections || [],
        })),
      }));
    }).catch((err: unknown) => {
      if (!(err instanceof Error && err.name === 'AbortError')) {
        console.error('[AgentContext] Failed to fetch initial data:', err);
      }
    });

    return () => {
      abortControllerRef.current?.abort();
      websocketService.off(WSEvents.CONNECT, handlersRef.current[WSEvents.CONNECT]);
      websocketService.off(WSEvents.DISCONNECT, handlersRef.current[WSEvents.DISCONNECT]);
      websocketService.off(WSEvents.CONNECT_ERROR, handlersRef.current[WSEvents.CONNECT_ERROR]);
      websocketService.off(WSEvents.PROMPT_NEW, handlersRef.current[WSEvents.PROMPT_NEW]);
      websocketService.off(WSEvents.BALANCE_UPDATE, handlersRef.current[WSEvents.BALANCE_UPDATE]);
      websocketService.off(WSEvents.TREASURY_UPDATE, handlersRef.current[WSEvents.TREASURY_UPDATE]);
      websocketService.off(WSEvents.TIER_CHANGE, handlersRef.current[WSEvents.TIER_CHANGE]);
      websocketService.off(WSEvents.LOG_NEW, handlersRef.current[WSEvents.LOG_NEW]);
      websocketService.off(WSEvents.GOVERNANCE_PROPOSAL, handlersRef.current[WSEvents.GOVERNANCE_PROPOSAL]);
      websocketService.off(WSEvents.CREATURE_UPDATE, handlersRef.current[WSEvents.CREATURE_UPDATE]);
      websocketService.off(WSEvents.EMERGENCE_UPDATE, handlersRef.current[WSEvents.EMERGENCE_UPDATE]);
      websocketService.off(WSEvents.MEMORY_NEW, handlersRef.current[WSEvents.MEMORY_NEW]);
      websocketService.disconnect();
    };
  }, []);

  const addPrompt = useCallback((text: string, cost: number) => {
    const id = `prompt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const newPrompt: PromptItem = { id, user: 'You', text, votes: 1, cost, status: 'queued' };
    setState(prev => ({ ...prev, prompts: [...prev.prompts, newPrompt] }));
    if (state.backendAvailable) {
      api.submitPrompt(text).catch((err: unknown) => console.error('[AgentContext] submitPrompt failed:', err));
    }
  }, [state.backendAvailable]);

  const addLog = useCallback((message: string, type: LogItem['type'] = 'info') => {
    const newLog: LogItem = { id: `log-${logsIdCounter.current++}`, timestamp: new Date().toISOString(), message, type };
    setState(prev => ({ ...prev, logs: [...prev.logs.slice(-99), newLog] }));
  }, []);

  const votePrompt = useCallback(async (_id: string) => {
    if (!canVote) { console.warn(`[AgentContext] ${voteDisabledReason}`); showToast('Connect wallet to vote', 'warning'); return; }
    if (!state.walletAddress) { console.warn('[AgentContext] No wallet connected for voting'); return; }
    console.warn('[AgentContext] Prompt voting requires wallet signature - not yet implemented');
  }, [canVote, voteDisabledReason, state.walletAddress]);

  const voteProposal = useCallback((id: string, vote: 'for' | 'against' | 'abstain') => {
    if (!canVote) { console.warn(`[AgentContext] ${voteDisabledReason}`); showToast('Connect wallet to vote', 'warning'); return; }
    const rollback = voteProposalRollbackRef.current;
    setState(prev => {
      const original = prev.proposals.find(p => p.id === id);
      if (original) rollback.set(id, { ...original });
      return {
        ...prev,
        proposals: prev.proposals.map(p => p.id === id ? {
          ...p,
          votesFor: vote === 'for' ? p.votesFor + 1 : p.votesFor,
          votesAgainst: vote === 'against' ? p.votesAgainst + 1 : p.votesAgainst,
        } : p),
      };
    });
    if (state.backendAvailable) {
      api.voteOnProposal(id, vote).then(() => {
        rollback.delete(id);
      }).catch((err: unknown) => {
        console.error('[AgentContext] voteOnProposal failed:', err);
        const original = rollback.get(id);
        if (original) {
          setState(prev => ({ ...prev, proposals: prev.proposals.map(p => p.id === id ? original : p) }));
          rollback.delete(id);
        }
      });
    }
  }, [state.backendAvailable, canVote, voteDisabledReason]);

  const connectWallet = useCallback(async () => {
    if (state.walletAddress) {
      setState(prev => ({ ...prev, walletAddress: null, isConnected: false }));
      addLog('Wallet disconnected', 'info');
      return;
    }
    const ethereum = window.ethereum as { isMetaMask?: boolean; request: (args: { method: string; params?: unknown[] }) => Promise<unknown> } | undefined;
    if (ethereum) {
      try {
        const accounts = await ethereum.request({ method: 'eth_requestAccounts' }) as string[];
        if (accounts.length > 0) {
          const address = accounts[0];
          setState(prev => ({ ...prev, walletAddress: address, isConnected: true }));
          addLog(`Wallet connected: ${address.slice(0, 6)}...${address.slice(-4)}`, 'success');
          showToast(`Wallet connected: ${address.slice(0, 6)}...`, 'success');
        }
      } catch (err) {
        console.error('[AgentContext] MetaMask connection failed:', err);
        addLog('Failed to connect wallet', 'error');
        const errorMessage = err instanceof Error ? err.message : 'Connection rejected or failed';
        showToast(`Wallet error: ${errorMessage}`, 'error');
      }
    } else {
      addLog('MetaMask not detected', 'error');
      showToast('No wallet detected. Please install MetaMask.', 'warning');
    }
  }, [state.walletAddress, addLog]);

  const disconnectWallet = useCallback(() => {
    setState(prev => ({ ...prev, walletAddress: null, isConnected: false }));
    addLog('Wallet disconnected', 'info');
  }, [addLog]);

  const value = useMemo(() => ({
    diemStaked: state.diemStaked,
    treasuryUSDC: state.treasuryUSDC,
    tier: state.tier,
    prompts: state.prompts,
    logs: state.logs,
    canvasPixels: state.emergenceGrid,
    proposals: state.proposals,
    addPrompt,
    votePrompt,
    addLog,
    voteProposal,
    isConnected: state.isConnected,
    backendAvailable: state.backendAvailable,
    walletAddress: state.walletAddress,
    connectWallet,
    disconnectWallet,
    setProposals: (value: Proposal[] | ((prev: Proposal[]) => Proposal[])) => {
      if (typeof value === 'function') {
        setState(prev => ({ ...prev, proposals: value(prev.proposals) }));
      } else {
        setState(prev => ({ ...prev, proposals: value }));
      }
    },
    walletMode,
    creatureStats: state.creatureStats,
    creatureMood: state.creatureMood,
    totalPromptsProcessed: state.totalPromptsProcessed,
    canVote,
    voteDisabledReason,
    emergenceGeneration: state.emergenceGeneration,
    emergencePatterns: state.emergencePatterns,
    agentMemoryNodes: state.agentMemoryNodes,
    totalObservers: state.totalObservers,
    uptimeSeconds: state.uptimeSeconds,
  }), [state, addPrompt, votePrompt, addLog, voteProposal, connectWallet, disconnectWallet, walletMode, canVote, voteDisabledReason]);

  return (
    <AgentContext.Provider value={value}>
      {children}
    </AgentContext.Provider>
  );
};

export { AgentContext };
