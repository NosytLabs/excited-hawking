import React, { useState, useCallback } from 'react';
import { Send, Link2, Check, Copy, Users, TrendingUp } from 'lucide-react';

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

export const SocialSharing: React.FC<SocialSharingProps> = ({
  metrics: propMetrics,
  topReferrers: propReferrers,
  recentShares: propShares,
  walletAddress: propWallet,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const defaultWallet = '0x0000...0000';
  const walletAddress = propWallet || defaultWallet;
  const agentUrl = 'https://agent.thepeoplesagent.xyz';
  
  const referralCode = `ref_${walletAddress.replace(/0x/, '').toLowerCase()}`;
  const referralLink = `${agentUrl}?ref=${referralCode}`;

  const defaultMetrics: ShareMetrics = { totalShares: 0, totalClicks: 0, twitterShares: 0, telegramShares: 0, copyLinkClicks: 0 };
  const metrics = propMetrics || defaultMetrics;

  const defaultReferrers: ReferralEntry[] = [];
  const topReferrers = propReferrers || defaultReferrers;

  const [recentShares, setRecentShares] = useState(() => propShares || [
    { address: '0x0000...0000', platform: 'copy', timestamp: Date.now() - 3600000 },
  ]);

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
    window.open(`https://x.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'width=550,height=420');
    setRecentShares(prev => [{ address: walletAddress, platform: 'twitter', timestamp: Date.now() }, ...prev.slice(0, 9)]);
    setIsSharing(false);
  }, [referralLink, walletAddress]);

  const handleTelegramShare = useCallback(() => {
    setIsSharing(true);
    const text = encodeURIComponent(`Check out The Peoples Agent! ${referralLink}`);
    window.open(`https://t.me/share/url?url=${referralLink}&text=${text}`, '_blank');
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

  return (
    <div className="glass-panel flex flex-col">
      <h3 className="font-mono text-sm uppercase tracking-wider mb-4 flex items-center gap-2 text-zinc-300 border-b border-zinc-800 pb-2">
        <Users size={16} className="text-[#00d992]" />
        Share & Earn
      </h3>

      {/* Social Proof Counter */}
      <div className="mb-4 p-3 bg-gradient-to-r from-[#00d992]/10 to-transparent rounded-lg border border-[#00d992]/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#00d992]/20 flex items-center justify-center">
            <TrendingUp size={18} className="text-[#00d992]" />
          </div>
          <div>
            <div className="text-lg font-mono font-bold text-white">{metrics.totalShares}</div>
            <div className="text-xs font-mono text-zinc-500">people shared this agent</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3 text-center">
          <div className="p-2 bg-black/30 rounded">
            <div className="text-sm font-mono font-bold text-[#1DA1F2]">{metrics.twitterShares}</div>
            <div className="text-[10px] font-mono text-zinc-500">Twitter</div>
          </div>
          <div className="p-2 bg-black/30 rounded">
            <div className="text-sm font-mono font-bold text-[#0088cc]">{metrics.telegramShares}</div>
            <div className="text-[10px] font-mono text-zinc-500">Telegram</div>
          </div>
          <div className="p-2 bg-black/30 rounded">
            <div className="text-sm font-mono font-bold text-zinc-300">{metrics.copyLinkClicks}</div>
            <div className="text-[10px] font-mono text-zinc-500">Copied</div>
          </div>
        </div>
      </div>

      {/* Referral Link */}
      <div className="mb-4">
        <label className="text-xs font-mono text-zinc-500 uppercase mb-2 block">Your Referral Link</label>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={referralLink}
            className="flex-1 bg-black/50 border border-zinc-700 rounded px-3 py-2 text-xs font-mono text-zinc-300 focus:outline-none"
          />
          <button
            onClick={handleCopyLink}
            disabled={isSharing}
            className={`px-3 py-2 rounded transition-all ${
              copied 
                ? 'bg-green-500 text-black' 
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
            }`}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
        <p className="text-[10px] font-mono text-zinc-600 mt-1">
          Earn 0.01 DIEM for each friend who submits a prompt
        </p>
      </div>

      {/* Share Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={handleTwitterShare}
          disabled={isSharing}
          className="flex items-center justify-center gap-2 py-3 px-4 bg-[#1DA1F2]/20 hover:bg-[#1DA1F2]/30 border border-[#1DA1F2]/40 rounded-lg text-sm font-mono text-[#1DA1F2] transition-colors disabled:opacity-50"
        >
          Share on X
        </button>
        <button
          onClick={handleTelegramShare}
          disabled={isSharing}
          className="flex items-center justify-center gap-2 py-3 px-4 bg-[#0088cc]/20 hover:bg-[#0088cc]/30 border border-[#0088cc]/40 rounded-lg text-sm font-mono text-[#0088cc] transition-colors disabled:opacity-50"
        >
          <Send size={16} />
          Telegram
        </button>
      </div>

      {/* Agent URL Card */}
      <div className="mb-4 p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-zinc-500">Agent URL</span>
          <Link2 size={12} className="text-zinc-600" />
        </div>
        <div className="text-sm font-mono text-white truncate">{agentUrl}</div>
        <p className="text-[10px] font-mono text-zinc-600 mt-1">
          Share this URL directly to invite friends
        </p>
      </div>

      {/* Recent Shares */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-zinc-500 uppercase">Recent Shares</span>
          <span className="text-[10px] font-mono text-zinc-600">{recentShares.length} total</span>
        </div>
        <div className="space-y-2 max-h-[120px] overflow-y-auto">
          {recentShares.map((share, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs font-mono py-1.5 border-b border-zinc-800/50">
              <span className="text-zinc-500 truncate">{share.address}</span>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`${
                  share.platform === 'twitter' ? 'text-[#1DA1F2]' : 
                  share.platform === 'telegram' ? 'text-[#0088cc]' : 
                  'text-zinc-400'
                }`}>
                  {share.platform === 'twitter' ? <span className="text-[#1DA1F2]">X</span> : 
                   share.platform === 'telegram' ? <Send size={12} /> : 
                   <Link2 size={12} />}
                </span>
                <span className="text-zinc-600">{formatTimeAgo(share.timestamp)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Referrers */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-zinc-500 uppercase">Top Referrers</span>
        </div>
        <div className="space-y-2">
          {topReferrers.map((referrer, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs font-mono py-1.5">
              <div className="flex items-center gap-2">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  idx === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                  idx === 1 ? 'bg-zinc-400/20 text-zinc-400' :
                  idx === 2 ? 'bg-orange-600/20 text-orange-600' :
                  'bg-zinc-800/50 text-zinc-600'
                }`}>
                  {idx + 1}
                </span>
                <span className="text-zinc-400">{referrer.address}</span>
              </div>
              <span className="text-zinc-500">{referrer.promptsCount} prompts</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};