import type { 
  Proposal, 
  Vote, 
  Delegation, 
  GovernanceConfig, 
  ProposalStatus, 
  VoteType,
  DelegationRecord,
  VoterWeight,
  ProposalResult
} from '../types/index.js';
import { getState, addVote } from './state.js';
import { emitGovernanceUpdate, emitProposalNew, emitProposalUpdate } from './websocket.js';
import { generateId } from '../lib/crypto.js';
import { bigIntSqrt } from '../utils/math.js';
import { 
  getProposalPublicVotes,
  getLeaderboard,
  reflectVoteFromPrompt,
  autoVoteOnActiveProposals
} from '../lib/voting.js';

const DEFAULT_CONFIG: GovernanceConfig = {
  minDeposit: 100n,
  votingPeriod: 7 * 24 * 60 * 60 * 1000,
  timelockDuration: 2 * 24 * 60 * 60 * 1000,
  quorumPercent: 10n,
  thresholdPercent: 51n,
  emergencyTimelockDuration: 60 * 60 * 1000,
  maxProposalDeposit: 10000n,
  spamSlashPercent: 50n,
  delegationDuration: 30 * 24 * 60 * 60 * 1000,
  quadraticK: 1n,
  tierMultipliers: {
    'bronze': 1n,
    'silver': 2n,
    'gold': 4n,
    'platinum': 8n,
    'diamond': 16n
  }
};

let config = { ...DEFAULT_CONFIG };
const votes = new Map<string, Vote[]>();
const delegations = new Map<string, Delegation>();
const activeProposals = new Map<string, Proposal>();
const expirationTimers = new Map<string, ReturnType<typeof setTimeout>>();

export function getConfig(): GovernanceConfig {
  return { ...config };
}

export function updateConfig(updates: Partial<GovernanceConfig>): void {
  config = { ...config, ...updates };
}

function getUserStake(wallet: string): bigint {
  const state = getState();
  const user = state.balances.get(wallet);
  return user?.diemBalance ?? 0n;
}

function getUserTier(wallet: string): string {
  const state = getState();
  const user = state.balances.get(wallet);
  return user?.tier ?? 'free';
}

function getTierMultiplier(tier: string): bigint {
  return config.tierMultipliers[tier] ?? 1n;
}

function getTotalSupply(): bigint {
  const state = getState();
  let total = 0n;
  for (const user of state.balances.values()) {
    total += user.diemBalance;
  }
  return total;
}

export function getVoterWeight(wallet: string): VoterWeight {
  const baseStake = getUserStake(wallet);
  const tier = getUserTier(wallet);
  const tierMultiplier = getTierMultiplier(tier);
  
  let delegatedPower = 0n;
  const delegationsForWallet = getDelegationsTo(wallet);
  for (const del of delegationsForWallet) {
    if (del.expiresAt > Date.now()) {
      delegatedPower += del.power;
    }
  }
  
  const isDelegating = delegations.has(wallet);
  const totalWeight = (baseStake + delegatedPower) * tierMultiplier;
  const quadraticWeight = bigIntSqrt(totalWeight);
  
  return {
    wallet,
    baseStake,
    delegatedPower,
    tierMultiplier,
    totalWeight,
    quadraticWeight,
    isDelegating
  };
}

function getDelegationsTo(wallet: string): DelegationRecord[] {
  const now = Date.now();
  const result: DelegationRecord[] = [];
  const expiredKeys: string[] = [];

  for (const [delegatorWallet, del] of delegations.entries()) {
    if (del.expiresAt <= now) {
      expiredKeys.push(delegatorWallet);
      continue;
    }
    if (del.delegate === wallet) {
      result.push({
        delegate: del.delegate,
        power: del.power,
        expiresAt: del.expiresAt
      });
    }
  }

  for (const key of expiredKeys) {
    delegations.delete(key);
  }

  return result;
}

export function createProposal(
  wallet: string,
  title: string,
  description: string,
  category: string,
  deposit: bigint,
  executionData: string | null = null,
  isEmergency: boolean = false
): Proposal | { error: string } {
  const stake = getUserStake(wallet);
  
  if (stake < deposit) {
    return { error: `Insufficient DIEM balance. Required: ${deposit}, Available: ${stake}` };
  }
  
  if (deposit < config.minDeposit) {
    return { error: `Minimum deposit is ${config.minDeposit} DIEM` };
  }
  
  if (deposit > config.maxProposalDeposit) {
    return { error: `Maximum deposit is ${config.maxProposalDeposit} DIEM` };
  }
  
  const state = getState();
  state.balances.set(wallet, {
    ...state.balances.get(wallet)!,
    diemBalance: stake - deposit
  });
  
  const proposalType: Proposal['type'] = isEmergency ? 'emergency' : 
    executionData ? 'treasury' : 'standard';
  
  const now = Date.now();
  const deadline = now + config.votingPeriod;
  
  const proposal: Proposal = {
    id: generateId(),
    title,
    description,
    category,
    type: proposalType,
    status: 'submitted',
    proposer: wallet,
    deposit,
    votesFor: 0n,
    votesAgainst: 0n,
    votesAbstain: 0n,
    deadline,
    timelockUntil: null,
    executionData,
    createdAt: now,
    updatedAt: now,
    isEmergency,
    totalVotingWeight: 0n
  };
  
  activeProposals.set(proposal.id, proposal);
  state.proposals.push(proposal);
  
  emitProposalNew(proposal);
  emitGovernanceUpdate({ type: 'proposal:created', proposal });

  const timer = setTimeout(() => checkProposalExpiration(proposal.id), proposal.deadline - now + 1000);
  expirationTimers.set(proposal.id, timer);

  return proposal;
}

function checkProposalExpiration(proposalId: string): void {
  const proposal = activeProposals.get(proposalId);
  if (!proposal) return;
  
  expirationTimers.delete(proposalId);
  
  if (proposal.status === 'submitted' || proposal.status === 'review' || proposal.status === 'voting') {
    if (Date.now() >= proposal.deadline) {
      finalizeProposal(proposalId);
    }
  }
}

export function castVote(
  wallet: string,
  proposalId: string,
  vote: VoteType
): Vote | { error: string } {
  const proposal = activeProposals.get(proposalId);
  if (!proposal) {
    return { error: 'Proposal not found' };
  }
  
  if (proposal.status !== 'submitted' && proposal.status !== 'review' && proposal.status !== 'voting') {
    return { error: `Proposal is not open for voting. Current status: ${proposal.status}` };
  }
  
  if (Date.now() >= proposal.deadline) {
    return { error: 'Voting period has ended' };
  }
  
  const proposalVotes = votes.get(proposalId) || [];
  const existingVote = proposalVotes.find(v => v.voter === wallet);
  
  if (existingVote) {
    return { error: 'You have already voted on this proposal' };
  }
  
  const voterWeight = getVoterWeight(wallet);
  const voteRecord: Vote = {
    id: generateId(),
    proposalId,
    voter: wallet,
    vote,
    weight: voterWeight.totalWeight,
    quadraticWeight: voterWeight.quadraticWeight,
    timestamp: Date.now()
  };
  
  proposalVotes.push(voteRecord);
  votes.set(proposalId, proposalVotes);
  addVote(voteRecord);

  if (vote === 'for') {
    proposal.votesFor += voterWeight.quadraticWeight;
  } else if (vote === 'against') {
    proposal.votesAgainst += voterWeight.quadraticWeight;
  } else {
    proposal.votesAbstain += voterWeight.quadraticWeight;
  }
  
  proposal.totalVotingWeight += voterWeight.quadraticWeight;
  proposal.updatedAt = Date.now();
  
  emitProposalUpdate(proposal);
  emitGovernanceUpdate({
    type: 'vote:cast',
    proposalId,
    voter: wallet,
    vote,
    weight: voterWeight.quadraticWeight.toString()
  });
  
  return voteRecord;
}

export function delegate(
  delegator: string,
  delegate: string,
  power?: bigint
): Delegation | { error: string } {
  if (delegator === delegate) {
    return { error: 'Cannot delegate to yourself' };
  }
  
  const voterWeight = getVoterWeight(delegator);
  const delegatablePower = power ?? voterWeight.baseStake;
  
  if (delegatablePower > voterWeight.baseStake) {
    return { error: 'Cannot delegate more than your base stake' };
  }
  
  if (delegatablePower <= 0n) {
    return { error: 'Delegation power must be positive' };
  }
  
  const existing = delegations.get(delegator);
  if (existing) {
    existing.delegate = delegate;
    existing.power = delegatablePower;
    existing.expiresAt = Date.now() + config.delegationDuration;
    return existing;
  }
  
  const delegation: Delegation = {
    id: generateId(),
    delegator,
    delegate,
    power: delegatablePower,
    expiresAt: Date.now() + config.delegationDuration,
    createdAt: Date.now()
  };
  
  delegations.set(delegator, delegation);
  
  emitGovernanceUpdate({
    type: 'delegation:created',
    delegator,
    delegate,
    power: delegatablePower.toString()
  });
  
  return delegation;
}

export function getDelegations(wallet: string): DelegationRecord[] {
  const now = Date.now();
  const result: DelegationRecord[] = [];
  const expiredKeys: string[] = [];

  for (const [delegatorWallet, del] of delegations.entries()) {
    if (del.expiresAt <= now) {
      expiredKeys.push(delegatorWallet);
      continue;
    }
    if (del.delegate === wallet) {
      result.push({
        delegate: del.delegate,
        power: del.power,
        expiresAt: del.expiresAt
      });
    }
  }

  for (const key of expiredKeys) {
    delegations.delete(key);
  }

  return result;
}

export function getDelegators(delegator: string): { wallet: string; power: bigint }[] {
  const now = Date.now();
  const result: { wallet: string; power: bigint }[] = [];
  const expiredKeys: string[] = [];

  for (const [delegatorWallet, del] of delegations.entries()) {
    if (del.expiresAt <= now) {
      expiredKeys.push(delegatorWallet);
      continue;
    }
    if (del.delegator === delegator) {
      result.push({
        wallet: delegatorWallet,
        power: del.power
      });
    }
  }

  for (const key of expiredKeys) {
    delegations.delete(key);
  }

  return result;
}

export function getVotes(proposalId: string): Vote[] {
  return votes.get(proposalId) || [];
}

export function finalizeProposal(proposalId: string): ProposalResult {
  const proposal = activeProposals.get(proposalId);
  if (!proposal) {
    return {
      passed: false,
      reason: 'Proposal not found',
      votesFor: 0n,
      votesAgainst: 0n,
      votesAbstain: 0n,
      quorumRequired: 0n,
      quorumMet: false,
      thresholdMet: false,
      totalVoted: 0n
    };
  }
  
  if (proposal.status === 'closed' || proposal.status === 'executed' || proposal.status === 'rejected' || proposal.status === 'cancelled') {
    return buildResult(proposal, 'Proposal already finalized');
  }
  
  const totalSupply = getTotalSupply();
  const quorumRequired = (totalSupply * config.quorumPercent) / 100n;
  const totalVoted = proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain;
  
  const quorumMet = totalVoted >= quorumRequired;
  
  const votesCast = proposal.votesFor + proposal.votesAgainst;
  const thresholdMet = votesCast > 0n && 
    (proposal.votesFor * 100n) / votesCast >= config.thresholdPercent;
  
  const passed = quorumMet && thresholdMet;
  
  if (passed) {
    proposal.status = 'closed';
    proposal.timelockUntil = Date.now() + (proposal.isEmergency ? config.emergencyTimelockDuration : config.timelockDuration);
  } else {
    proposal.status = 'rejected';
  }
  
  proposal.updatedAt = Date.now();
  
  emitProposalUpdate(proposal);
  emitGovernanceUpdate({
    type: 'proposal:finalized',
    proposalId,
    passed,
    reason: !quorumMet ? 'Quorum not reached' : !thresholdMet ? 'Threshold not reached' : 'Passed'
  });

  votes.delete(proposalId);

  return buildResult(proposal, !quorumMet ? 'Quorum not reached' : !thresholdMet ? 'Threshold not reached' : 'Passed');
}

function buildResult(proposal: Proposal, reason: string): ProposalResult {
  return {
    passed: proposal.status === 'closed',
    reason,
    votesFor: proposal.votesFor,
    votesAgainst: proposal.votesAgainst,
    votesAbstain: proposal.votesAbstain,
    quorumRequired: (getTotalSupply() * config.quorumPercent) / 100n,
    quorumMet: (proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain) >= (getTotalSupply() * config.quorumPercent) / 100n,
    thresholdMet: (proposal.votesFor * 100n) / (proposal.votesFor + proposal.votesAgainst) >= config.thresholdPercent,
    totalVoted: proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain
  };
}

export function executeProposal(proposalId: string): { success: boolean; error?: string } {
  const proposal = activeProposals.get(proposalId);
  if (!proposal) {
    return { success: false, error: 'Proposal not found' };
  }
  
  if (proposal.status !== 'closed') {
    return { success: false, error: `Proposal must be passed to execute. Current status: ${proposal.status}` };
  }
  
  if (proposal.timelockUntil && Date.now() < proposal.timelockUntil) {
    const remaining = proposal.timelockUntil - Date.now();
    return { success: false, error: `Timelock period not ended. ${Math.ceil(remaining / 1000 / 60)} minutes remaining` };
  }
  
  proposal.status = 'executed';
  proposal.updatedAt = Date.now();
  
  if (!proposal.isEmergency) {
    const state = getState();
    const proposerBalance = state.balances.get(proposal.proposer);
    if (proposerBalance) {
      const slashAmount = (proposal.deposit * config.spamSlashPercent) / 100n;
      const newBalance = proposerBalance.diemBalance >= slashAmount
        ? proposerBalance.diemBalance - slashAmount + proposal.deposit
        : proposerBalance.diemBalance + proposal.deposit;
      state.balances.set(proposal.proposer, {
        ...proposerBalance,
        diemBalance: newBalance
      });
    }
  }
  
  emitProposalUpdate(proposal);
  emitGovernanceUpdate({
    type: 'proposal:executed',
    proposalId,
    executionData: proposal.executionData
  });
  
  return { success: true };
}

export function getProposal(proposalId: string): Proposal | undefined {
  return activeProposals.get(proposalId);
}

export function getAllProposals(filters?: {
  status?: ProposalStatus;
  category?: string;
  proposer?: string;
}): Proposal[] {
  let proposals = Array.from(activeProposals.values());
  
  if (filters?.status) {
    proposals = proposals.filter(p => p.status === filters.status);
  }
  if (filters?.category) {
    proposals = proposals.filter(p => p.category === filters.category);
  }
  if (filters?.proposer) {
    proposals = proposals.filter(p => p.proposer === filters.proposer);
  }
  
  return proposals.sort((a, b) => b.createdAt - a.createdAt);
}

export function getGovernanceStats(): {
  totalProposals: number;
  activeProposalsCount: number;
  totalVotes: number;
  totalDelegations: number;
  totalSupply: bigint;
  quorumRequired: bigint;
  avgParticipation: number;
  categories: Record<string, number>;
} {
  const allProposals = Array.from(activeProposals.values());
  const totalVotes = Array.from(votes.values()).reduce((sum, v) => sum + v.length, 0);
  
  const categories: Record<string, number> = {};
  for (const p of allProposals) {
    categories[p.category] = (categories[p.category] || 0) + 1;
  }
  
  const activeProposalsList = allProposals.filter(p => p.status === 'submitted' || p.status === 'review' || p.status === 'voting');
  
  let totalParticipation = 0n;
  for (const p of allProposals) {
    totalParticipation += p.votesFor + p.votesAgainst + p.votesAbstain;
  }
  
  const avgParticipation = allProposals.length > 0 
    ? Number(totalParticipation) / allProposals.length 
    : 0;
  
  return {
    totalProposals: allProposals.length,
    activeProposalsCount: activeProposalsList.length,
    totalVotes,
    totalDelegations: delegations.size,
    totalSupply: getTotalSupply(),
    quorumRequired: (getTotalSupply() * config.quorumPercent) / 100n,
    avgParticipation,
    categories
  };
}

export function slashForSpam(adminWallet: string, wallet: string, _amount: bigint): { success: boolean; error?: string } {
  const adminWallets = (process.env.ADMIN_WALLETS || '').split(',').map(w => w.trim().toLowerCase()).filter(Boolean);
  if (adminWallets.length > 0 && !adminWallets.includes(adminWallet.toLowerCase())) {
    return { success: false, error: 'Unauthorized: only admin wallets can slash' };
  }

  const state = getState();
  const user = state.balances.get(wallet);
  if (user) {
    const slashAmount = (user.diemBalance * config.spamSlashPercent) / 100n;
    const newBalance = user.diemBalance >= slashAmount ? user.diemBalance - slashAmount : 0n;
    state.balances.set(wallet, {
      ...user,
      diemBalance: newBalance
    });
  }
  return { success: true };
}

export function resetGovernance(): void {
  votes.clear();
  delegations.clear();
  activeProposals.clear();
  for (const timer of expirationTimers.values()) {
    clearTimeout(timer);
  }
  expirationTimers.clear();
}

export function castPublicVote(
  proposalId: string,
  vote: VoteType,
  _request?: unknown
): Vote | { error: string } {
  const proposal = activeProposals.get(proposalId);
  if (!proposal) {
    return { error: 'Proposal not found' };
  }
  
  if (proposal.status !== 'submitted' && proposal.status !== 'review' && proposal.status !== 'voting') {
    return { error: `Proposal is not open for voting. Current status: ${proposal.status}` };
  }
  
  if (Date.now() >= proposal.deadline) {
    return { error: 'Voting period has ended' };
  }

  const sessionId = generateId();
  const voterWeight = { totalWeight: 1000n, quadraticWeight: 316n, baseStake: 1000n, delegations: [] };
  const voteRecord: Vote = {
    id: generateId(),
    proposalId,
    voter: `public:${sessionId}`,
    vote,
    weight: voterWeight.totalWeight,
    quadraticWeight: voterWeight.quadraticWeight,
    timestamp: Date.now()
  };
  
  const proposalVotes = votes.get(proposalId) || [];
  proposalVotes.push(voteRecord);
  votes.set(proposalId, proposalVotes);
  
  if (vote === 'for') {
    proposal.votesFor += voterWeight.quadraticWeight;
  } else if (vote === 'against') {
    proposal.votesAgainst += voterWeight.quadraticWeight;
  } else {
    proposal.votesAbstain += voterWeight.quadraticWeight;
  }
  
  proposal.totalVotingWeight += voterWeight.quadraticWeight;
  proposal.updatedAt = Date.now();
  
  emitProposalUpdate(proposal);
  emitGovernanceUpdate({
    type: 'vote:cast',
    proposalId,
    voter: 'public',
    vote,
    weight: voterWeight.quadraticWeight.toString()
  });
  
  return voteRecord;
}

export function delegatePublicVote(
  wallet: string,
  delegateAddress: string,
  proposalId: string,
  vote: VoteType
): { success: boolean; error?: string } {
  const proposal = activeProposals.get(proposalId);
  if (!proposal) {
    return { success: false, error: 'Proposal not found' };
  }
  
  if (proposal.status !== 'submitted' && proposal.status !== 'review' && proposal.status !== 'voting') {
    return { success: false, error: `Proposal is not open for voting. Current status: ${proposal.status}` };
  }
  
  if (Date.now() >= proposal.deadline) {
    return { success: false, error: 'Voting period has ended' };
  }
  
  const delegateResult = delegate(wallet, delegateAddress);
  if ('error' in delegateResult) {
    return { success: false, error: delegateResult.error };
  }
  
  const voterWeight = getVoterWeight(wallet);
  const voteRecord: Vote = {
    id: generateId(),
    proposalId,
    voter: wallet,
    vote,
    weight: voterWeight.totalWeight,
    quadraticWeight: voterWeight.quadraticWeight,
    timestamp: Date.now(),
    delegator: delegateAddress
  };
  
  const proposalVotes = votes.get(proposalId) || [];
  proposalVotes.push(voteRecord);
  votes.set(proposalId, proposalVotes);
  
  if (vote === 'for') {
    proposal.votesFor += voterWeight.quadraticWeight;
  } else if (vote === 'against') {
    proposal.votesAgainst += voterWeight.quadraticWeight;
  } else {
    proposal.votesAbstain += voterWeight.quadraticWeight;
  }
  
  proposal.totalVotingWeight += voterWeight.quadraticWeight;
  proposal.updatedAt = Date.now();
  
  emitProposalUpdate(proposal);
  emitGovernanceUpdate({
    type: 'vote:delegated',
    proposalId,
    voter: wallet,
    delegate: delegateAddress,
    vote,
    weight: voterWeight.quadraticWeight.toString()
  });
  
  return { success: true };
}

export function getPublicVotes(proposalId: string): Vote[] {
  return getProposalPublicVotes(proposalId);
}

export function getVotingLeaderboard(limit: number = 10) {
  return getLeaderboard(limit);
}

export function submitPromptAndAutoVote(
  wallet: string,
  proposalIds?: string[]
): { proposalId: string; vote: Vote }[] {
  if (proposalIds && proposalIds.length > 0) {
    const results: { proposalId: string; vote: Vote }[] = [];
    
    for (const proposalId of proposalIds) {
      const result = reflectVoteFromPrompt(wallet, proposalId, 'for');
      if ('id' in result) {
        results.push({ proposalId, vote: result });
        
        const proposal = activeProposals.get(proposalId);
        if (proposal) {
          proposal.votesFor += result.quadraticWeight;
          proposal.totalVotingWeight += result.quadraticWeight;
          proposal.updatedAt = Date.now();
          emitProposalUpdate(proposal);
        }
      }
    }
    
    return results;
  }
  
  return autoVoteOnActiveProposals(wallet, 'for');
}