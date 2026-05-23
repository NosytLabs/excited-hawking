import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getPrompts, addPrompt, updatePromptStatus, checkRateLimit, setRateLimitHeaders, getClientIp } from '../services/state.js';
import { emitPromptNew, emitQueueUpdate, emitPromptComplete } from '../services/websocket.js';
import { submitPromptAndAutoVote } from '../services/governance.js';
import { processPrompt } from '../lib/agent.js';
import { sanitizeString, sanitizeForHTML, isValidWalletAddress } from '../types/index.js';
import { generateId } from '../lib/crypto.js';

interface PromptBody {
  content: string;
  wallet?: string;
}

export async function promptRoutes(fastify: FastifyInstance) {
  fastify.post('/api/prompt', async (request: FastifyRequest<{ Body: PromptBody }>, reply: FastifyReply) => {
    const body = request.body;
    const content = sanitizeForHTML(body.content, 5000);
    let wallet = body.wallet || 'anonymous';
    if (wallet !== 'anonymous') {
      wallet = sanitizeString(wallet);
      if (!isValidWalletAddress(wallet)) {
        wallet = 'anonymous';
      }
    }
    const clientIp = getClientIp(request);

    const rateLimit = checkRateLimit(clientIp, 'prompt', wallet);
    setRateLimitHeaders(reply, rateLimit);

    if (!rateLimit.allowed) {
      return reply.status(429).send({
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil(rateLimit.resetIn / 1000)
      });
    }

    if (!content || content.length === 0) {
      return reply.status(400).send({ error: 'Prompt content is required' });
    }

    const promptId = generateId();
    const prompt = {
      id: promptId,
      wallet,
      content,
      tier: 'free' as const,
      diemAmount: 0n,
      status: 'queued' as const,
      votes: 0,
      createdAt: Date.now()
    };

    addPrompt(prompt);

    const prompts = getPrompts();
    emitPromptNew(prompt.id, prompt.content, wallet);
    emitQueueUpdate(prompts);

    const autoVotes = submitPromptAndAutoVote(wallet);

    updatePromptStatus(promptId, 'processing');

    try {
      const response = await processPrompt(wallet, content, promptId);

      updatePromptStatus(promptId, 'completed');
      emitPromptComplete(promptId);

      return {
        success: true,
        promptId: prompt.id,
        queuePosition: prompts.findIndex(p => p.id === prompt.id) + 1,
        estimatedWait: (prompts.findIndex(p => p.id === prompt.id) + 1) * 30,
        response,
        autoVotes: autoVotes.length > 0 ? {
          count: autoVotes.length,
          proposals: autoVotes.map(v => ({
            proposalId: v.proposalId,
            vote: v.vote.vote
          }))
        } : undefined
      };
    } catch (error) {
      updatePromptStatus(promptId, 'failed');
      console.error('Agent processing error:', error);
      return {
        success: false,
        promptId: prompt.id,
        error: 'Agent processing failed',
        queuePosition: prompts.findIndex(p => p.id === prompt.id) + 1,
        estimatedWait: (prompts.findIndex(p => p.id === prompt.id) + 1) * 30
      };
    }
  });

  fastify.get('/api/queue', async (_request, _reply) => {
    const prompts = getPrompts();
    return {
      prompts: prompts.filter(p => p.status === 'queued'),
      total: prompts.length,
      processing: prompts.filter(p => p.status === 'processing').length
    };
  });
}