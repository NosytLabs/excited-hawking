const BASE_URL = 'http://localhost:3001';

interface StatusResponse {
  diemStaked: number;
  treasuryUSDC: number;
  tier: string;
  connected: boolean;
}

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
}

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

export const api = {
  async getStatus(): Promise<StatusResponse> {
    return fetchJson<StatusResponse>(`${BASE_URL}/api/status`);
  },

  async submitPrompt(content: string): Promise<{ promptId: string }> {
    return fetchJson<{ promptId: string }>(`${BASE_URL}/api/prompts`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  async getQueue(): Promise<QueueResponse> {
    return fetchJson<QueueResponse>(`${BASE_URL}/api/queue`);
  },

  async vote(promptId: string, vote: 'for' | 'against'): Promise<{ success: boolean }> {
    return fetchJson<{ success: boolean }>(`${BASE_URL}/api/prompts/${promptId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ vote }),
    });
  },

  async getLogs(): Promise<LogsResponse> {
    return fetchJson<LogsResponse>(`${BASE_URL}/api/logs`);
  },

  async getGovernanceProposals(): Promise<ProposalsResponse> {
    return fetchJson<ProposalsResponse>(`${BASE_URL}/api/governance/proposals`);
  },

  async createProposal(title: string, description: string): Promise<{ proposalId: string }> {
    return fetchJson<{ proposalId: string }>(`${BASE_URL}/api/governance/proposals`, {
      method: 'POST',
      body: JSON.stringify({ title, description }),
    });
  },

  async voteOnProposal(proposalId: string, vote: 'for' | 'against'): Promise<{ success: boolean }> {
    return fetchJson<{ success: boolean }>(`${BASE_URL}/api/governance/proposals/${proposalId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ vote }),
    });
  },
};

export type { StatusResponse, QueueResponse, LogsResponse, ProposalsResponse, Proposal };