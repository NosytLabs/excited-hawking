import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getLogs } from '../services/state.js';

export async function logsRoutes(fastify: FastifyInstance) {
  fastify.get('/api/logs', async (request: FastifyRequest<{ Querystring: { limit?: string } }>, reply: FastifyReply) => {
    const limit = parseInt(request.query['limit'] || '100');
    const logs = getLogs().slice(0, limit);
    
    reply.header('Content-Type', 'text/event-stream');
    reply.header('Cache-Control', 'no-cache');
    reply.header('Connection', 'keep-alive');

    const data = JSON.stringify({ logs, timestamp: Date.now() });
    reply.send(`data: ${data}\n\n`);

    return reply;
  });

  fastify.get('/api/logs/list', async (request: FastifyRequest<{ Querystring: { limit?: string } }>, _reply: FastifyReply) => {
    const limit = parseInt(request.query['limit'] || '100');
    const logs = getLogs().slice(0, limit);
    return { logs, total: getLogs().length };
  });
}