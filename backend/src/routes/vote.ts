import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { votePrompt, getPrompts, checkRateLimit, setRateLimitHeaders, getClientIp } from '../services/state.js';
import { emitQueueUpdate } from '../services/websocket.js';
import { sanitizeString } from '../types/index.js';
import { requireWalletWithSignature } from '../middleware/auth.js';

interface VoteBody {
  promptId: string;
  vote: 'up' | 'down';
  wallet?: string;
}

export async function voteRoutes(fastify: FastifyInstance) {
  fastify.post('/api/vote', async (request: FastifyRequest<{ Body: VoteBody }>, reply: FastifyReply) => {
    const auth = requireWalletWithSignature(request, reply);
    if (!auth.isValidWallet || !auth.signatureVerified) {
      return;
    }
    const { promptId, vote } = request.body;
    const wallet = auth.wallet;
    const sanitizedPromptId = sanitizeString(promptId, 50);
    const clientIp = getClientIp(request);

    const rateLimit = checkRateLimit(clientIp, 'vote', wallet);
    setRateLimitHeaders(reply, rateLimit);

    if (!rateLimit.allowed) {
      return reply.status(429).send({
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil(rateLimit.resetIn / 1000)
      });
    }

    if (!sanitizedPromptId || !vote) {
      return reply.status(400).send({ error: 'promptId and vote are required' });
    }

    if (vote === 'up') {
      votePrompt(sanitizedPromptId);
    }

    const prompts = getPrompts();
    emitQueueUpdate(prompts);

    return {
      success: true,
      promptId: sanitizedPromptId,
      vote,
      newVoteCount: prompts.find(p => p.id === sanitizedPromptId)?.votes ?? 0
    };
  });
}