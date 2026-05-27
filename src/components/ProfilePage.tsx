import { Wallet, TrendingUp, FileText, CheckSquare, Settings, Clock, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

// Placeholder user data - UI only, no backend
const PLACEHOLDER_USER = {
  walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f2d123',
  stakingTier: 'Participant' as const,
  stats: {
    totalDiemStaked: 15000,
    quadraticVotingWeight: 342.5,
    promptsSubmitted: 23,
    proposalsCreated: 4,
    votingHistoryCount: 67,
  },
  recentActivity: [
    { id: 1, type: 'vote', description: 'Voted on Proposal #42', time: '2 hours ago', impact: 'positive' },
    { id: 2, type: 'prompt', description: 'Submitted prompt to creature', time: '5 hours ago', impact: 'neutral' },
    { id: 3, type: 'stake', description: 'Staked 500 DIEM', time: '1 day ago', impact: 'positive' },
    { id: 4, type: 'proposal', description: 'Created Proposal #41', time: '2 days ago', impact: 'neutral' },
    { id: 5, type: 'vote', description: 'Voted on Proposal #40', time: '3 days ago', impact: 'negative' },
  ],
  settings: {
    emailNotifications: true,
    pushNotifications: false,
    proposalAlerts: true,
    creatureUpdates: true,
  },
};

const TIER_COLORS: Record<string, string> = {
  Observer: 'var(--shell-text-muted)',
  Participant: 'var(--shell-accent)',
  Contributor: 'var(--vault-teal)',
  Overseer: 'var(--shell-success)',
};

function truncateAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
}

function getActivityIcon(type: string) {
  switch (type) {
    case 'vote': return CheckSquare;
    case 'prompt': return FileText;
    case 'stake': return TrendingUp;
    case 'proposal': return FileText;
    default: return Clock;
  }
}

function getImpactIcon(impact: string) {
  switch (impact) {
    case 'positive': return ArrowUpRight;
    case 'negative': return ArrowDownRight;
    default: return Minus;
  }
}

interface ToggleProps {
  enabled: boolean;
  onChange: () => void;
  label: string;
  description: string;
}

function Toggle({ enabled, onChange, label, description }: ToggleProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[var(--shell-border)] last:border-b-0">
      <div className="flex-1">
        <p className="font-medium text-[var(--shell-text)]">{label}</p>
        <p className="text-xs text-[var(--shell-text-muted)]">{description}</p>
      </div>
      <button
        onClick={onChange}
        role="switch"
        aria-checked={enabled}
        aria-label={label}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-[var(--shell-accent)]' : 'bg-[var(--shell-text-muted)]/40'}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`}
        />
      </button>
    </div>
  );
}

export function ProfilePage() {
  const user = PLACEHOLDER_USER;

  return (
    <div className="min-h-screen pt-24 pb-16 px-6" style={{ backgroundColor: 'var(--term-void)' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-2 tracking-tight" style={{ color: 'var(--shell-text)' }}>
            Participant Profile
          </h1>
          <p style={{ color: 'var(--shell-text-muted)' }}>
            Your staking position and activity within The Vault Experiment
          </p>
        </div>

        {/* Wallet & Tier Section */}
        <section className="card mb-6" aria-labelledby="wallet-tier-heading">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--shell-accent)] to-[var(--shell-accent-dim,var(--shell-accent)] flex items-center justify-center">
              <Wallet size={24} style={{ color: 'var(--shell-text)' }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-lg" style={{ color: 'var(--shell-text)' }} aria-label="Wallet address">
                  {truncateAddress(user.walletAddress)}
                </span>
                <button
                  className="hover:opacity-80 transition-opacity"
                  style={{ color: 'var(--shell-text-muted)' }}
                  aria-label="Copy full wallet address"
                  title="Copy full address"
                >
                  <Wallet size={16} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium" style={{ color: TIER_COLORS[user.stakingTier] }}>
                  {user.stakingTier}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Statistics Grid */}
        <section className="card mb-6" aria-labelledby="stats-heading">
          <h2 id="stats-heading" className="text-lg font-display font-semibold mb-6" style={{ color: 'var(--shell-text)' }}>
            Statistics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="rounded-lg p-4 text-center" style={{ backgroundColor: 'var(--shell-surface)' }}>
              <p className="text-2xl font-bold mb-1" style={{ color: 'var(--shell-text)' }}>{formatNumber(user.stats.totalDiemStaked)}</p>
              <p className="text-xs" style={{ color: 'var(--shell-text-muted)' }}>DIEM Staked</p>
            </div>
            <div className="rounded-lg p-4 text-center" style={{ backgroundColor: 'var(--shell-surface)' }}>
              <p className="text-2xl font-bold mb-1" style={{ color: 'var(--shell-text)' }}>{formatNumber(user.stats.quadraticVotingWeight)}</p>
              <p className="text-xs" style={{ color: 'var(--shell-text-muted)' }}>Voting Weight</p>
            </div>
            <div className="rounded-lg p-4 text-center" style={{ backgroundColor: 'var(--shell-surface)' }}>
              <p className="text-2xl font-bold mb-1" style={{ color: 'var(--shell-text)' }}>{user.stats.promptsSubmitted}</p>
              <p className="text-xs" style={{ color: 'var(--shell-text-muted)' }}>Prompts</p>
            </div>
            <div className="rounded-lg p-4 text-center" style={{ backgroundColor: 'var(--shell-surface)' }}>
              <p className="text-2xl font-bold mb-1" style={{ color: 'var(--shell-text)' }}>{user.stats.proposalsCreated}</p>
              <p className="text-xs" style={{ color: 'var(--shell-text-muted)' }}>Proposals</p>
            </div>
            <div className="rounded-lg p-4 text-center md:col-span-1" style={{ backgroundColor: 'var(--shell-surface)' }}>
              <p className="text-2xl font-bold mb-1" style={{ color: 'var(--shell-text)' }}>{user.stats.votingHistoryCount}</p>
              <p className="text-xs" style={{ color: 'var(--shell-text-muted)' }}>Votes Cast</p>
            </div>
          </div>
        </section>

        {/* Recent Activity Feed */}
        <section className="card mb-6" aria-labelledby="activity-heading">
          <h2 id="activity-heading" className="text-lg font-display font-semibold mb-6" style={{ color: 'var(--shell-text)' }}>
            Recent Activity
          </h2>
          <div className="space-y-4" role="feed" aria-label="Recent activity feed">
            {user.recentActivity.map((activity) => {
              const ActivityIcon = getActivityIcon(activity.type);
              const ImpactIcon = getImpactIcon(activity.impact);
              return (
                <div
                  key={activity.id}
                  className="flex items-center gap-4"
                  role="article"
                  aria-label={`${activity.description}, ${activity.time}`}
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--shell-surface)' }}>
                    <ActivityIcon size={18} style={{ color: 'var(--shell-text-muted)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" style={{ color: 'var(--shell-text)' }}>{activity.description}</p>
                    <p className="text-xs" style={{ color: 'var(--shell-text-muted)' }}>{activity.time}</p>
                  </div>
                  <div className="flex-shrink-0" style={{ color: activity.impact === 'positive' ? 'var(--shell-success)' : activity.impact === 'negative' ? 'var(--shell-danger)' : 'var(--shell-text-muted)' }}>
                    <ImpactIcon size={16} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Settings Section */}
        <section className="card" aria-labelledby="settings-heading">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(to bottom, var(--shell-surface), var(--shell-text-muted))' }}>
              <Settings size={18} style={{ color: 'var(--shell-text)' }} />
            </div>
            <h2 id="settings-heading" className="text-lg font-display font-semibold" style={{ color: 'var(--shell-text)' }}>
              Notification Settings
            </h2>
          </div>
          <div role="group" aria-label="Notification preferences">
            <Toggle
              enabled={user.settings.emailNotifications}
              onChange={() => {}}
              label="Email Notifications"
              description="Receive updates via email"
            />
            <Toggle
              enabled={user.settings.pushNotifications}
              onChange={() => {}}
              label="Push Notifications"
              description="Receive browser push notifications"
            />
            <Toggle
              enabled={user.settings.proposalAlerts}
              onChange={() => {}}
              label="Proposal Alerts"
              description="Get notified of new governance proposals"
            />
            <Toggle
              enabled={user.settings.creatureUpdates}
              onChange={() => {}}
              label="Creature Updates"
              description="Notifications about creature state changes"
            />
          </div>
        </section>
      </div>
    </div>
  );
}


