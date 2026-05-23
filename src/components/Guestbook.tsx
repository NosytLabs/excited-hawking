import React, { useState, useCallback } from 'react';
import { useAgent } from '../context/useAgent';
import { BookOpen, Trophy, Users, Share2, TrendingUp } from 'lucide-react';

interface Contributor {
  address: string;
  contributions: number;
  rank: number;
  lastActive: number;
}

interface ContributionEntry {
  id: string;
  address: string;
  message: string;
  timestamp: number;
  type: 'prompt' | 'delegate' | 'share' | 'vote';
  impact: number;
}

export const Guestbook: React.FC = () => {
  const { prompts } = useAgent();
  const [activeTab, setActiveTab] = useState<'wall' | 'leaderboard'>('wall');
  const [contributors] = useState<Contributor[]>(() => [
    { address: '0xab12...cd34', contributions: 47, rank: 1, lastActive: Date.now() - 3600000 },
    { address: '0xdef0...5678', contributions: 38, rank: 2, lastActive: Date.now() - 7200000 },
    { address: '0x99aa...bbee', contributions: 29, rank: 3, lastActive: Date.now() - 86400000 },
    { address: '0x1122...3344', contributions: 23, rank: 4, lastActive: Date.now() - 86400000 * 2 },
    { address: '0x5566...7788', contributions: 18, rank: 5, lastActive: Date.now() - 86400000 * 3 },
    { address: '0xmnop...qrst', contributions: 15, rank: 6, lastActive: Date.now() - 86400000 * 4 },
    { address: '0xwxyz...abcd', contributions: 12, rank: 7, lastActive: Date.now() - 86400000 * 5 },
  ]);

  const [entries] = useState<ContributionEntry[]>(() => [
    { id: '1', address: '0xab12...cd34', message: 'First to delegate 10 DIEM! Let\'s build this together.', timestamp: Date.now() - 3600000 * 2, type: 'delegate', impact: 10 },
    { id: '2', address: '0x34tx...yu78', message: 'Cross-referenced Uniswap for 3 consecutive days. Amazing agent.', timestamp: Date.now() - 3600000 * 5, type: 'prompt', impact: 3 },
    { id: '3', address: '0xdef0...5678', message: 'Smitedump checkpoint passed. The agent learns faster now.', timestamp: Date.now() - 3600000 * 8, type: 'share', impact: 5 },
    { id: '4', address: '0x99aa...bbee', message: 'Voted on Proposal #7. Treasury diversification makes sense.', timestamp: Date.now() - 86400000, type: 'vote', impact: 1 },
    { id: '5', address: '0xqwer...tyui', message: 'The dream journal is pure poetry. AI sentience confirmed.', timestamp: Date.now() - 86400000 * 2, type: 'prompt', impact: 2 },
  ]);

  const totalImpact = entries.reduce((acc, e) => acc + e.impact, 0);

  const formatTimeAgo = useCallback((timestamp: number) => {
    const diff = Date.now() - timestamp;
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  }, []);

  const getEntryIcon = (type: ContributionEntry['type']) => {
    switch (type) {
      case 'prompt': return <BookOpen size={12} className="text-[#00d992]" />;
      case 'delegate': return <Users size={12} className="text-purple-400" />;
      case 'share': return <Share2 size={12} className="text-[#1DA1F2]" />;
      case 'vote': return <TrendingUp size={12} className="text-green-400" />;
    }
  };

  const getEntryColor = (type: ContributionEntry['type']) => {
    switch (type) {
      case 'prompt': return 'border-l-[#00d992]';
      case 'delegate': return 'border-l-purple-400';
      case 'share': return 'border-l-[#1DA1F2]';
      case 'vote': return 'border-l-green-400';
    }
  };

  // Create a reversed list of all prompts to simulate guestbook
  const history = [...prompts].reverse();

  return (
    <div className="glass-panel flex-1 flex flex-col">
      <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-2">
        <h3 className="font-mono text-sm uppercase tracking-wider flex items-center gap-2 text-zinc-300">
          <BookOpen size={16} className="text-[#00d992]" />
          Wall of Contributions
        </h3>
        <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-500">
          <span>Impact:</span>
          <span className="text-white font-bold">{totalImpact}</span>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 mb-4 bg-zinc-900/50 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('wall')}
          className={`flex-1 py-2 px-3 rounded text-xs font-mono transition-all ${
            activeTab === 'wall'
              ? 'bg-[#00d992]/20 text-[#00d992]'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Recent
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex-1 py-2 px-3 rounded text-xs font-mono transition-all flex items-center justify-center gap-1 ${
            activeTab === 'leaderboard'
              ? 'bg-yellow-500/20 text-yellow-400'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Trophy size={12} />
          Top
        </button>
      </div>

      {activeTab === 'wall' ? (
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {entries.map(entry => (
            <div 
              key={entry.id} 
              className={`pl-3 border-l-2 ${getEntryColor(entry.type)} py-1`}
            >
              <div className="flex items-center gap-2 mb-1">
                {getEntryIcon(entry.type)}
                <span className="text-[10px] font-mono text-zinc-500 uppercase">{entry.type}</span>
                <span className="text-[10px] font-mono text-zinc-600 ml-auto">
                  {formatTimeAgo(entry.timestamp)}
                </span>
              </div>
              <p className="text-[13px] text-zinc-300 leading-relaxed">
                "{entry.message}"
              </p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] font-mono text-zinc-500">{entry.address}</span>
                <span className="text-[10px] font-mono text-zinc-600">Impact: +{entry.impact}</span>
              </div>
            </div>
          ))}
          
          {/* Live Guestbook from prompts */}
          <div className="pt-2 border-t border-zinc-800/50">
            <span className="text-[10px] font-mono text-zinc-600 uppercase mb-2 block">Live Prompts</span>
            {history.map(item => (
              <div 
                key={`gb-${item.id}`} 
                className="text-[12px] font-mono flex gap-2 animate-fade-in border-b border-zinc-800/30 pb-2 mb-2"
              >
                <span className="text-[#00d992] shrink-0">{item.user}</span>
                <span className="text-zinc-500 shrink-0">paid</span>
                <span className="text-zinc-300 shrink-0">${item.cost.toFixed(2)}</span>
                <span className="text-zinc-500 shrink-0">to ask:</span>
                <span className="text-zinc-400 truncate flex-1" title={item.text}>
                  "{item.text}"
                </span>
                {item.status === 'done' && (
                  <span className="text-[#0ea5e9] shrink-0">[OK]</span>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-2">
            {contributors.map(contributor => (
              <div 
                key={contributor.address}
                className={`flex items-center justify-between p-2 rounded transition-all hover:bg-zinc-900/50 ${
                  contributor.rank <= 3 ? 'bg-gradient-to-r from-zinc-900/80 to-transparent' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
                    contributor.rank === 1 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' :
                    contributor.rank === 2 ? 'bg-zinc-400/20 text-zinc-400 border border-zinc-400/40' :
                    contributor.rank === 3 ? 'bg-orange-600/20 text-orange-600 border border-orange-600/40' :
                    'bg-zinc-800/50 text-zinc-500'
                  }`}>
                    {contributor.rank <= 3 ? (
                      <Trophy size={12} />
                    ) : (
                      contributor.rank
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-mono text-zinc-300">{contributor.address}</div>
                    <div className="text-[10px] font-mono text-zinc-600">
                      Last active: {formatTimeAgo(contributor.lastActive)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono font-bold text-white">{contributor.contributions}</div>
                  <div className="text-[10px] font-mono text-zinc-500">contributions</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};