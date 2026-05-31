import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useEffect } from 'react';
import type { AgentState, Proposal } from './AgentContext';
import { AgentProvider } from './AgentContext';
import { useAgent } from './useAgent';
import { WSEvents } from '../types/events';
import { usePromptsStore } from '../stores/promptsStore';
import { useGovernanceStore } from '../stores/governanceStore';
import { useConnectionStore } from '../stores/connectionStore';
import { useLogsStore } from '../stores/logsStore';
import { useEmergenceStore } from '../stores/emergenceStore';
import { useCreatureStore } from '../stores/creatureStore';
import { useAgentMetaStore } from '../stores/agentMetaStore';

const websocketMock = vi.hoisted(() => {
  const handlers = new Map<string, Set<(data: unknown) => void>>();

  const on = vi.fn((event: string, handler: (data: unknown) => void) => {
    if (!handlers.has(event)) {
      handlers.set(event, new Set());
    }
    handlers.get(event)?.add(handler);
  });

  const off = vi.fn((event: string, handler?: (data: unknown) => void) => {
    if (handler) {
      const eventHandlers = handlers.get(event);
      eventHandlers?.delete(handler);
      if (eventHandlers?.size === 0) {
        handlers.delete(event);
      }
      return;
    }

    handlers.delete(event);
  });

  return {
    connect: vi.fn(),
    disconnect: vi.fn(),
    emit: vi.fn(),
    getConnectionStatus: vi.fn(() => false),
    on,
    off,
    emitEvent(event: string, data: unknown) {
      handlers.get(event)?.forEach((handler) => handler(data));
    },
    reset() {
      handlers.clear();
      this.connect.mockClear();
      this.disconnect.mockClear();
      this.emit.mockClear();
      this.getConnectionStatus.mockReset();
      this.getConnectionStatus.mockReturnValue(false);
      on.mockClear();
      off.mockClear();
    },
  };
});

const apiMock = vi.hoisted(() => ({
  submitPrompt: vi.fn(async () => ({ promptId: 'server-1' })),
  voteOnProposal: vi.fn(async () => ({ success: true })),
  getStatus: vi.fn(async () => ({ diemStaked: 0, treasuryUSDC: 0, tier: 'Minimal', connected: false })),
}));

const fetchMock = vi.hoisted(() => vi.fn(async (url: string) => {
  if (typeof url === 'string' && url.includes('/api/emergence/state')) {
    return { ok: true, json: async () => ({ grid: [], generation: 0, patterns: [] }) };
  }
  if (typeof url === 'string' && url.includes('/api/agent/memory')) {
    return { ok: true, json: async () => ({ memories: [] }) };
  }
  return { ok: true, json: async () => ({}) };
}));

vi.mock('../services/websocket', () => ({
  websocketService: websocketMock,
}));

vi.mock('../services/api', () => ({
  api: apiMock,
}));

vi.stubGlobal('fetch', fetchMock);

const latestAgentRef = { current: null as AgentState | null };

function AgentHarness() {
  const agent = useAgent();
  useEffect(() => { latestAgentRef.current = agent; }, [agent]);

  return (
    <>
      <div data-testid="prompt-count">{agent.prompts.length}</div>
      <div data-testid="prompt-ids">{agent.prompts.map((prompt) => prompt.id).join(',')}</div>
      <div data-testid="proposal-votes-for">{agent.proposals[0]?.votesFor ?? 0}</div>
    </>
  );
}

function renderAgentProvider() {
  return render(
    <AgentProvider>
      <AgentHarness />
    </AgentProvider>
  );
}

describe('AgentProvider', () => {
  beforeEach(() => {
    websocketMock.reset();
    apiMock.submitPrompt.mockClear();
    apiMock.voteOnProposal.mockClear();
    apiMock.getStatus.mockClear();
    fetchMock.mockClear();
    latestAgentRef.current = null;
    usePromptsStore.setState({ prompts: [] });
    useGovernanceStore.setState({ proposals: [] });
    useConnectionStore.setState({ isConnected: false, backendAvailable: false, walletAddress: null });
    useLogsStore.setState({ logs: [] });
    useEmergenceStore.setState({ emergenceGrid: [], emergenceGeneration: 0, emergencePatterns: [] });
    useCreatureStore.setState({ creatureStats: { vitality: 60, momentum: 50, coherence: 50 }, creatureMood: 'neutral', totalPromptsProcessed: 0 });
    useAgentMetaStore.setState({ diemStaked: 0, treasuryUSDC: 0, tier: 'Minimal' });
  });

  it('should reconcile an optimistic prompt when the backend echoes the same prompt with a server id', async () => {
    renderAgentProvider();

    await act(async () => {
      websocketMock.emitEvent(WSEvents.CONNECT, undefined);
    });

    await act(async () => {
      latestAgentRef.current?.addPrompt('hello world', 0.25);
    });

    expect(screen.getByTestId('prompt-count')).toHaveTextContent('1');

    await act(async () => {
      websocketMock.emitEvent(WSEvents.PROMPT_NEW, {
        id: 'server-1',
        user: 'You',
        text: 'hello world',
        votes: 1,
        cost: 0.25,
        status: 'queued',
      });
    });

    expect(screen.getByTestId('prompt-count')).toHaveTextContent('1');
    expect(screen.getByTestId('prompt-ids')).toHaveTextContent('server-1');
  });

  it('should not optimistically vote on proposals in preview mode', async () => {
    renderAgentProvider();

    await act(async () => {
      websocketMock.emitEvent(WSEvents.CONNECT, undefined);
    });

    const proposal: Proposal = {
      id: 'proposal-1',
      title: 'Test proposal',
      votesFor: 2,
      votesAgainst: 1,
      status: 'active',
    };

    await act(async () => {
      latestAgentRef.current?.setProposals([proposal]);
    });

    expect(screen.getByTestId('proposal-votes-for')).toHaveTextContent('2');

    await act(async () => {
      latestAgentRef.current?.voteProposal('proposal-1', 'for');
    });

    expect(screen.getByTestId('proposal-votes-for')).toHaveTextContent('2');
    expect(apiMock.voteOnProposal).not.toHaveBeenCalled();
  });
});
