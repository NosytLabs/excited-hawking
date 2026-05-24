import React, { useState, useCallback } from 'react';
import { useAgent } from '../context/useAgent';
import { Send, Link2, Check, Copy, TrendingUp, Sprout } from 'lucide-react';

interface ShareMetrics {
  totalShares: number;
  totalClicks: number;
  twitterShares: number;
  telegramShares: number;
  copyLinkClicks: number;
}

interface ReferralEntry {
  address: string;
  joinedAt: number;
  promptsCount: number;
}

interface SocialSharingProps {
  metrics?: ShareMetrics;
  topReferrers?: ReferralEntry[];
  recentShares?: Array<{ address: string; platform: 'twitter' | 'telegram' | 'copy'; timestamp: number }>;
  walletAddress?: string;
}

export const SocialSharing = React.memo(function SocialSharingComponent(
  props: SocialSharingProps
) {
  const {
    metrics: propMetrics,
    topReferrers: propReferrers,
    recentShares: propShares,
    walletAddress: propWallet,
  } = props;
  const { walletAddress: contextWallet } = useAgent();
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const walletAddress = propWallet || contextWallet || '';
  const agentUrl = typeof window !== 'undefined' ? window.location.origin : 'https://agent.thepeoplesagent.xyz';

  const referralCode = `ref_${walletAddress.replace(/0x/, '').toLowerCase()}`;
  const referralLink = `${agentUrl}?ref=${referralCode}`;

  const metrics = propMetrics || { totalShares: 0, totalClicks: 0, twitterShares: 0, telegramShares: 0, copyLinkClicks: 0 };

  const topReferrers = propReferrers || [];

  const [recentShares, setRecentShares] = useState<Array<{ address: string; platform: 'twitter' | 'telegram' | 'copy'; timestamp: number }>>(propShares || []);

  const handleCopyLink = useCallback(async () => {
    setIsSharing(true);
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setRecentShares(prev => [{ address: walletAddress, platform: 'copy', timestamp: Date.now() }, ...prev.slice(0, 9)]);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
    setIsSharing(false);
  }, [referralLink, walletAddress]);

  const handleTwitterShare = useCallback(() => {
    setIsSharing(true);
    const text = encodeURIComponent('Just discovered The Peoples Agent - a user-owned public AI that pays you for prompts. Join the decentralized AI revolution!');
    const url = encodeURIComponent(referralLink);
    window.open(`https://x.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'noopener,noreferrer,width=550,height=420');
    setRecentShares(prev => [{ address: walletAddress, platform: 'twitter', timestamp: Date.now() }, ...prev.slice(0, 9)]);
    setIsSharing(false);
  }, [referralLink, walletAddress]);

  const handleTelegramShare = useCallback(() => {
    setIsSharing(true);
    const text = encodeURIComponent(`Check out The Peoples Agent! ${referralLink}`);
    window.open(`https://t.me/share/url?url=${referralLink}&text=${text}`, '_blank', 'noopener,noreferrer');
    setRecentShares(prev => [{ address: walletAddress, platform: 'telegram', timestamp: Date.now() }, ...prev.slice(0, 9)]);
    setIsSharing(false);
  }, [referralLink, walletAddress]);

  const formatTimeAgo = useCallback((timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  }, []);

  if (!walletAddress) {
    return (
      <div className="glass-panel flex flex-col">
        <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{
          fontFamily: 'var(--font-display)',
          color: 'var(--color-bark)',
          borderBottom: '1px solid var(--color-sand-line)',
          paddingBottom: '0.5rem',
        }}>
          <Sprout size={16} style={{ color: 'var(--color-sage)' }} />
          Share & Earn
        </h3>
        <p className="text-xs text-center py-8" style={{ color: 'var(--color-stone)' }}>
          Connect wallet to share
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel flex flex-col">
      <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{
        fontFamily: 'var(--font-display)',
        color: 'var(--color-bark)',
        borderBottom: '1px solid var(--color-sand-line)',
        paddingBottom: '0.5rem',
      }}>
        <Sprout size={16} style={{ color: 'var(--color-sage)' }} aria-hidden="true" />
        Share & Earn
      </h3>

      <div className="mb-4 p-3 rounded-lg" style={{
        background: 'linear-gradient(135deg, color-mix(in oklch, var(--color-sage) 8%, transparent), transparent)',
        border: '1px solid color-mix(in oklch, var(--color-sage) 20%, transparent)',
      }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{
            background: 'color-mix(in oklch, var(--color-sage) 20%, transparent)',
          }}>
            <TrendingUp size={18} style={{ color: 'var(--color-sage)' }} aria-hidden="true" />
          </div>
          <div>
            <div className="text-lg font-bold" style={{ color: 'var(--color-bark)' }}>{metrics.totalShares}</div>
            <div className="text-xs" style={{ color: 'var(--color-stone)' }}>people shared this agent</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3 text-center">
          <div className="p-2 rounded" style={{ background: 'var(--color-cream)' }}>
            <div className="text-sm font-bold" style={{ color: 'var(--color-sage-deep)' }}>{metrics.twitterShares}</div>
            <div className="text-[10px]" style={{ color: 'var(--color-stone)' }}>Twitter</div>
          </div>
          <div className="p-2 rounded" style={{ background: 'var(--color-cream)' }}>
            <div className="text-sm font-bold" style={{ color: 'var(--color-sage)' }}>{metrics.telegramShares}</div>
            <div className="text-[10px]" style={{ color: 'var(--color-stone)' }}>Telegram</div>
          </div>
          <div className="p-2 rounded" style={{ background: 'var(--color-cream)' }}>
            <div className="text-sm font-bold" style={{ color: 'var(--color-bark)' }}>{metrics.copyLinkClicks}</div>
            <div className="text-[10px]" style={{ color: 'var(--color-stone)' }}>Copied</div>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <label className="text-xs font-bold mb-2 block" style={{ color: 'var(--color-clay)' }}>Your Referral Link</label>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={referralLink}
            className="input flex-1 text-xs"
            aria-label="Your referral link"
          />
          <button
            onClick={handleCopyLink}
            disabled={isSharing}
            className="px-3 py-2 rounded-lg transition-all text-sm font-bold"
            aria-label="Copy referral link"
            style={{
              background: copied ? 'var(--color-sage)' : 'var(--color-cream)',
              color: copied ? 'var(--color-cream)' : 'var(--color-clay)',
              border: copied ? 'none' : '1px solid var(--color-sand-line)',
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
        <p className="text-xs mt-1" style={{ color: 'var(--color-stone)' }}>
          Earn 0.01 DIEM for each friend who submits a prompt
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={handleTwitterShare}
          disabled={isSharing}
          className="py-3 px-4 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
          style={{
            background: 'color-mix(in oklch, var(--color-sage) 15%, transparent)',
            color: 'var(--color-sage-deep)',
            border: '1px solid color-mix(in oklch, var(--color-sage) 30%, transparent)',
          }}
        >
          Share on X
        </button>
        <button
          onClick={handleTelegramShare}
          disabled={isSharing}
          className="py-3 px-4 rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          style={{
            background: 'color-mix(in oklch, var(--color-terra) 15%, transparent)',
            color: 'var(--color-terra)',
            border: '1px solid color-mix(in oklch, var(--color-terra) 30%, transparent)',
          }}
        >
          <Send size={16} />
          Telegram
        </button>
      </div>

      <div className="mb-4 p-3 rounded-lg" style={{
        background: 'var(--color-cream)',
        border: '1px solid var(--color-sand-line)',
      }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold" style={{ color: 'var(--color-clay)' }}>Agent URL</span>
          <Link2 size={12} style={{ color: 'var(--color-stone)' }} aria-hidden="true" />
        </div>
        <div className="text-sm font-bold truncate" style={{ color: 'var(--color-bark)' }}>{agentUrl}</div>
        <p className="text-xs mt-1" style={{ color: 'var(--color-stone)' }}>
          Share this URL directly to invite friends
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold" style={{ color: 'var(--color-clay)' }}>Recent Shares</span>
          <span className="text-xs" style={{ color: 'var(--color-stone)' }}>{recentShares.length} total</span>
        </div>
        <div className="space-y-2 max-h-[120px] overflow-y-auto">
          {recentShares.map((share, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs py-1.5" style={{
              borderBottom: '1px solid color-mix(in oklch, var(--color-sand-line) 50%, transparent)',
            }}>
              <span className="truncate" style={{ color: 'var(--color-stone)' }}>{share.address}</span>
              <div className="flex items-center gap-2 shrink-0">
                <span style={{
                  color: share.platform === 'twitter' ? 'var(--color-sage-deep)' :
                         share.platform === 'telegram' ? 'var(--color-terra)' : 'var(--color-clay)',
                }}>
                  {share.platform === 'twitter' ? 'X' :
                   share.platform === 'telegram' ? <Send size={12} /> : <Link2 size={12} />}
                </span>
                <span style={{ color: 'var(--color-stone)' }}>{formatTimeAgo(share.timestamp)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold" style={{ color: 'var(--color-clay)' }}>Top Referrers</span>
        </div>
        <div className="space-y-2">
          {topReferrers.map((referrer, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs py-1.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{
                  background: idx === 0 ? 'color-mix(in oklch, var(--color-amber) 20%, transparent)' :
                              idx === 1 ? 'color-mix(in oklch, var(--color-sage) 20%, transparent)' :
                              idx === 2 ? 'color-mix(in oklch, var(--color-terra) 20%, transparent)' :
                              'color-mix(in oklch, var(--color-sand-line) 40%, transparent)',
                  color: idx === 0 ? 'var(--color-bark)' :
                         idx === 1 ? 'var(--color-sage-deep)' :
                         idx === 2 ? 'var(--color-terra)' : 'var(--color-stone)',
                }}>
                  {idx + 1}
                </span>
                <span style={{ color: 'var(--color-clay)' }}>{referrer.address}</span>
              </div>
              <span style={{ color: 'var(--color-stone)' }}>{referrer.promptsCount} prompts</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
