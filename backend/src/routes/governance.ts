import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { ProposalStatus } from '../types/index.js';
import {
  createProposal,
  castVote,
  delegate,
  getDelegations,
  getDelegators,
  getVotes,
  finalizeProposal,
  executeProposal,
  getProposal,
  getAllProposals,
  getVoterWeight,
  getGovernanceStats,
  castPublicVote,
  delegatePublicVote,
  getVotingLeaderboard
} from '../services/governance.js';
import { reflectVoteFromPrompt } from '../lib/voting.js';
import { getState, checkRateLimit, setRateLimitHeaders, getClientIp } from '../services/state.js';
import { sanitizeString, sanitizeForHTML, isValidWalletAddress, detectPromptInjection } from '../types/index.js';
import { requireWalletWithSignature, optionalWalletAuth } from '../middleware/auth.js';

interface ProposalBody {
  title: string;
  description: string;
  category: string;
  deposit: string;
  executionData?: string;
  isEmergency?: boolean;
}

interface VoteBody {
  proposalId: string;
  vote: 'for' | 'against' | 'abstain';
}

interface DelegateBody {
  delegate: string;
  power?: string;
}

export async function governanceRoutes(fastify: FastifyInstance) {
  fastify.get('/api/governance/config', async (_request, _reply) => {
    return { minDeposit: 1000, votingPeriod: 7 };
  });

  fastify.get('/api/governance/stats', async (_request, _reply) => {
    const stats = getGovernanceStats();
    return {
      totalProposals: stats.totalProposals,
      activeProposals: stats.activeProposalsCount,
      totalVotes: stats.totalVotes,
      totalDelegations: stats.totalDelegations,
      totalSupply: stats.totalSupply.toString(),
      quorumRequired: stats.quorumRequired.toString(),
      avgParticipation: stats.avgParticipation,
      categories: stats.categories
    };
  });

  fastify.post('/api/governance/proposal', async (request: FastifyRequest<{ Body: ProposalBody }>, reply: FastifyReply) => {
    const auth = requireWalletWithSignature(request, reply);
    if (!auth.isValidWallet) {
      return;
    }
    const body = request.body;
    const title = sanitizeForHTML(body.title, 200);
    const description = sanitizeForHTML(body.description, 5000);

    const titleInjection = detectPromptInjection(title);
    if (titleInjection.isInjection) {
      return reply.status(400).send({ error: 'Proposal title contains suspicious patterns' });
    }

    const descInjection = detectPromptInjection(description);
    if (descInjection.isInjection) {
      return reply.status(400).send({ error: 'Proposal description contains suspicious patterns' });
    }

    const category = sanitizeString(body.category, 50);
    const { deposit, executionData, isEmergency } = body;

    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(clientIp, 'proposal', auth.wallet);
    setRateLimitHeaders(reply, rateLimit);

    if (!rateLimit.allowed) {
      return reply.status(429).send({
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil(rateLimit.resetIn / 1000)
      });
    }

    if (!title || !description || !category || !deposit) {
      return reply.status(400).send({ error: 'title, description, category, and deposit are required' });
    }

    const result = createProposal(
      auth.wallet,
      title,
      description,
      category,
      BigInt(deposit),
      executionData ? sanitizeString(executionData, 1000) : null,
      isEmergency || false
    );

    if ('error' in result) {
      return reply.status(400).send({ error: result.error });
    }

    return { success: true, proposal: result };
  });

  fastify.get('/api/governance/proposals', async (request: FastifyRequest<{ Querystring: { status?: string; category?: string; proposer?: string } }>, _reply) => {
    const { status, category, proposer } = request.query as { status?: string; category?: string; proposer?: string };
    const validStatuses: ProposalStatus[] = ['draft', 'submitted', 'review', 'voting', 'closed', 'executed', 'rejected', 'cancelled'];
    const proposals = getAllProposals({ status: status && validStatuses.includes(status as ProposalStatus) ? status as ProposalStatus : undefined, category, proposer });
    return { proposals };
  });

  fastify.get('/api/governance/proposal/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
    const proposal = getProposal(request.params.id);
    if (!proposal) {
      return reply.status(404).send({ error: 'Proposal not found' });
    }
    return { proposal };
  });

  fastify.post('/api/governance/vote', async (request: FastifyRequest<{ Body: VoteBody }>, reply: FastifyReply) => {
    const auth = requireWalletWithSignature(request, reply);
    if (!auth.isValidWallet) {
      return;
    }
    const { proposalId, vote } = request.body;
    const sanitizedProposalId = sanitizeString(proposalId, 50);

    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(clientIp, 'vote', auth.wallet);
    setRateLimitHeaders(reply, rateLimit);

    if (!rateLimit.allowed) {
      return reply.status(429).send({
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil(rateLimit.resetIn / 1000)
      });
    }

    if (!sanitizedProposalId || !vote) {
      return reply.status(400).send({ error: 'proposalId and vote are required' });
    }

    if (!['for', 'against', 'abstain'].includes(vote)) {
      return reply.status(400).send({ error: 'Invalid vote type' });
    }

    const result = castVote(auth.wallet, sanitizedProposalId, vote);
    if ('error' in result) {
      return reply.status(400).send({ error: result.error });
    }

    return { success: true, vote: result };
  });

  fastify.get('/api/governance/votes/:proposalId', async (request: FastifyRequest<{ Params: { proposalId: string } }>, _reply) => {
    const votes = getVotes(request.params.proposalId);
    return { votes };
  });

  fastify.post('/api/governance/delegate', async (request: FastifyRequest<{ Body: DelegateBody }>, reply) => {
    const auth = requireWalletWithSignature(request, reply);
    if (!auth.isValidWallet) {
      return;
    }
    const { delegate: delegateAddress, power } = request.body;
    const sanitizedDelegate = sanitizeString(delegateAddress, 50);

    if (!sanitizedDelegate) {
      return reply.status(400).send({ error: 'delegate address is required' });
    }

    if (!isValidWalletAddress(sanitizedDelegate) && sanitizedDelegate !== 'anonymous') {
      return reply.status(400).send({ error: 'Invalid delegate address format' });
    }

    const result = delegate(auth.wallet, sanitizedDelegate, power ? BigInt(power) : undefined);
    if ('error' in result) {
      return reply.status(400).send({ error: result.error });
    }

    return { success: true, delegation: result };
  });

  fastify.get('/api/governance/delegations/:wallet', async (request: FastifyRequest<{ Params: { wallet: string } }>, _reply) => {
    const delegations = getDelegations(request.params.wallet);
    return { delegations };
  });

  fastify.get('/api/governance/delegators/:wallet', async (request: FastifyRequest<{ Params: { wallet: string } }>, _reply) => {
    const delegators = getDelegators(request.params.wallet);
    return { delegators };
  });

  fastify.get('/api/governance/weight/:wallet', async (request: FastifyRequest<{ Params: { wallet: string } }>, _reply) => {
    return getVoterWeight(request.params.wallet);
  });

  fastify.post('/api/governance/finalize/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const auth = requireWalletWithSignature(request, reply);
    if (!auth.isValidWallet || !auth.signatureVerified) {
      return reply.status(403).send({ error: 'Admin signature required' });
    }
    const adminWalletsEnv = process.env.ADMIN_WALLETS || '';
    if (!adminWalletsEnv) {
      return reply.status(403).send({ error: 'Unauthorized: admin wallets not configured' });
    }
    const adminWallets = adminWalletsEnv.split(',').map(w => w.trim().toLowerCase()).filter(Boolean);
    if (adminWallets.length > 0 && !adminWallets.includes(auth.wallet.toLowerCase())) {
      return reply.status(403).send({ error: 'Unauthorized: only admin wallets can finalize proposals' });
    }
    const result = finalizeProposal(request.params.id);
    return { result };
  });

  fastify.post('/api/governance/execute/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const auth = requireWalletWithSignature(request, reply);
    if (!auth.isValidWallet || !auth.signatureVerified) {
      return reply.status(403).send({ error: 'Admin signature required' });
    }
    const adminWalletsEnv = process.env.ADMIN_WALLETS || '';
    if (!adminWalletsEnv) {
      return reply.status(403).send({ error: 'Unauthorized: admin wallets not configured' });
    }
    const adminWallets = adminWalletsEnv.split(',').map(w => w.trim().toLowerCase()).filter(Boolean);
    if (adminWallets.length > 0 && !adminWallets.includes(auth.wallet.toLowerCase())) {
      return reply.status(403).send({ error: 'Unauthorized: only admin wallets can execute proposals' });
    }
    const result = executeProposal(request.params.id);
    if (!result.success) {
      return reply.status(400).send({ error: result.error });
    }
    return { success: true };
  });

  fastify.get('/api/governance/public/vote/:proposalId', async (request: FastifyRequest<{ Params: { proposalId: string } }>, reply) => {
    const { proposalId } = request.params;
    const proposal = getProposal(proposalId);

    if (!proposal) {
      return reply.status(404).send({ error: 'Proposal not found' });
    }

    return {
      proposal: {
        id: proposal.id,
        title: proposal.title,
        description: proposal.description,
        category: proposal.category,
        type: proposal.type,
        status: proposal.status,
        votesFor: proposal.votesFor.toString(),
        votesAgainst: proposal.votesAgainst.toString(),
        votesAbstain: proposal.votesAbstain.toString(),
        deadline: proposal.deadline,
        createdAt: proposal.createdAt
      },
      yourVote: null,
      canVote: proposal.status === 'review' || proposal.status === 'voting'
    };
  });

  fastify.post('/api/governance/public/vote', async (request: FastifyRequest<{ Body: { proposalId: string; vote: 'for' | 'against' | 'abstain' } }>, reply: FastifyReply) => {
    const body = request.body;
    const proposalId = sanitizeString(body.proposalId, 50);
    const vote = body.vote;
    const auth = optionalWalletAuth(request);

    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(clientIp, 'publicVote', auth.wallet);
    setRateLimitHeaders(reply, rateLimit);

    if (!rateLimit.allowed) {
      return reply.status(429).send({
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil(rateLimit.resetIn / 1000)
      });
    }

    if (!proposalId || !vote) {
      return reply.status(400).send({ error: 'proposalId and vote are required' });
    }

    if (!['for', 'against', 'abstain'].includes(vote)) {
      return reply.status(400).send({ error: 'Invalid vote type' });
    }

    let result;
    if (auth.isValidWallet) {
      result = reflectVoteFromPrompt(auth.wallet, proposalId, vote);
    } else {
      result = castPublicVote(proposalId, vote, request);
    }

    if ('error' in result) {
      return reply.status(400).send({ error: result.error });
    }

    return { success: true, vote: result };
  });

  fastify.get('/api/governance/proposals/active', async (_request, _reply) => {
    const state = getState();
    const activeProposals = state.proposals.filter(
      p => p.status === 'review' || p.status === 'voting'
    );

    return {
      proposals: activeProposals.map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        category: p.category,
        type: p.type,
        status: p.status,
        votesFor: p.votesFor.toString(),
        votesAgainst: p.votesAgainst.toString(),
        votesAbstain: p.votesAbstain.toString(),
        deadline: p.deadline,
        createdAt: p.createdAt,
        totalVotingWeight: p.totalVotingWeight.toString()
      })),
      count: activeProposals.length
    };
  });

  fastify.get('/api/governance/leaderboard', async (request: FastifyRequest<{ Querystring: { limit?: string } }>, _reply) => {
    const limit = request.query?.limit ? parseInt(request.query.limit as string, 10) : 10;
    const leaderboard = getVotingLeaderboard(limit);

    return {
      leaderboard: leaderboard.map(entry => ({
        wallet: entry.wallet,
        totalVotes: entry.totalVotes,
        proposalsVoted: entry.proposalsVoted,
        quadraticWeightSum: entry.quadraticWeightSum.toString()
      }))
    };
  });

  fastify.post('/api/governance/public/delegate', async (request: FastifyRequest<{ Body: { proposalId: string; delegate: string; vote: 'for' | 'against' | 'abstain' } }>, reply) => {
    const auth = requireWalletWithSignature(request, reply);
    if (!auth.isValidWallet) {
      return;
    }
    const body = request.body;
    const proposalId = sanitizeString(body.proposalId, 50);
    const delegateAddress = sanitizeString(body.delegate, 50);
    const vote = body.vote;

    if (!proposalId || !delegateAddress || !vote) {
      return reply.status(400).send({ error: 'proposalId, delegate, and vote are required' });
    }

    if (!isValidWalletAddress(delegateAddress)) {
      return reply.status(400).send({ error: 'Invalid delegate address format' });
    }

    const result = delegatePublicVote(auth.wallet, delegateAddress, proposalId, vote);

    if (!result.success) {
      return reply.status(400).send({ error: result.error });
    }

    return { success: true };
  });
}