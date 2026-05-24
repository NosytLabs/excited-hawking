import Fastify from 'fastify';
import cors from '@fastify/cors';
import { statusRoutes } from './routes/status.js';
import { promptRoutes } from './routes/prompt.js';
import { voteRoutes } from './routes/vote.js';
import { logsRoutes } from './routes/logs.js';
import { priceRoutes } from './routes/price.js';
import { socialRoutes } from './routes/social.js';
import { emergenceRoutes } from './routes/emergence.js';
import { memoryRoutes } from './routes/memory.js';
import { governanceRoutes } from './routes/governance.js';
import { agentRoutes } from './routes/agent.js';
import { stakingRoutes } from './routes/staking.js';
import { checkRateLimit, getClientIp } from './services/state.js';
import { getIO } from './services/websocket.js';
import type { FastifyInstance } from 'fastify';

const ALLOWED_ORIGINS = process.env.NODE_ENV === 'production'
  ? (process.env.ALLOWED_ORIGINS?.split(',').map((origin) => origin.trim()).filter(Boolean) || ['https://peoplesagent.ai'])
  : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'];

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: true
  });

  await app.register(cors, {
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      callback(null, ALLOWED_ORIGINS.includes(origin));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-wallet-address', 'x-signature', 'x-message'],
    credentials: true
  });

app.addHook('onRequest', async (request, reply) => {
    const securityHeaders = {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': "default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self';"
    };

    for (const [key, value] of Object.entries(securityHeaders)) {
      reply.header(key, value);
    }

    if (request.raw.url && request.raw.url.startsWith('/socket.io/')) {
      reply.hijack();
      try {
        getIO().engine.handleRequest(request.raw, reply.raw);
      } catch (err) {
        request.log.error(err, 'Error handling socket.io request');
      }
      return;
    }

    const ip = getClientIp(request);
    const result = checkRateLimit(ip, 'general', undefined);
    
    if (!result.allowed) {
      return reply.status(429).send({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${Math.ceil(result.resetIn / 1000)} seconds.`,
        retryAfter: Math.ceil(result.resetIn / 1000)
      });
    }

    reply.header('X-RateLimit-Limit', String(result.limit));
    reply.header('X-RateLimit-Remaining', String(result.remaining));
    reply.header('X-RateLimit-Reset', String(Math.ceil((Date.now() + result.resetIn) / 1000)));
  });

  await app.register(statusRoutes);
  await app.register(promptRoutes);
  await app.register(voteRoutes);
  await app.register(logsRoutes);
  await app.register(priceRoutes);
  await app.register(socialRoutes);
  await app.register(emergenceRoutes);
  await app.register(memoryRoutes);
  await app.register(governanceRoutes);
  await app.register(agentRoutes);
  await app.register(stakingRoutes);

  app.get('/health', async (_request, reply) => {
    return reply.send({
      status: 'ok',
      timestamp: Date.now(),
      uptime: process.uptime()
    });
  });

  app.setErrorHandler((error: Error & { statusCode?: number; validation?: unknown }, request, reply) => {
    request.log.error(error);
    
    if (error.validation) {
      return reply.status(400).send({
        error: 'Validation Error',
        message: error.message,
        statusCode: 400
      });
    }
    
    const statusCode = error.statusCode || 500;
    return reply.status(statusCode).send({
      error: error.name || 'Internal Server Error',
      message: statusCode === 500 ? 'An unexpected error occurred' : error.message,
      statusCode
    });
  });

  return app;
}

export { type FastifyInstance };
