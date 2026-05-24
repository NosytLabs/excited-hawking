import { generateId } from './crypto.js';

interface SocialShare {
  id: string;
  wallet: string;
  platform: 'twitter' | 'telegram' | 'copy';
  content: string;
  url: string;
  timestamp: number;
  clicks: number;
}

interface Referral {
  id: string;
  referrer: string;
  referee: string;
  status: 'pending' | 'completed' | 'rewarded';
  reward: number;
  timestamp: number;
}

interface SocialMetrics {
  totalShares: number;
  totalClicks: number;
  referralCount: number;
  topSharers: { wallet: string; shares: number }[];
}

const MAX_REFERRALS = 10000;

class SocialEngine {
  private shares: Map<string, SocialShare[]> = new Map();
  private referrals: Referral[] = [];
  private agentUrl: string;

  constructor() {
    this.agentUrl = 'https://peoples.agent';
  }

  createShareLink(wallet: string, promptId: string, platform: SocialShare['platform']): SocialShare {
    const shareId = generateId();
    
    const templates: Record<SocialShare['platform'], string> = {
      twitter: `I just prompted The Peoples Agent - a living AI organism on Base! Join the experiment: ${this.agentUrl}?ref=${wallet}&prompt=${promptId}`,
      telegram: `Check out The Peoples Agent - a living AI organism with Conway's Game of Life emergence! Join here: ${this.agentUrl}?ref=${wallet}`,
      copy: `${this.agentUrl}?ref=${wallet}&prompt=${promptId}`
    };

    const content = templates[platform];
    
    const share: SocialShare = {
      id: shareId,
      wallet,
      platform,
      content,
      url: platform === 'copy' ? `${this.agentUrl}?ref=${wallet}` : content,
      timestamp: Date.now(),
      clicks: 0
    };

    if (!this.shares.has(wallet)) {
      this.shares.set(wallet, []);
    }
    this.shares.get(wallet)!.push(share);

    return share;
  }

  trackClick(shareId: string): void {
    for (const shares of this.shares.values()) {
      const share = shares.find(s => s.id === shareId);
      if (share) {
        share.clicks++;
        break;
      }
    }
  }

  createReferral(referrer: string, referee: string): Referral {
    const referral: Referral = {
      id: generateId(),
      referrer,
      referee,
      status: 'pending',
      reward: 10,
      timestamp: Date.now()
    };
    this.referrals.push(referral);
    if (this.referrals.length > MAX_REFERRALS) {
      this.referrals = this.referrals.slice(-MAX_REFERRALS);
    }
    return referral;
  }

  completeReferral(referralId: string): void {
    const referral = this.referrals.find(r => r.id === referralId);
    if (referral) {
      referral.status = 'completed';
    }
  }

  getReferrals(wallet: string): Referral[] {
    return this.referrals.filter(r => r.referrer === wallet || r.referee === wallet);
  }

  getMetrics(): SocialMetrics {
    let totalShares = 0;
    let totalClicks = 0;
    const sharerCounts = new Map<string, number>();

    for (const [wallet, shares] of this.shares.entries()) {
      totalShares += shares.length;
      totalClicks += shares.reduce((sum, s) => sum + s.clicks, 0);
      sharerCounts.set(wallet, (sharerCounts.get(wallet) || 0) + shares.length);
    }

    const topSharers = Array.from(sharerCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([wallet, shares]) => ({ wallet, shares }));

    return {
      totalShares,
      totalClicks,
      referralCount: this.referrals.length,
      topSharers
    };
  }

  getShareUrl(wallet: string, promptId: string): string {
    return `${this.agentUrl}?ref=${wallet}&prompt=${promptId}`;
  }

  getTwitterShareText(promptId: string): string {
    return `I just prompted The Peoples Agent - a living AI organism on @base with Conway's Game of Life emergence! Join the experiment: ${this.agentUrl}?prompt=${promptId}`;
  }
}

export const socialEngine = new SocialEngine();
export type { SocialShare, Referral, SocialMetrics };