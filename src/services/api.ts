const BASE_URL = import.meta.env.VITE_API_URL || window.location.origin;

type StatusResponse = {
  diemStaked: number;
  treasuryUSDC: number;
  tier: string;
  connected: boolean;
};

type ApiStatusEnvelope = {
  agent: {
    diemStaked: number;
    treasuryUSDC: number;
    tier: string;
    status: string;
    uptime: number;
    version: string;
  };
  wallet: string;
  balance: string;
  timestamp: number;
};

interface QueueResponse {
  prompts: Array<{
    id: string;
    user: string;
    text: string;
    votes: number;
    cost: number;
    status: 'queued' | 'processing' | 'done';
  }>;
}

interface LogsResponse {
  logs: Array<{
    id: string;
    timestamp: string;
    message: string;
    type: 'info' | 'action' | 'success' | 'warning' | 'error';
  }>;
  total?: number;
}

type SignedVoteRequest = {
  promptId: string;
  vote: 'up' | 'down';
  walletAddress: string;
  signature: string;
  nonce: string;
  wallet?: string;
};

interface Proposal {
  id: string;
  title: string;
  votesFor: number;
  votesAgainst: number;
  status: 'active' | 'passed' | 'failed';
}

interface ProposalsResponse {
  proposals: Proposal[];
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

export async function voteOnPrompt(promptId: string, vote: 'up' | 'down', walletAddress: string, signature: string, nonce: string): Promise<{ success: boolean; newVoteCount: number }> {
  return fetchJson(`${BASE_URL}/api/vote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-wallet-address': walletAddress,
      'x-signature': signature,
      'x-nonce': nonce,
    },
    body: JSON.stringify({ promptId, vote }),
  });
}

function normalizeStatusResponse(payload: ApiStatusEnvelope): StatusResponse {
  return {
    diemStaked: payload.agent.diemStaked,
    treasuryUSDC: payload.agent.treasuryUSDC,
    tier: payload.agent.tier,
    connected: payload.wallet !== 'anonymous',
  };
}

async function vote(request: SignedVoteRequest): Promise<{ success: boolean }>;
async function vote(promptId: string, vote: 'for' | 'against'): Promise<{ success: boolean }>;
async function vote(requestOrPromptId: SignedVoteRequest | string, legacyVote?: 'for' | 'against'): Promise<{ success: boolean }> {
  if (typeof requestOrPromptId === 'string') {
    return fetchJson<{ success: boolean }>(`${BASE_URL}/api/vote`, {
      method: 'POST',
      body: JSON.stringify({
        promptId: requestOrPromptId,
        vote: legacyVote === 'against' ? 'down' : 'up',
      }),
    });
  }

  const { promptId, vote, walletAddress, signature, nonce, wallet } = requestOrPromptId;

  return fetchJson<{ success: boolean }>(`${BASE_URL}/api/vote`, {
    method: 'POST',
    headers: {
      'x-wallet-address': walletAddress,
      'x-signature': signature,
      'x-nonce': nonce,
    },
    body: JSON.stringify({ promptId, vote, wallet }),
  });
}

export const api = {
  async getStatus(): Promise<StatusResponse> {
    const payload = await fetchJson<ApiStatusEnvelope>(`${BASE_URL}/api/status`);
    return normalizeStatusResponse(payload);
  },

  async submitPrompt(content: string): Promise<{ promptId: string }> {
    return fetchJson<{ promptId: string }>(`${BASE_URL}/api/prompt`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  async getQueue(): Promise<QueueResponse> {
    return fetchJson<QueueResponse>(`${BASE_URL}/api/queue`);
  },

  vote,

  async getLogs(): Promise<LogsResponse> {
    return fetchJson<LogsResponse>(`${BASE_URL}/api/logs/list`);
  },

  async getGovernanceProposals(): Promise<ProposalsResponse> {
    return fetchJson<ProposalsResponse>(`${BASE_URL}/api/governance/proposals`);
  },

  async createProposal(title: string, description: string, category: string, deposit: number): Promise<{ proposalId: string }> {
    return fetchJson<{ proposalId: string }>(`${BASE_URL}/api/governance/proposal`, {
      method: 'POST',
      body: JSON.stringify({ title, description, category, deposit: deposit.toString() }),
    });
  },

  async voteOnProposal(proposalId: string, vote: 'for' | 'against' | 'abstain'): Promise<{ success: boolean }> {
    return fetchJson<{ success: boolean }>(`${BASE_URL}/api/governance/proposals/${proposalId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ vote }),
    });
  },

  async delegateStake(delegateAddress: string, power?: string): Promise<{ success: boolean; delegation?: unknown }> {
    return fetchJson<{ success: boolean; delegation?: unknown }>(`${BASE_URL}/api/governance/delegate`, {
      method: 'POST',
      body: JSON.stringify({ delegate: delegateAddress, power }),
    });
  },
};

export { normalizeStatusResponse };
export type { StatusResponse, ApiStatusEnvelope, SignedVoteRequest, QueueResponse, LogsResponse, ProposalsResponse, Proposal };
