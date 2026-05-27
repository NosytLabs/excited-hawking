import { Trophy, TrendingUp } from 'lucide-react';

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
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy size={16} className="text-[var(--vault-teal)]" />
          <span className="text-[10px] font-mono text-[var(--shell-text-muted)] uppercase tracking-wider">
            Participant Rankings
          </span>
        </div>
        <span className="text-xs text-[var(--shell-text-muted)]">Cycle 847</span>
      </div>
      
      <div className="space-y-2">
        {mockLeaderboard.map((entry) => (
          <div 
            key={entry.rank}
            className="flex items-center justify-between p-2 bg-[var(--shell-surface-2)] rounded-lg border border-[var(--shell-border)]"
          >
            <div className="flex items-center gap-3">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                entry.rank === 1 ? 'bg-[var(--vault-teal)] text-white' :
                entry.rank === 2 ? 'bg-[var(--shell-text-muted)] text-white' :
                entry.rank === 3 ? 'bg-[var(--shell-accent-strong)] text-white' :
                'bg-[var(--shell-surface)] text-[var(--shell-text-muted)]'
              }`}>
                {entry.rank}
              </span>
              <span className="text-xs font-mono text-[var(--shell-text)]">
                {entry.address}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="text-right">
                <div className="text-[var(--shell-text)]">{entry.contributions}</div>
                <div className="text-[10px] text-[var(--shell-text-muted)]">inputs</div>
              </div>
              <div className="text-right">
                <div className="text-[var(--vault-teal)]">{entry.weight.toFixed(1)}x</div>
                <div className="text-[10px] text-[var(--shell-text-muted)]">weight</div>
              </div>
              {entry.trend === 'up' && <TrendingUp size={12} className="text-[var(--shell-success)]" />}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-3 border-t border-[var(--shell-border)] flex items-center justify-between text-xs text-[var(--shell-text-muted)]">
        <span>Total participants: 127+</span>
        <span>Rank by: weight × sqrt(contributions)</span>
      </div>
      <div className="mt-2 text-center">
        <span className="text-[10px] text-[var(--shell-text-muted)]">
          Rankings shown for demonstration
        </span>
      </div>
    </div>
  );
};

export default Leaderboard;


