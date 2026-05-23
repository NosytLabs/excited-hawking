import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { processPrompt, getAgentStatus, getRecentMemories, triggerDream } from '../lib/agent.js';
import { updatePromptStatus } from '../services/state.js';
import { emitPromptComplete } from '../services/websocket.js';
import { generateId } from '../lib/crypto.js';

interface PromptBody {
  prompt: string;
  wallet?: string;
}

interface DreamBody {
  wallet?: string;
}

export async function agentRoutes(fastify: FastifyInstance) {
  fastify.post('/api/agent/prompt', async (request: FastifyRequest<{ Body: PromptBody }>, reply: FastifyReply) => {
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

      return {
        success: true,
        promptId,
        response,
        wallet
      };
    } catch (error) {
      updatePromptStatus(promptId, 'failed');
      console.error('Agent processing error:', error);
      return reply.status(500).send({
        error: 'Agent processing failed',
        message: error instanceof Error ? error.message : 'Unknown error'
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
      console.error('Dream processing error:', error);
      return reply.status(500).send({
        error: 'Dream processing failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}