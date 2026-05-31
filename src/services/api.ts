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

type SignedVoteRequest = {
  promptId: string;
  vote: 'up' | 'down';
  walletAddress: string;
  signature: string;
  nonce: string;
  wallet?: string;
};

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

  vote,

  async createProposal(title: string, description: string, category: string, deposit: number): Promise<{ proposalId: string }> {
    return fetchJson<{ success: boolean; proposal: { id: string } }>(`${BASE_URL}/api/governance/proposal`, {
      method: 'POST',
      body: JSON.stringify({ title, description, category, deposit: deposit.toString() }),
    }).then(r => ({ proposalId: r.proposal?.id ?? '' }));
  },

  async voteOnProposal(proposalId: string, vote: 'for' | 'against' | 'abstain', walletAddress?: string, signature?: string, nonce?: string): Promise<{ success: boolean }> {
    return fetchJson<{ success: boolean }>(`${BASE_URL}/api/governance/vote`, {
      method: 'POST',
      headers: {
        ...(walletAddress ? { 'x-wallet-address': walletAddress } : {}),
        ...(signature ? { 'x-signature': signature } : {}),
        ...(nonce ? { 'x-nonce': nonce } : {}),
      },
      body: JSON.stringify({ proposalId, vote }),
    });
  },

  async delegateStake(delegateAddress: string, power?: string, walletAddress?: string, signature?: string, nonce?: string): Promise<{ success: boolean; delegation?: unknown }> {
    return fetchJson<{ success: boolean; delegation?: unknown }>(`${BASE_URL}/api/governance/delegate`, {
      method: 'POST',
      headers: {
        ...(walletAddress ? { 'x-wallet-address': walletAddress } : {}),
        ...(signature ? { 'x-signature': signature } : {}),
        ...(nonce ? { 'x-nonce': nonce } : {}),
      },
      body: JSON.stringify({ delegate: delegateAddress, power }),
    });
  },
};

export { normalizeStatusResponse };
export type { StatusResponse, ApiStatusEnvelope, SignedVoteRequest };
