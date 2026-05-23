import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  stakeDiem,
  requestUnstake,
  processUnstakeRequest,
  getStakingPosition,
  getUnstakingRequests,
  getStakingConfig,
  updateStakingConfig,
  getInferenceBudget,
  getVotingPower,
  getStakeStats,
  calculateInferenceBudget
} from '../services/staking.js';
import { checkRateLimit, setRateLimitHeaders, getClientIp } from '../services/state.js';
import { getBalance } from '../services/state.js';

interface StakeBody {
  wallet: string;
  amount: string;
}

interface UnstakeBody {
  wallet: string;
  amount: string;
}

interface UnstakeProcessBody {
  wallet: string;
  requestId: string;
}

interface ConfigBody {
  updates?: {
    minStakeAmount?: string;
    maxStakeAmount?: string;
    unstakeTimelockDuration?: number;
    inferenceBudgetPerDiem?: string;
    quadraticWeightMultiplier?: string;
  };
}

export async function stakingRoutes(fastify: FastifyInstance) {
  fastify.post('/api/staking/stake', async (request: FastifyRequest<{ Body: StakeBody }>, reply: FastifyReply) => {
    const { wallet, amount } = request.body;
    const clientIp = getClientIp(request);

    const rateLimit = checkRateLimit(clientIp, 'general', wallet);
    setRateLimitHeaders(reply, rateLimit);

    if (!rateLimit.allowed) {
      return reply.status(429).send({
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil(rateLimit.resetIn / 1000)
      });
    }

    if (!wallet || !amount) {
      return reply.status(400).send({ error: 'wallet and amount are required' });
    }

    const amountBigInt = BigInt(amount);

    if (amountBigInt <= 0n) {
      return reply.status(400).send({ error: 'Amount must be positive' });
    }

    const result = stakeDiem(wallet, amountBigInt);

    if (!result.success) {
      return reply.status(400).send({ error: result.error });
    }

    return {
      success: true,
      position: {
        wallet: result.position!.wallet,
        amount: result.position!.amount.toString(),
        votingPower: result.position!.votingPower.toString(),
        inferenceBudget: result.position!.inferenceBudget.toString(),
        lastUpdated: result.position!.lastUpdated
      },
      liquidBalance: getBalance(wallet).toString()
    };
  });

  fastify.post('/api/staking/unstake-request', async (request: FastifyRequest<{ Body: UnstakeBody }>, reply: FastifyReply) => {
    const { wallet, amount } = request.body;
    const clientIp = getClientIp(request);

    const rateLimit = checkRateLimit(clientIp, 'general', wallet);
    setRateLimitHeaders(reply, rateLimit);

    if (!rateLimit.allowed) {
      return reply.status(429).send({
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil(rateLimit.resetIn / 1000)
      });
    }

    if (!wallet || !amount) {
      return reply.status(400).send({ error: 'wallet and amount are required' });
    }

    const amountBigInt = BigInt(amount);

    if (amountBigInt <= 0n) {
      return reply.status(400).send({ error: 'Amount must be positive' });
    }

    const result = requestUnstake(wallet, amountBigInt);

    if (!result.success) {
      return reply.status(400).send({ error: result.error });
    }

    return {
      success: true,
      request: {
        id: result.request!.id,
        wallet: result.request!.wallet,
        amount: result.request!.amount.toString(),
        requestedAt: result.request!.requestedAt,
        unlockableAt: result.request!.unlockableAt,
        status: result.request!.status
      }
    };
  });

  fastify.post('/api/staking/unstake-process', async (request: FastifyRequest<{ Body: UnstakeProcessBody }>, reply: FastifyReply) => {
    const { wallet, requestId } = request.body;

    if (!wallet || !requestId) {
      return reply.status(400).send({ error: 'wallet and requestId are required' });
    }

    const result = processUnstakeRequest(wallet, requestId);

    if (!result.success) {
      return reply.status(400).send({ error: result.error });
    }

    return {
      success: true,
      newLiquidBalance: getBalance(wallet).toString()
    };
  });

  fastify.get('/api/staking/position/:wallet', async (request: FastifyRequest<{ Params: { wallet: string } }>, _reply) => {
    const { wallet } = request.params;
    const position = getStakingPosition(wallet);

    if (!position) {
      return {
        wallet,
        hasPosition: false,
        stakedBalance: '0',
        votingPower: '0',
        inferenceBudget: '0'
      };
    }

    return {
      wallet,
      hasPosition: true,
      stakedBalance: position.amount.toString(),
      votingPower: position.votingPower.toString(),
      inferenceBudget: position.inferenceBudget.toString(),
      lastUpdated: position.lastUpdated,
      combinedVotingPower: getVotingPower(wallet).toString()
    };
  });

  fastify.get('/api/staking/unstake-requests/:wallet', async (request: FastifyRequest<{ Params: { wallet: string } }>, _reply) => {
    const { wallet } = request.params;
    const requests = getUnstakingRequests(wallet);

    return {
      wallet,
      requests: requests.map(r => ({
        id: r.id,
        amount: r.amount.toString(),
        requestedAt: r.requestedAt,
        unlockableAt: r.unlockableAt,
        status: r.status,
        isUnlockable: Date.now() >= r.unlockableAt && r.status === 'pending'
      })),
      pendingCount: requests.filter(r => r.status === 'pending' && Date.now() >= r.unlockableAt).length
    };
  });

  fastify.get('/api/staking/stats', async (_request, _reply) => {
    const stats = getStakeStats();

    return {
      totalStaked: stats.totalStaked.toString(),
      stakerCount: stats.stakerCount,
      averageStake: stats.averageStake.toString(),
      totalVotingPower: stats.totalVotingPower.toString(),
      totalInferenceBudget: stats.totalInferenceBudget.toString()
    };
  });

  fastify.get('/api/staking/config', async (_request, _reply) => {
    const config = getStakingConfig();

    return {
      minStakeAmount: config.minStakeAmount.toString(),
      maxStakeAmount: config.maxStakeAmount.toString(),
      unstakeTimelockDuration: config.unstakeTimelockDuration,
      unstakeTimelockDurationHours: config.unstakeTimelockDuration / (60 * 60 * 1000),
      inferenceBudgetPerDiem: config.inferenceBudgetPerDiem.toString(),
      quadraticWeightMultiplier: config.quadraticWeightMultiplier.toString()
    };
  });

  fastify.put('/api/staking/config', async (request: FastifyRequest<{ Body: ConfigBody }>, reply: FastifyReply) => {
    const { updates } = request.body;

    if (!updates) {
      return reply.status(400).send({ error: 'No updates provided' });
    }

    const parsed: {
    minStakeAmount?: bigint;
    maxStakeAmount?: bigint;
    unstakeTimelockDuration?: number;
    inferenceBudgetPerDiem?: bigint;
    quadraticWeightMultiplier?: bigint;
  } = {};

    if (updates.minStakeAmount) parsed.minStakeAmount = BigInt(updates.minStakeAmount);
    if (updates.maxStakeAmount) parsed.maxStakeAmount = BigInt(updates.maxStakeAmount);
    if (updates.unstakeTimelockDuration) parsed.unstakeTimelockDuration = updates.unstakeTimelockDuration;
    if (updates.inferenceBudgetPerDiem) parsed.inferenceBudgetPerDiem = BigInt(updates.inferenceBudgetPerDiem);
    if (updates.quadraticWeightMultiplier) parsed.quadraticWeightMultiplier = BigInt(updates.quadraticWeightMultiplier);

    updateStakingConfig(parsed);

    const newConfig = getStakingConfig();
    return {
      success: true,
      config: {
        minStakeAmount: newConfig.minStakeAmount.toString(),
        maxStakeAmount: newConfig.maxStakeAmount.toString(),
        unstakeTimelockDuration: newConfig.unstakeTimelockDuration,
        inferenceBudgetPerDiem: newConfig.inferenceBudgetPerDiem.toString(),
        quadraticWeightMultiplier: newConfig.quadraticWeightMultiplier.toString()
      }
    };
  });

  fastify.get('/api/staking/inference-budget/:wallet', async (request: FastifyRequest<{ Params: { wallet: string } }>, _reply) => {
    const { wallet } = request.params;
    const position = getStakingPosition(wallet);
    const budget = getInferenceBudget(wallet);

    return {
      wallet,
      stakedAmount: position?.amount.toString() ?? '0',
      inferenceBudget: budget.toString(),
      estimatedApiCalls: budget.toString()
    };
  });

  fastify.get('/api/staking/voting-power/:wallet', async (request: FastifyRequest<{ Params: { wallet: string } }>, _reply) => {
    const { wallet } = request.params;
    const position = getStakingPosition(wallet);
    const votingPower = getVotingPower(wallet);

    return {
      wallet,
      stakingVotingPower: position?.votingPower.toString() ?? '0',
      totalVotingPower: votingPower.toString(),
      hasStakingPosition: !!position
    };
  });

  fastify.post('/api/staking/calculate-budget', async (request: FastifyRequest<{ Body: { amount: string } }>, reply: FastifyReply) => {
    const { amount } = request.body;

    if (!amount) {
      return reply.status(400).send({ error: 'amount is required' });
    }

    const amountBigInt = BigInt(amount);
    const budget = calculateInferenceBudget(amountBigInt);
    const votingPower = amountBigInt > 0n ? (() => {
      const sqrt = (value: bigint): bigint => {
        if (value === 0n) return 0n;
        let x = value;
        let y = (x + 1n) >> 1n;
        while (y < x) { x = y; y = (x + value / x) >> 1n; }
        return x;
      };
      return sqrt(amountBigInt * 10000n);
    })() : 0n;

    return {
      amount,
      stakedAmount: amount,
      inferenceBudget: budget.toString(),
      votingPower: votingPower.toString(),
      estimatedApiCalls: budget.toString()
    };
  });
}