import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getLogs } from '../services/state.js';

export async function logsRoutes(fastify: FastifyInstance) {
  fastify.get('/api/logs', async (request: FastifyRequest<{ Querystring: { limit?: string } }>, reply: FastifyReply) => {
    const limit = parseInt(request.query['limit'] || '100');
    let isSent = false;

    reply.raw.on('close', () => {
      isSent = true;
    });

    const sendLogEntry = () => {
      if (isSent || reply.raw.writableEnded) return;
      const logs = getLogs().slice(0, limit);
      const data = JSON.stringify({ logs, timestamp: Date.now() });
      reply.raw.write(`data: ${data}\n\n`);
    };

    sendLogEntry();

    const interval = setInterval(() => {
      if (isSent || reply.raw.writableEnded) {
        clearInterval(interval);
        return;
      }
      sendLogEntry();
    }, 1000);

    reply.raw.on('close', () => {
      clearInterval(interval);
    });

    return reply;
  });

  fastify.get('/api/logs/list', async (request: FastifyRequest<{ Querystring: { limit?: string } }>, _reply: FastifyReply) => {
    const limit = parseInt(request.query['limit'] || '100');
    const logs = getLogs().slice(0, limit);
    return { logs, total: getLogs().length };
  });
}