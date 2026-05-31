import { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import { useAgent } from '../context/useAgent';

interface LeaderboardEntry {
  rank: number;
  address: string;
  contributions: number;
  weight: number;
  trend: 'up' | 'down' | 'stable';
}

const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, address: '0x1234...5678', contributions: 0, weight: 0, trend: 'stable' },
];

export const Leaderboard = () => {
  const { emergenceGeneration } = useAgent();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(mockLeaderboard);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch('/api/governance/leaderboard?limit=10');
        if (res.ok && !ignore) {
          const data = await res.json();
          if (data.leaderboard && Array.isArray(data.leaderboard)) {
            setLeaderboard(data.leaderboard.map((e: { wallet: string; totalVotes?: number; proposalsVoted?: number; quadraticWeightSum?: number }, i: number) => ({
              rank: i + 1,
              address: e.wallet ? `${e.wallet.slice(0, 6)}...${e.wallet.slice(-4)}` : '---',
              contributions: e.totalVotes ?? e.proposalsVoted ?? 0,
              weight: e.quadraticWeightSum ?? 0,
              trend: 'stable' as const,
            })));
          }
        }
      } catch { /* ignore */ }
      if (!ignore) setLoading(false);
    };

    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 30000);
    return () => { ignore = true; clearInterval(interval); };
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--paper-border)]">
        <div className="flex items-center gap-2">
          <Trophy size={16} className="text-[var(--accent-primary)]" />
          <span className="text-sm font-mono text-[var(--paper-muted)]">Participant Rankings</span>
        </div>
        <span className="text-sm font-mono text-[var(--paper-muted)]">Cycle {emergenceGeneration > 0 ? emergenceGeneration : '--'}</span>
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center justify-between p-2 min-h-[44px] bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-lg animate-pulse">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-6 h-6 rounded-full bg-[var(--paper-muted)]/20" />
                  <div className="h-4 w-24 bg-[var(--paper-muted)]/20" />
                </div>
                <div className="h-4 w-16 bg-[var(--paper-muted)]/20" />
              </div>
            ))}
          </div>
        ) : (
          leaderboard.map((entry) => (
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
                  <span className="font-mono text-[var(--paper-text)]">{entry.contributions}</span>
                </div>
                <div className="text-right w-16 hidden sm:block">
                  <span className="font-mono text-[var(--paper-muted)]">{entry.weight.toFixed(1)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="mt-4 pt-3 border-t border-[var(--paper-border)] text-xs font-mono text-[var(--paper-muted)]">
        <p>Rank: weight x sqrt(contributions)</p>
      </div>
    </div>
  );
};
