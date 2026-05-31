import { createContext, useMemo, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { websocketService } from '../services/websocket';
import { WSEvents } from '../types/events';
import type { PromptEvent, BalanceEvent, TreasuryEvent, TierEvent, LogEvent, GovernanceEvent, CreatureEvent, MemoryNewEvent, EmergenceEvent } from '../services/websocket';
import { api } from '../services/api';
import { getWalletMode, canVoteWithCurrentWallet, getVoteDisabledReason } from './walletMode';
import type { AgentState, PromptItem, LogItem, Proposal, AgentMemoryNode, Tier } from './agent-types';
import { initialAgentState } from './agent-types';
import { showToast } from '../lib/toast';
import { useConnectionStore } from '../stores/connectionStore';
import { usePromptsStore } from '../stores/promptsStore';
import { useLogsStore } from '../stores/logsStore';
import { useGovernanceStore } from '../stores/governanceStore';
import { useEmergenceStore } from '../stores/emergenceStore';
import { useCreatureStore } from '../stores/creatureStore';
import { useAgentMetaStore } from '../stores/agentMetaStore';

export type { Tier, PromptItem, LogItem, Proposal, AgentMemoryNode } from './agent-types';
export type { AgentState } from './agent-types';

const AgentContext = createContext<AgentState>(initialAgentState);

export const AgentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const logsIdCounter = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const voteProposalRollbackRef = useRef<Map<string, Proposal>>(new Map());

  const connectionStore = useConnectionStore();
  const promptsStore = usePromptsStore();
  const logsStore = useLogsStore();
  const governanceStore = useGovernanceStore();
  const emergenceStore = useEmergenceStore();
  const creatureStore = useCreatureStore();
  const agentMetaStore = useAgentMetaStore();

  const walletMode = useMemo(() => getWalletMode(), []);
  const canVote = useMemo(() => canVoteWithCurrentWallet(walletMode, connectionStore.walletAddress), [walletMode, connectionStore.walletAddress]);
  const voteDisabledReason = useMemo(() => getVoteDisabledReason(walletMode), [walletMode]);

  const handlersRef = useRef<Record<string, (data: unknown) => void>>({});

  useEffect(() => {
    abortControllerRef.current = new AbortController();

    const handleConnect = () => {
      connectionStore.setConnected(true, true);
      websocketService.emit('emergence:subscribe', {});
    };
    const handleDisconnect = () => {
      connectionStore.setConnected(false, false);
      showToast('Backend disconnected. Attempting to reconnect...', 'warning');
    };
    const handleConnectError = () => {
      connectionStore.setConnected(false, false);
      showToast('Connection error. Retrying...', 'error');
    };
    const handlePromptNew = (event: PromptEvent) => {
      const currentPrompts = usePromptsStore.getState().prompts;
      const existing = currentPrompts.find(p => p.id === event.id);
      if (existing) {
        promptsStore.updatePrompt(event.id, event);
        return;
      }
      const optimisticMatch = currentPrompts.find(p => p.id.startsWith('prompt-') && p.text === event.text && p.cost === event.cost && p.status === event.status);
      if (optimisticMatch) {
        promptsStore.updatePrompt(optimisticMatch.id, event);
        return;
      }
      promptsStore.addPrompt(event as PromptItem);
    };
    const handleBalanceUpdate = (event: BalanceEvent) => {
      agentMetaStore.setMeta(event.diemStaked, agentMetaStore.treasuryUSDC, agentMetaStore.tier);
    };
    const handleTreasuryUpdate = (event: TreasuryEvent) => {
      agentMetaStore.setMeta(agentMetaStore.diemStaked, event.treasuryUSDC, agentMetaStore.tier);
    };
    const handleTierChange = (event: TierEvent) => {
      agentMetaStore.setMeta(agentMetaStore.diemStaked, agentMetaStore.treasuryUSDC, event.tier as Tier);
    };
    const handleLogNew = (event: LogEvent) => {
      logsStore.addLog({ ...event, id: `log-${logsIdCounter.current++}` });
    };
    const handleGovernanceProposal = (event: GovernanceEvent) => {
      const existing = governanceStore.proposals.find(p => p.id === event.id);
      if (existing) {
        governanceStore.setProposals(prev => prev.map(p => p.id === event.id ? { ...p, ...event } : p));
        return;
      }
      governanceStore.setProposals(prev => [...prev, event as Proposal]);
    };
    const handleCreatureUpdate = (event: CreatureEvent) => {
      creatureStore.setCreature(event.stats, event.mood, event.totalPromptsProcessed);
    };
    const handleEmergenceUpdate = (event: EmergenceEvent) => {
      const rawGrid = event.grid;
      const flatGrid: string[] = Array.isArray(rawGrid) && rawGrid.length > 0 && Array.isArray(rawGrid[0])
        ? (rawGrid as boolean[][]).flatMap(row => row.map((alive: boolean) => (alive ? '1' : '')))
        : (rawGrid as unknown as (number | boolean)[]).map(v => (v ? '1' : ''));
      emergenceStore.setEmergence(flatGrid, event.generation, event.patterns);
    };
    const handleEmergenceGrid = (event: { grid: number[]; generation: number }) => {
      const flatGrid: string[] = event.grid.map(v => (v ? '1' : ''));
      emergenceStore.setEmergence(flatGrid, event.generation, emergenceStore.emergencePatterns);
    };
    const handleMemoryNew = (_event: MemoryNewEvent) => {};
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
      [WSEvents.EMERGENCE_GRID]: handleEmergenceGrid as (data: unknown) => void,
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
    websocketService.on(WSEvents.EMERGENCE_GRID, handlersRef.current[WSEvents.EMERGENCE_GRID]);
    websocketService.on(WSEvents.MEMORY_NEW, handlersRef.current[WSEvents.MEMORY_NEW]);

    websocketService.connect();

    const controller = abortControllerRef.current;

    Promise.all([
      api.getStatus(),
      fetch(`${window.location.origin}/api/emergence/state`, { signal: controller.signal }).then(r => r.json()),
      fetch(`${window.location.origin}/api/agent/memory?limit=20`, { signal: controller.signal }).then(r => r.json()),
    ]).then(([status, emergenceData, _memoryData]) => {
      const rawGrid = (emergenceData as { grid?: boolean[] | boolean[][] | number[] }).grid;
      const emergenceGrid: string[] = Array.isArray(rawGrid)
        ? (rawGrid.length > 0 && Array.isArray(rawGrid[0])
            ? (rawGrid as boolean[][]).flatMap((row: boolean[]) => row.map((alive: boolean) => (alive ? '1' : '')))
            : (rawGrid as unknown as (number | boolean)[]).map(v => (v ? '1' : '')))
        : [];
      agentMetaStore.setMeta(status.diemStaked, status.treasuryUSDC, status.tier as Tier);
      emergenceStore.setEmergence(
        emergenceGrid,
        (emergenceData as { grid?: boolean[] | boolean[][] | number[]; generation?: number }).generation ?? 0,
        (emergenceData as { patterns?: string[] }).patterns ?? []
      );
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
    promptsStore.addPrompt(newPrompt);
    if (connectionStore.backendAvailable) {
      api.submitPrompt(text).catch((err: unknown) => console.error('[AgentContext] submitPrompt failed:', err));
    }
  }, [connectionStore.backendAvailable]);

  const addLog = useCallback((message: string, type: LogItem['type'] = 'info') => {
    const newLog: LogItem = { id: `log-${logsIdCounter.current++}`, timestamp: new Date().toISOString(), message, type };
    logsStore.addLog(newLog);
  }, []);

  const votePrompt = useCallback(async (_id: string) => {
    if (!canVote) { console.warn(`[AgentContext] ${voteDisabledReason}`); showToast('Connect wallet to vote', 'warning'); return; }
    if (!connectionStore.walletAddress) { console.warn('[AgentContext] No wallet connected for voting'); return; }
    console.warn('[AgentContext] Prompt voting requires wallet signature - not yet implemented');
  }, [canVote, voteDisabledReason, connectionStore.walletAddress]);

  const voteProposal = useCallback((id: string, vote: 'for' | 'against' | 'abstain') => {
    if (!canVote) { console.warn(`[AgentContext] ${voteDisabledReason}`); showToast('Connect wallet to vote', 'warning'); return; }
    const rollback = voteProposalRollbackRef.current;
    const original = governanceStore.proposals.find(p => p.id === id);
    if (original) rollback.set(id, { ...original });
    governanceStore.voteProposal(id, vote);
    if (connectionStore.backendAvailable) {
      api.voteOnProposal(id, vote, connectionStore.walletAddress ?? undefined, connectionStore.walletSignature, connectionStore.walletNonce).then(() => {
        rollback.delete(id);
      }).catch((err: unknown) => {
        console.error('[AgentContext] voteOnProposal failed:', err);
        const original = rollback.get(id);
        if (original) {
          governanceStore.setProposals(prev => prev.map(p => p.id === id ? original : p));
          rollback.delete(id);
        }
      });
    }
  }, [connectionStore.backendAvailable, canVote, voteDisabledReason, connectionStore.walletAddress, connectionStore.walletSignature, connectionStore.walletNonce]);

  const connectWallet = useCallback(async () => {
    if (connectionStore.walletAddress) {
      connectionStore.setWalletAddress(null);
      connectionStore.setWalletSignature(undefined);
      connectionStore.setWalletNonce(undefined);
      addLog('Wallet disconnected', 'info');
      return;
    }
    const ethereum = window.ethereum as { isMetaMask?: boolean; request: (args: { method: string; params?: unknown[] }) => Promise<unknown> } | undefined;
    if (ethereum) {
      try {
        const accounts = await ethereum.request({ method: 'eth_requestAccounts' }) as string[];
        if (accounts.length > 0) {
          const address = accounts[0];
          connectionStore.setWalletAddress(address);
          addLog(`Wallet connected: ${address.slice(0, 6)}...${address.slice(-4)}`, 'success');
          showToast(`Wallet connected: ${address.slice(0, 6)}...`, 'success');

          try {
            const challengeRes = await fetch('/api/auth/challenge', {
              headers: { 'x-wallet-address': address },
            });
            if (challengeRes.ok) {
              const { nonce, expiresAt } = await challengeRes.json() as { nonce: string; expiresAt: string };
              const message = `Sign this nonce to prove wallet ownership:\n${nonce}\n\nWallet: ${address}\nTimestamp: ${expiresAt}`;
              const signature = await ethereum.request({ method: 'personal_sign', params: [message, address] }) as string;
              connectionStore.setWalletSignature(signature);
              connectionStore.setWalletNonce(nonce);
              addLog('Wallet challenge signed', 'success');
            }
          } catch (challengeErr) {
            console.warn('[AgentContext] Failed to fetch/sign challenge, governance calls may fail:', challengeErr);
          }
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
  }, [connectionStore.walletAddress, addLog]);

  const disconnectWallet = useCallback(() => {
    connectionStore.setWalletAddress(null);
    addLog('Wallet disconnected', 'info');
  }, [addLog]);

  const value = useMemo(() => ({
    diemStaked: agentMetaStore.diemStaked,
    treasuryUSDC: agentMetaStore.treasuryUSDC,
    tier: agentMetaStore.tier,
    prompts: promptsStore.prompts,
    logs: logsStore.logs,
    canvasPixels: emergenceStore.emergenceGrid,
    proposals: governanceStore.proposals,
    addPrompt,
    votePrompt,
    addLog,
    voteProposal,
    isConnected: connectionStore.isConnected,
    backendAvailable: connectionStore.backendAvailable,
    walletAddress: connectionStore.walletAddress,
    connectWallet,
    disconnectWallet,
    setProposals: governanceStore.setProposals,
    walletMode,
    creatureStats: creatureStore.creatureStats,
    creatureMood: creatureStore.creatureMood,
    totalPromptsProcessed: creatureStore.totalPromptsProcessed,
    canVote,
    voteDisabledReason,
    emergenceGeneration: emergenceStore.emergenceGeneration,
    emergencePatterns: emergenceStore.emergencePatterns,
    agentMemoryNodes: [] as AgentMemoryNode[],
    totalObservers: 127,
    uptimeSeconds: 0,
  }), [agentMetaStore.diemStaked, agentMetaStore.treasuryUSDC, agentMetaStore.tier, promptsStore.prompts, logsStore.logs, governanceStore.proposals, emergenceStore.emergenceGrid, emergenceStore.emergenceGeneration, emergenceStore.emergencePatterns, creatureStore.creatureStats, creatureStore.creatureMood, creatureStore.totalPromptsProcessed, connectionStore.isConnected, connectionStore.backendAvailable, connectionStore.walletAddress, addPrompt, votePrompt, addLog, voteProposal, connectWallet, disconnectWallet, walletMode, canVote, voteDisabledReason]);

  return (
    <AgentContext.Provider value={value}>
      {children}
    </AgentContext.Provider>
  );
};

export { AgentContext };
