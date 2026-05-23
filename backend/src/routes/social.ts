import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { socialEngine } from '../lib/social.js';
import { sanitizeString, sanitizeWallet, sanitizeForHTML } from '../types/index.js';
import { optionalWalletAuth } from '../middleware/auth.js';

interface ShareBody {
  wallet: string;
  promptId?: string;
  platform: 'twitter' | 'telegram' | 'copy';
}

interface ReferralBody {
  referrer: string;
  referee: string;
}

export async function socialRoutes(fastify: FastifyInstance) {
  fastify.post('/api/share', async (request: FastifyRequest<{ Body: ShareBody }>, reply: FastifyReply) => {
    const auth = optionalWalletAuth(request);
    const body = request.body;
    const platform = body.platform;

    if (!auth.wallet || auth.wallet === 'anonymous' || !platform) {
      return reply.status(400).send({ error: 'wallet and platform are required' });
    }

    const promptId = sanitizeForHTML(body.promptId, 50) || 'none';
    const share = socialEngine.createShareLink(auth.wallet, promptId, platform);

    return {
      success: true,
      share: {
        id: share.id,
        url: share.url,
        content: share.content,
        clicks: share.clicks
      }
    };
  });

  fastify.get('/api/share/:shareId', async (request: FastifyRequest<{ Params: { shareId: string } }>, _reply: FastifyReply) => {
    const { shareId } = request.params;
    socialEngine.trackClick(shareId);
    return { success: true };
  });

  fastify.post('/api/referral', async (request: FastifyRequest<{ Body: ReferralBody }>, reply: FastifyReply) => {
    const body = request.body;
    const referrer = sanitizeWallet(body.referrer);
    const referee = sanitizeWallet(body.referee);
    
    if (!referrer || !referee || referrer === 'anonymous' || referee === 'anonymous') {
      return reply.status(400).send({ error: 'valid referrer and referee wallet addresses are required' });
    }

    const referral = socialEngine.createReferral(referrer, referee);
    
    return {
      success: true,
      referral: {
        id: referral.id,
        reward: referral.reward,
        status: referral.status
      }
    };
  });

  fastify.get('/api/referrals/:wallet', async (request: FastifyRequest<{ Params: { wallet: string } }>, _reply: FastifyReply) => {
    const { wallet } = request.params;
    return { referrals: socialEngine.getReferrals(wallet) };
  });

  fastify.get('/api/social/metrics', async (_request, _reply) => {
    return socialEngine.getMetrics();
  });

  fastify.get('/api/social/twitter', async (request: FastifyRequest<{ Querystring: { promptId?: string } }>, _reply: FastifyReply) => {
    const promptId = sanitizeString(request.query['promptId'] as string || 'general', 50);
    return {
      text: socialEngine.getTwitterShareText(promptId),
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(socialEngine.getTwitterShareText(promptId))}`
    };
  });
}