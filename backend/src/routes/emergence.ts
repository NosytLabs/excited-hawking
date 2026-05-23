import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { conwayEngine } from '../lib/emergence.js';
import { memoryEngine } from '../lib/memory.js';

export async function emergenceRoutes(fastify: FastifyInstance) {
  fastify.get('/api/emergence/state', async (_request, _reply) => {
    const state = conwayEngine.getGridState();
    const score = conwayEngine.getEmergenceScore();
    const events = conwayEngine.getRecentEvents(5);
    
    return {
      grid: state.grid,
      generation: state.generation,
      alive: state.alive,
      density: state.density,
      emergenceScore: score,
      recentEvents: events
    };
  });

  fastify.post('/api/emergence/step', async (_request, _reply) => {
    const result = conwayEngine.step();
    return result;
  });

  fastify.post('/api/emergence/seed', async (request: FastifyRequest<{ Body: { prompts: string[] } }>, reply: FastifyReply) => {
    const { prompts } = request.body;
    if (!prompts || !Array.isArray(prompts)) {
      return reply.status(400).send({ error: 'prompts array is required' });
    }
    conwayEngine.seedFromPrompts(prompts);
    const state = conwayEngine.getGridState();
    return { success: true, ...state };
  });

  fastify.get('/api/emergence/events', async (request: FastifyRequest<{ Querystring: { limit?: string } }>, _reply: FastifyReply) => {
    const limit = parseInt(request.query['limit'] || '10');
    return { events: conwayEngine.getRecentEvents(limit) };
  });

  fastify.post('/api/emergence/reset', async (_request, _reply) => {
    conwayEngine.reset();
    return { success: true };
  });

  fastify.get('/api/memory/consciousness', async (_request, _reply) => {
    const consciousness = memoryEngine.getConsciousness();
    const dreamState = memoryEngine.getDreamState();
    
    return {
      consciousness,
      dreamDepth: dreamState.dreamDepth,
      recentDreams: dreamState.dreams.slice(-5),
      lastDream: dreamState.lastDream
    };
  });

  fastify.post('/api/memory/dream', async (_request, _reply) => {
    const dream = memoryEngine.processDream();
    return { dream, dreamState: memoryEngine.getDreamState() };
  });

  fastify.get('/api/memory/:wallet', async (request: FastifyRequest<{ Params: { wallet: string } }>, _reply: FastifyReply) => {
    const { wallet } = request.params;
    const memories = memoryEngine.getRecentMemories(wallet);
    return { memories };
  });
}