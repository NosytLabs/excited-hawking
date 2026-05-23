import type { Vote, VoteType, VoterWeight } from '../types/index.js';
import { getState } from '../services/state.js';
import { getConfig } from '../services/governance.js';
import { generateId } from './crypto.js';

const anonymousVotes = new Map<string, Vote>();
const publicVoteLedger = new Map<string, {
  proposalId: string;
  voter: string;
  vote: VoteType;
  weight: bigint;
  quadraticWeight: bigint;
  timestamp: number;
  isAnonymous: boolean;
  sessionId?: string;
}>();

export function calculateQuadraticWeight(diemStaked: bigint): bigint {
  if (diemStaked <= 0n) return 0n;

  const config = getConfig();
  const k = config.quadraticK ?? 1n;

  const adjustedStake = diemStaked / 1000n;
  let x = adjustedStake;
  let y = (x + 1n) >> 1n;

  while (y < x) {
    x = y;
    y = (x + adjustedStake / x) >> 1n;
  }

  return x * k;
}

export function calculateVoteWeight(diemStaked: bigint): {
  linearWeight: bigint;
  quadraticWeight: bigint;
} {
  return {
    linearWeight: diemStaked,
    quadraticWeight: calculateQuadraticWeight(diemStaked)
  };
}

export function getAnonymousVoterWeight(sessionId: string): VoterWeight {
  const stake = getAnonymousStake(sessionId);
  const { linearWeight, quadraticWeight } = calculateVoteWeight(stake);
  
  return {
    wallet: `anonymous:${sessionId}`,
    baseStake: stake,
    delegatedPower: 0n,
    tierMultiplier: 1n,
    totalWeight: linearWeight,
    quadraticWeight,
    isDelegating: false
  };
}

export function getAnonymousStake(sessionId: string): bigint {
  const state = getState();
  const sessionKey = `session:${sessionId}`;
  const user = state.balances.get(sessionKey);
  
  if (user) {
    return user.diemBalance;
  }
  
  const anonymousBalance = state.anonymousBalances?.get(sessionId);
  if (anonymousBalance) {
    return anonymousBalance;
  }
  
  return 1n;
}

export function setAnonymousStake(sessionId: string, amount: bigint): void {
  const state = getState();
  
  if (!state.anonymousBalances) {
    state.anonymousBalances = new Map();
  }
  
  state.anonymousBalances.set(sessionId, amount);
}

export function recordPublicVote(
  proposalId: string,
  voter: string,
  vote: VoteType,
  weight: bigint,
  quadraticWeight: bigint,
  isAnonymous: boolean,
  sessionId?: string
): Vote {
  const voteRecord: Vote = {
    id: generateId(),
    proposalId,
    voter,
    vote,
    weight,
    quadraticWeight,
    timestamp: Date.now()
  };
  
  const key = `${proposalId}:${voter}`;
  anonymousVotes.set(key, voteRecord);
  
  publicVoteLedger.set(voteRecord.id, {
    proposalId,
    voter,
    vote,
    weight,
    quadraticWeight,
    timestamp: voteRecord.timestamp,
    isAnonymous,
    sessionId
  });
  
  return voteRecord;
}

export function getPublicVote(proposalId: string, voter: string): Vote | undefined {
  const key = `${proposalId}:${voter}`;
  return anonymousVotes.get(key);
}

export function hasVoted(proposalId: string, voter: string): boolean {
  return anonymousVotes.has(`${proposalId}:${voter}`);
}

export function getProposalPublicVotes(proposalId: string): Vote[] {
  const result: Vote[] = [];
  
  for (const vote of anonymousVotes.values()) {
    if (vote.proposalId === proposalId) {
      result.push(vote);
    }
  }
  
  return result;
}

interface VoterRequest {
  cookies?: { sessionId?: string };
  headers?: { 'x-session-id'?: string };
}

export function getVoterSession(request: VoterRequest): string | undefined {
  if (!request) return undefined;
  
  const cookies = request.cookies;
  if (cookies?.sessionId) {
    return cookies.sessionId;
  }
  
  const authHeader = request.headers?.['x-session-id'];
  if (typeof authHeader === 'string') {
    return authHeader;
  }
  
  return undefined;
}

export function createAnonymousSession(): string {
  const sessionId = generateId();
  setAnonymousStake(sessionId, 1n);
  return sessionId;
}

export function getLeaderboard(limit: number = 10): {
  wallet: string;
  totalVotes: number;
  proposalsVoted: number;
  quadraticWeightSum: bigint;
}[] {
  const voterStats = new Map<string, {
    totalVotes: number;
    proposalsVoted: Set<string>;
    quadraticWeightSum: bigint;
  }>();
  
  for (const vote of anonymousVotes.values()) {
    const stats = voterStats.get(vote.voter) || {
      totalVotes: 0,
      proposalsVoted: new Set(),
      quadraticWeightSum: 0n
    };
    
    stats.totalVotes++;
    stats.proposalsVoted.add(vote.proposalId);
    stats.quadraticWeightSum += vote.quadraticWeight;
    
    voterStats.set(vote.voter, stats);
  }
  
  return Array.from(voterStats.entries())
    .map(([wallet, stats]) => ({
      wallet,
      totalVotes: stats.totalVotes,
      proposalsVoted: stats.proposalsVoted.size,
      quadraticWeightSum: stats.quadraticWeightSum
    }))
    .sort((a, b) => {
      if (b.quadraticWeightSum !== a.quadraticWeightSum) {
        return b.quadraticWeightSum > a.quadraticWeightSum ? 1 : -1;
      }
      return b.totalVotes - a.totalVotes;
    })
    .slice(0, limit);
}

export function delegateVote(
  delegator: string,
  delegate: string,
  proposalId: string,
  delegateVote: VoteType
): { success: boolean; error?: string } {
  if (delegator === delegate) {
    return { success: false, error: 'Cannot delegate to yourself' };
  }
  
  const existingDelegation = getDelegation(delegator, proposalId);
  if (existingDelegation) {
    return { success: false, error: 'Vote already delegated for this proposal' };
  }
  
  const delegateVoteRecord = getPublicVote(proposalId, delegate);
  if (!delegateVoteRecord) {
    return { success: false, error: 'Delegate has not voted on this proposal' };
  }
  
  const voteRecord: Vote = {
    id: generateId(),
    proposalId,
    voter: delegator,
    vote: delegateVote,
    weight: 0n,
    quadraticWeight: 0n,
    timestamp: Date.now(),
    delegator: delegate
  };
  
  const key = `${proposalId}:${delegator}`;
  anonymousVotes.set(key, voteRecord);
  
  return { success: true };
}

const delegations = new Map<string, Map<string, string>>();

export function setDelegation(delegator: string, proposalId: string, delegate: string): void {
  if (!delegations.has(delegator)) {
    delegations.set(delegator, new Map());
  }
  delegations.get(delegator)!.set(proposalId, delegate);
}

export function getDelegation(delegator: string, proposalId: string): string | undefined {
  return delegations.get(delegator)?.get(proposalId);
}

export function getDelegatedVotes(delegate: string, proposalId: string): Vote[] {
  const result: Vote[] = [];
  
  for (const [key, vote] of anonymousVotes.entries()) {
    if (vote.proposalId === proposalId && key.includes(`:${delegate}`)) {
      if (vote.delegator === delegate) {
        result.push(vote);
      }
    }
  }
  
  return result;
}

export function reflectVoteFromPrompt(
  wallet: string,
  proposalId: string,
  vote: VoteType = 'for'
): Vote | { error: string } {
  const state = getState();
  const user = state.balances.get(wallet);
  const diemBalance = user?.diemBalance ?? 0n;
  
  if (diemBalance < 1n) {
    return { error: 'Minimum 1 DIEM required to vote' };
  }
  
  if (hasVoted(proposalId, wallet)) {
    return { error: 'Already voted on this proposal' };
  }
  
  const { linearWeight, quadraticWeight } = calculateVoteWeight(diemBalance);
  
  return recordPublicVote(
    proposalId,
    wallet,
    vote,
    linearWeight,
    quadraticWeight,
    false
  );
}

export function autoVoteOnActiveProposals(
  wallet: string,
  vote: VoteType = 'for'
): { proposalId: string; vote: Vote }[] {
  const state = getState();
  const activeProposalIds = state.proposals
    .filter(p => p.status === 'review' || p.status === 'voting')
    .map(p => p.id);
  
  const results: { proposalId: string; vote: Vote }[] = [];
  
  for (const proposalId of activeProposalIds) {
    if (!hasVoted(proposalId, wallet)) {
      const result = reflectVoteFromPrompt(wallet, proposalId, vote);
      if ('id' in result) {
        results.push({ proposalId, vote: result });
      }
    }
  }
  
  return results;
}