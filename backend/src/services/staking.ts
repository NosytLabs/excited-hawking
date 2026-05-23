import type { StakingPosition, StakingConfig, UnstakingRequest } from '../types/index.js';
import { getState } from './state.js';
import { emitGovernanceUpdate } from './websocket.js';
import { generateId } from '../lib/crypto.js';
import { getVoterWeight } from './governance.js';

const DEFAULT_CONFIG: StakingConfig = {
  minStakeAmount: 1n,
  maxStakeAmount: 1000000n,
  unstakeTimelockDuration: 2 * 24 * 60 * 60 * 1000,
  inferenceBudgetPerDiem: 1000n,
  quadraticWeightMultiplier: 10000n
};

const stakingPositions = new Map<string, StakingPosition>();
const unstakingRequests = new Map<string, UnstakingRequest[]>();

let config = { ...DEFAULT_CONFIG };

export function getStakingConfig(): StakingConfig {
  return { ...config };
}

export function updateStakingConfig(updates: Partial<StakingConfig>): void {
  config = { ...config, ...updates };
}

export function getStakedBalance(wallet: string): bigint {
  const position = stakingPositions.get(wallet);
  return position?.amount ?? 0n;
}

export function getStakingPosition(wallet: string): StakingPosition | undefined {
  return stakingPositions.get(wallet);
}

export function getAllStakingPositions(): StakingPosition[] {
  return Array.from(stakingPositions.values());
}

export function getTotalStaked(): bigint {
  let total = 0n;
  for (const position of stakingPositions.values()) {
    total += position.amount;
  }
  return total;
}

export function stakeDiem(
  wallet: string,
  amount: bigint
): { success: boolean; position?: StakingPosition; error?: string } {
  if (amount < config.minStakeAmount) {
    return { success: false, error: `Minimum stake amount is ${config.minStakeAmount} DIEM` };
  }

  if (amount > config.maxStakeAmount) {
    return { success: false, error: `Maximum stake amount is ${config.maxStakeAmount} DIEM` };
  }

  const state = getState();
  const user = state.balances.get(wallet);

  if (!user || user.diemBalance < amount) {
    return { success: false, error: 'Insufficient DIEM balance for staking' };
  }

  user.diemBalance -= amount;

  const existing = stakingPositions.get(wallet);
  let position: StakingPosition;

  if (existing) {
    existing.amount += amount;
    existing.lastUpdated = Date.now();
    position = existing;
  } else {
    position = {
      wallet,
      amount,
      votingPower: calculateVotingPower(amount),
      inferenceBudget: calculateInferenceBudget(amount),
      lastUpdated: Date.now()
    };
    stakingPositions.set(wallet, position);
  }

  state.balances.set(wallet, {
    ...user,
    diemBalance: user.diemBalance
  });

  emitGovernanceUpdate({
    type: 'staking:staked',
    wallet,
    amount: amount.toString(),
    totalStaked: position.amount.toString(),
    votingPower: position.votingPower.toString()
  });

  return { success: true, position };
}

export function requestUnstake(
  wallet: string,
  amount: bigint
): { success: boolean; request?: UnstakingRequest; error?: string } {
  const position = stakingPositions.get(wallet);

  if (!position || position.amount < amount) {
    return { success: false, error: 'Insufficient staked DIEM' };
  }

  const request: UnstakingRequest = {
    id: generateId(),
    wallet,
    amount,
    requestedAt: Date.now(),
    unlockableAt: Date.now() + config.unstakeTimelockDuration,
    status: 'pending'
  };

  const existing = unstakingRequests.get(wallet) || [];
  existing.push(request);
  unstakingRequests.set(wallet, existing);

  emitGovernanceUpdate({
    type: 'staking:unstake_requested',
    wallet,
    amount: amount.toString(),
    unlockableAt: request.unlockableAt
  });

  return { success: true, request };
}

export function getUnstakingRequests(wallet: string): UnstakingRequest[] {
  return unstakingRequests.get(wallet) || [];
}

export function processUnstakeRequest(wallet: string, requestId: string): { success: boolean; error?: string } {
  const requests = unstakingRequests.get(wallet);
  if (!requests) {
    return { success: false, error: 'No unstake requests found' };
  }

  const request = requests.find(r => r.id === requestId);
  if (!request) {
    return { success: false, error: 'Unstake request not found' };
  }

  if (request.status !== 'pending') {
    return { success: false, error: `Request already processed with status: ${request.status}` };
  }

  if (Date.now() < request.unlockableAt) {
    const remaining = request.unlockableAt - Date.now();
    return { success: false, error: `Timelock active. ${Math.ceil(remaining / 1000 / 60)} minutes remaining` };
  }

  const position = stakingPositions.get(wallet);
  if (!position || position.amount < request.amount) {
    return { success: false, error: 'Staking position insufficient' };
  }

  position.amount -= request.amount;
  position.lastUpdated = Date.now();
  position.votingPower = calculateVotingPower(position.amount);
  position.inferenceBudget = calculateInferenceBudget(position.amount);

  if (position.amount === 0n) {
    stakingPositions.delete(wallet);
  }

  request.status = 'completed';

  const state = getState();
  const user = state.balances.get(wallet) || {
    wallet,
    diemBalance: 0n,
    vvvStaked: 0n,
    tier: 'free' as const
  };

  user.diemBalance += request.amount;
  state.balances.set(wallet, user);

  emitGovernanceUpdate({
    type: 'staking:unstaked',
    wallet,
    amount: request.amount.toString(),
    remainingStaked: position.amount.toString()
  });

  return { success: true };
}

export function calculateVotingPower(stakedAmount: bigint): bigint {
  if (stakedAmount === 0n) return 0n;

  const sqrt = (value: bigint): bigint => {
    if (value < 0n) return 0n;
    if (value === 0n) return 0n;

    let x = value;
    let y = (x + 1n) >> 1n;

    while (y < x) {
      x = y;
      y = (x + value / x) >> 1n;
    }

    return x;
  };

  return sqrt(stakedAmount * config.quadraticWeightMultiplier);
}

export function calculateInferenceBudget(stakedAmount: bigint): bigint {
  return stakedAmount * config.inferenceBudgetPerDiem;
}

export function getInferenceBudget(wallet: string): bigint {
  const position = stakingPositions.get(wallet);
  return position?.inferenceBudget ?? 0n;
}

export function getVotingPower(wallet: string): bigint {
  const position = stakingPositions.get(wallet);
  if (!position) return 0n;

  const govWeight = getVoterWeight(wallet);
  return position.votingPower + govWeight.quadraticWeight;
}

export function getStakeStats(): {
  totalStaked: bigint;
  stakerCount: number;
  averageStake: bigint;
  totalVotingPower: bigint;
  totalInferenceBudget: bigint;
} {
  const positions = Array.from(stakingPositions.values());
  const totalStaked = getTotalStaked();
  const stakerCount = positions.length;
  const averageStake = stakerCount > 0 ? totalStaked / BigInt(stakerCount) : 0n;

  let totalVotingPower = 0n;
  let totalInferenceBudget = 0n;

  for (const position of positions) {
    totalVotingPower += position.votingPower;
    totalInferenceBudget += position.inferenceBudget;
  }

  return {
    totalStaked,
    stakerCount,
    averageStake,
    totalVotingPower,
    totalInferenceBudget
  };
}

export function resetStaking(): void {
  stakingPositions.clear();
  unstakingRequests.clear();
}