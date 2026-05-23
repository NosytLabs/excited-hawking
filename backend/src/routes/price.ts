import type { FastifyInstance } from 'fastify';

export async function priceRoutes(fastify: FastifyInstance) {
  fastify.get('/api/price', async (_request, _reply) => {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana,usd-coin&vs_currencies=usd');
      const data = await response.json() as { solana: { usd: number }; 'usd-coin': { usd: number } };
      
      return {
        SOL: data.solana?.usd ?? 0,
        USDC: data['usd-coin']?.usd ?? 1,
        ratio: (data.solana?.usd ?? 0) / (data['usd-coin']?.usd ?? 1),
        timestamp: Date.now()
      };
    } catch {
      return {
        SOL: 180,
        USDC: 1,
        ratio: 180,
        timestamp: Date.now(),
        fallback: true
      };
    }
  });
}