import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  address: string;
  contributions: number;
  weight: number;
  trend: 'up' | 'down' | 'stable';
}

const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, address: '0x1234...5678', contributions: 847, weight: 156.2, trend: 'up' },
  { rank: 2, address: '0xabcd...efgh', contributions: 623, weight: 89.4, trend: 'stable' },
  { rank: 3, address: '0x9876...5432', contributions: 412, weight: 67.8, trend: 'down' },
  { rank: 4, address: '0x5555...aaaa', contributions: 389, weight: 45.2, trend: 'up' },
  { rank: 5, address: '0xdddd...eeee', contributions: 267, weight: 34.1, trend: 'stable' },
];

export const Leaderboard = () => {
  return (
    <div>
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--paper-border)]">
        <div className="flex items-center gap-2">
          <Trophy size={16} className="text-[var(--accent-primary)]" />
          <span className="text-sm font-mono text-[var(--paper-muted)]">Participant Rankings</span>
        </div>
        <span className="text-sm font-mono text-[var(--paper-muted)]">Cycle 847</span>
      </div>

      <div className="space-y-2">
        {mockLeaderboard.map((entry) => (
          <div
            key={entry.rank}
            className="flex items-center justify-between p-2 min-h-[44px] bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-lg"
          >
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold flex-shrink-0 ${
                entry.rank === 1 ? 'bg-[var(--accent-primary)] text-[var(--paper-void)]' :
                entry.rank === 2 ? 'bg-[var(--paper-muted)] text-[var(--paper-void)]' :
                entry.rank === 3 ? 'bg-[var(--accent-dim)] text-[var(--paper-void)]' :
                'bg-[var(--paper-surface)] text-[var(--paper-muted)]'
              }`}>
                {entry.rank}
              </span>
              <span className="text-sm font-mono text-[var(--paper-text)] truncate">
                {entry.address}
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 text-sm flex-shrink-0">
              <div className="text-right">
                <div className="text-[var(--paper-text)] font-mono">{entry.contributions}</div>
                <div className="hidden sm:block text-xs text-[var(--paper-muted)] font-mono uppercase tracking-wider">inputs</div>
              </div>
              <div className="text-right">
                <div className="text-[var(--accent-primary)] phosphor font-mono">{entry.weight.toFixed(1)}x</div>
                <div className="hidden sm:block text-xs text-[var(--paper-muted)] font-mono uppercase tracking-wider">weight</div>
              </div>
              {entry.trend === 'up' && <TrendingUp size={14} className="text-[var(--success)]" aria-label="Trending up" />}
              {entry.trend === 'down' && <TrendingDown size={14} className="text-[var(--danger)]" aria-label="Trending down" />}
              {entry.trend === 'stable' && <Minus size={14} className="text-[var(--paper-muted)]" aria-label="Stable" />}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-[var(--paper-border)] flex items-center justify-between text-sm text-[var(--paper-muted)] font-mono">
        <span>Total participants: 127+</span>
        <span>Rank: weight x sqrt(contributions)</span>
      </div>

    </div>
  );
};
