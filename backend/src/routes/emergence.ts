import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { conwayEngine } from '../lib/emergence.js';

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
}

const activityEvents: Array<{
  id: string;
  type: 'prompt' | 'vote' | 'governance' | 'stake';
  description: string;
  address: string;
  timestamp: number;
}> = [];

export function addActivityEvent(
  type: 'prompt' | 'vote' | 'governance' | 'stake',
  description: string,
  address: string
): void {
  activityEvents.unshift({
    id: Date.now().toString(),
    type,
    description,
    address,
    timestamp: Date.now()
  });
  if (activityEvents.length > 100) activityEvents.pop();
}

export async function activityRoutes(fastify: FastifyInstance) {
  fastify.get('/api/activity', async (_request, _reply) => {
    return {
      events: activityEvents.slice(0, 20),
      count: activityEvents.length
    };
  });
}