import type { UserBalance, Prompt, LogEntry, Proposal, Vote, Delegation, PaymentTier, PromptStatus, VoteType, ProposalType, ProposalStatus } from '../types/index.js';
import { saveState, loadState, scheduleAutoSave, debouncedSave, stopAutoSave } from '../lib/persistence.js';
import { generateId } from '../lib/crypto.js';

export type ActionType = 'prompt' | 'vote' | 'proposal' | 'publicVote' | 'general';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const RATE_LIMITS: Record<ActionType, RateLimitConfig> = {
  prompt: { windowMs: 60000, maxRequests: 10 },
  vote: { windowMs: 60000, maxRequests: 30 },
  proposal: { windowMs: 60000, maxRequests: 5 },
  publicVote: { windowMs: 60000, maxRequests: 30 },
  general: { windowMs: 60000, maxRequests: 100 }
};

interface RateLimitEntry {
  count: number;
  windowStart: number;
  ips: Set<string>;
}

const ipRateLimits = new Map<string, { count: number; resetAt: number }>();
const walletRateLimits = new Map<string, RateLimitEntry>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number;
  limit: number;
  isWalletLimited: boolean;
}

export function checkRateLimit(
  ip: string,
  action: ActionType,
  wallet?: string
): RateLimitResult {
  const now = Date.now();
  const config = RATE_LIMITS[action];

  let ipEntry = ipRateLimits.get(ip);
  if (!ipEntry || now >= ipEntry.resetAt) {
    ipEntry = { count: 0, resetAt: now + config.windowMs };
    ipRateLimits.set(ip, ipEntry);
  }

  const ipAllowed = ipEntry.count < config.maxRequests;
  if (ipAllowed) {
    ipEntry.count++;
  }

  let walletEntry: RateLimitEntry | undefined;
  let walletAllowed = true;
  let walletRemaining = config.maxRequests;

  if (wallet && wallet !== 'anonymous') {
    walletEntry = walletRateLimits.get(wallet);
    if (!walletEntry || now >= walletEntry.windowStart + config.windowMs) {
      walletEntry = { count: 0, windowStart: now, ips: new Set() };
      walletRateLimits.set(wallet, walletEntry);
    }

    walletAllowed = walletEntry.count < config.maxRequests;
    if (walletAllowed) {
      walletEntry.count++;
    }
    walletEntry.ips.add(ip);
    walletRemaining = config.maxRequests - walletEntry.count;
  }

  const allowed = ipAllowed && walletAllowed;
  const remaining = Math.min(
    ipAllowed ? config.maxRequests - ipEntry.count : 0,
    walletRemaining
  );
  const resetIn = Math.min(
    ipEntry.resetAt - now,
    walletEntry ? config.windowMs - (now - walletEntry.windowStart) : config.windowMs
  );

  return {
    allowed,
    remaining: Math.max(0, remaining),
    resetIn: Math.max(0, resetIn),
    limit: config.maxRequests,
    isWalletLimited: !walletAllowed
  };
}

export function setRateLimitHeaders(
  reply: { header: (key: string, value: string) => void },
  result: RateLimitResult
): void {
  reply.header('X-RateLimit-Limit', result.limit.toString());
  reply.header('X-RateLimit-Remaining', result.remaining.toString());
  reply.header('X-RateLimit-Reset', Math.ceil((Date.now() + result.resetIn) / 1000).toString());
}

export function getClientIp(request: { ip?: string; headers: Record<string, string | string[] | undefined> }): string {
  const forwarded = request.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  if (Array.isArray(forwarded)) return String(forwarded[0]).split(',')[0].trim();
  return request.ip || 'unknown';
}

interface State {
  balances: Map<string, UserBalance>;
  anonymousBalances?: Map<string, bigint>;
  prompts: Prompt[];
  treasuryUSDC: number;
  logs: LogEntry[];
  proposals: Proposal[];
  votes: Vote[];
  delegations: Delegation[];
  stakingPositions?: Map<string, { wallet: string; amount: bigint; votingPower: bigint; inferenceBudget: bigint; lastUpdated: number }>;
}

const state: State = {
  balances: new Map(),
  prompts: [],
  treasuryUSDC: 0,
  logs: [],
  proposals: [],
  votes: [],
  delegations: []
};

let persistenceEnabled = false;

export function getState(): State {
  return state;
}

export function getBalance(wallet: string): bigint {
  const user = state.balances.get(wallet);
  return user?.diemBalance ?? 0n;
}

export function setBalance(wallet: string, amount: bigint): void {
  const existing = state.balances.get(wallet);
  state.balances.set(wallet, {
    wallet,
    diemBalance: amount,
    vvvStaked: existing?.vvvStaked ?? 0n,
    tier: existing?.tier ?? 'free'
  });
  triggerPersist();
}

export function deductBalance(wallet: string, amount: bigint): boolean {
  const current = getBalance(wallet);
  if (current < amount) return false;
  setBalance(wallet, current - amount);
  return true;
}

export function addToTreasury(amount: bigint): void {
  state.treasuryUSDC += Number(amount);
  triggerPersist();
}

export function burnDiem(amount: bigint): void {
  const burned = amount * 80n / 100n;
  addToTreasury(amount - burned);
}

export function addPrompt(prompt: Prompt): void {
  state.prompts.push(prompt);
  triggerPersist();
}

export function getPrompts(): Prompt[] {
  return [...state.prompts].sort((a, b) => b.createdAt - a.createdAt);
}

export function updatePromptStatus(id: string, status: PromptStatus): void {
  const prompt = state.prompts.find(p => p.id === id);
  if (prompt) {
    prompt.status = status;
    triggerPersist();
  }
}

export function votePrompt(id: string): void {
  const prompt = state.prompts.find(p => p.id === id);
  if (prompt) {
    prompt.votes++;
    triggerPersist();
  }
}

export function addLog(message: string, level: LogEntry['level'] = 'info', wallet?: string): void {
  state.logs.push({
    id: generateId(),
    timestamp: Date.now(),
    level,
    message,
    wallet
  });
  triggerPersist();
}

export function getLogs(): LogEntry[] {
  return [...state.logs].sort((a, b) => b.timestamp - a.timestamp);
}

export function addProposal(proposal: Proposal): void {
  state.proposals.push(proposal);
  triggerPersist();
}

export function getProposals(): Proposal[] {
  return [...state.proposals];
}

export function voteProposal(id: string, vote: 'for' | 'against'): void {
  const proposal = state.proposals.find(p => p.id === id);
  if (proposal) {
    if (vote === 'for') proposal.votesFor++;
    else proposal.votesAgainst++;
    triggerPersist();
  }
}

export function addVote(vote: Vote): void {
  state.votes.push(vote);
  triggerPersist();
}

export function getVotes(proposalId?: string): Vote[] {
  if (proposalId) {
    return state.votes.filter(v => v.proposalId === proposalId);
  }
  return [...state.votes];
}

export function addDelegation(delegation: Delegation): void {
  state.delegations.push(delegation);
  triggerPersist();
}

export function getDelegations(): Delegation[] {
  return [...state.delegations];
}

export function calculateTier(diemStaked: number): 'Thriving' | 'Surviving' | 'Minimal' | 'Dying' {
  if (diemStaked > 500) return 'Thriving';
  if (diemStaked >= 10) return 'Surviving';
  if (diemStaked >= 0.1) return 'Minimal';
  return 'Dying';
}

function triggerPersist(): void {
  if (persistenceEnabled) {
    debouncedSave(() => state);
  }
}

export async function persistState(): Promise<void> {
  try {
    await saveState(state as Parameters<typeof saveState>[0]);
  } catch (err) {
    console.error('[STATE] Persist failed:', err);
  }
}

export async function loadPersistedState(): Promise<boolean> {
  try {
    const loaded = await loadState();
    if (!loaded) {
      console.log('[STATE] No persisted state found, starting fresh');
      return false;
    }

    state.balances = new Map(
      Array.from(loaded.balances.entries()).map(([k, v]) => [
        k,
        {
          wallet: v.wallet,
          diemBalance: v.diemBalance,
          vvvStaked: v.vvvStaked,
          tier: v.tier as PaymentTier
        }
      ])
    );

    state.prompts = loaded.prompts.map(p => ({
      ...p,
      tier: p.tier as PaymentTier,
      status: p.status as PromptStatus
    }));

    state.treasuryUSDC = loaded.treasuryUSDC;

    state.logs = loaded.logs.map(l => ({
      ...l,
      level: l.level as LogEntry['level']
    }));

    state.proposals = loaded.proposals.map(p => ({
      ...p,
      type: p.type as ProposalType,
      status: p.status as ProposalStatus
    }));

    state.votes = loaded.votes.map(v => ({
      ...v,
      vote: v.vote as VoteType
    }));

    state.delegations = loaded.delegations;
    state.anonymousBalances = loaded.anonymousBalances;

    console.log('[STATE] State restored from persistence');
    return true;
  } catch (err) {
    console.error('[STATE] Failed to load persisted state:', err);
    return false;
  }
}

export function initPersistence(): void {
  persistenceEnabled = true;
  scheduleAutoSave(() => state);
  console.log('[STATE] Persistence initialized');
}

export function stopPersistence(): void {
  persistenceEnabled = false;
  stopAutoSave();
  console.log('[STATE] Persistence stopped');
}