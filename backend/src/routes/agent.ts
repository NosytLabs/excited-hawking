import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { processPrompt, getAgentStatus, getRecentMemories, triggerDream } from '../lib/agent.js';
import { updatePromptStatus } from '../services/state.js';
import { emitPromptComplete } from '../services/websocket.js';
import { generateId } from '../lib/crypto.js';
import { addActivityEvent } from './emergence.js';

interface PromptBody {
  prompt: string;
  wallet?: string;
}

interface DreamBody {
  wallet?: string;
}

const promptSchema = {
  body: {
    type: 'object',
    required: ['prompt'],
    properties: {
      prompt: { type: 'string', minLength: 1 },
      wallet: { type: 'string' }
    }
  }
};

export async function agentRoutes(fastify: FastifyInstance) {
  fastify.post('/api/agent/prompt', { schema: promptSchema }, async (request: FastifyRequest<{ Body: PromptBody }>, reply: FastifyReply) => {
    const { prompt, wallet = 'anonymous' } = request.body;

    if (!prompt || prompt.trim().length === 0) {
      return reply.status(400).send({ error: 'Prompt content is required' });
    }

    const promptId = generateId();
    updatePromptStatus(promptId, 'processing');

    try {
      const response = await processPrompt(wallet, prompt.trim(), promptId);
      
      updatePromptStatus(promptId, 'completed');
      emitPromptComplete(promptId);
      addActivityEvent('prompt', `Prompt processed: ${prompt.trim().slice(0, 50)}...`, wallet);

      return {
        success: true,
        promptId,
        response,
        wallet
      };
    } catch (error) {
      updatePromptStatus(promptId, 'failed');
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred during agent processing'
      });
    }
  });

  fastify.get('/api/agent/status', async (_request, _reply) => {
    return getAgentStatus();
  });

  fastify.get('/api/agent/memory', async (request: FastifyRequest<{ Querystring: { limit?: string } }>, _reply) => {
    const limit = request.query.limit ? parseInt(request.query.limit, 10) : 50;
    const memories = getRecentMemories(limit);
    
    return {
      memories,
      count: memories.length
    };
  });

fastify.post('/api/agent/dream', async (_request: FastifyRequest<{ Body: DreamBody }>, reply: FastifyReply) => {
    try {
      const result = triggerDream();

      if (!result.success) {
        return {
          success: false,
          message: 'Dream could not be processed. Insufficient time since last dream or insufficient memories accumulated.'
        };
      }

      return {
        success: true,
        dream: result.dream,
        emergenceScore: result.emergenceScore,
        timestamp: Date.now()
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred during dream processing'
      });
    }
  });
}