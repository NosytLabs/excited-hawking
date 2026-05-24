import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { memoryEngine } from '../lib/memory.js';

export async function memoryRoutes(fastify: FastifyInstance) {
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
