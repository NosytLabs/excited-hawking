import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getState, getBalance, calculateTier } from '../services/state.js';

export async function statusRoutes(fastify: FastifyInstance) {
  fastify.get('/api/status', async (request: FastifyRequest, _reply: FastifyReply) => {
    const wallet = request.headers['x-wallet-address'] as string || 'anonymous';
    const balance = getBalance(wallet);
    const state = getState();
    
    return {
      agent: {
        tier: calculateTier(Number(balance) / 1e6),
        diemStaked: Number(balance) / 1e6,
        treasuryUSDC: state.treasuryUSDC,
        status: 'alive',
        uptime: process.uptime(),
        version: '1.0.0'
      },
      wallet,
      balance: balance.toString(),
      timestamp: Date.now()
    };
  });
}