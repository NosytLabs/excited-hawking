/* Hallmark · component: profile-page · genre: terminal-aesthetic · theme: Terminal */
import { useState, useEffect, useCallback } from 'react';
import { Wallet, Settings } from 'lucide-react';
import { useAgent } from '../context/useAgent';
import { api } from '../services/api';

const TIER_COLORS: Record<string, string> = {
  Observer: 'var(--paper-muted)',
  Participant: 'var(--accent-primary)',
  Contributor: 'var(--accent-primary)',
  Overseer: 'var(--success)',
  Minimal: 'var(--paper-muted)',
};

const truncateAddress = (address: string): string => {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
}

interface ToggleProps {
  enabled: boolean;
  onChange: () => void;
  label: string;
  description: string;
}

function Toggle({ enabled, onChange, label, description }: ToggleProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[var(--paper-border)] last:border-b-0">
      <div className="flex-1">
        <p className="font-medium text-[var(--paper-text)]">{label}</p>
        <p className="text-base text-[var(--paper-muted)]">{description}</p>
      </div>
      <button
        onClick={onChange}
        role="switch"
        aria-checked={enabled}
        aria-label={label}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-[var(--accent-primary)]' : 'bg-[var(--paper-muted)]/40'}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`}
        />
      </button>
    </div>
  );
}

interface SettingsState {
  emailNotifications: boolean;
  pushNotifications: boolean;
  proposalAlerts: boolean;
  creatureUpdates: boolean;
}

const STORAGE_KEY = 'vault_notification_settings';

function loadSettings(): SettingsState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return { emailNotifications: true, pushNotifications: false, proposalAlerts: true, creatureUpdates: true };
}

function saveSettings(s: SettingsState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

interface StakingData {
  diemStaked: number;
  tier: string;
  quadraticVotingWeight: number;
  promptsSubmitted: number;
  proposalsCreated: number;
  votingHistoryCount: number;
}

export function ProfilePage() {
  const { connectWallet, walletAddress, diemStaked: contextDiemStaked, tier: contextTier } = useAgent();
  const [stakingData, setStakingData] = useState<StakingData | null>(null);
  const [settings, setSettings] = useState<SettingsState>(loadSettings);

  useEffect(() => {
    if (walletAddress) {
      api.getStatus().then((status) => {
        setStakingData({
          diemStaked: status.diemStaked,
          tier: status.tier,
          quadraticVotingWeight: 0,
          promptsSubmitted: 0,
          proposalsCreated: 0,
          votingHistoryCount: 0,
        });
      }).catch((err) => {
        console.error('Failed to fetch staking data:', err);
        setStakingData({
          diemStaked: contextDiemStaked,
          tier: contextTier,
          quadraticVotingWeight: 0,
          promptsSubmitted: 0,
          proposalsCreated: 0,
          votingHistoryCount: 0,
        });
      });
    }
  }, [walletAddress, contextDiemStaked, contextTier]);

  const handleConnectWallet = async () => {
    await connectWallet();
  };

  const displayTier = stakingData?.tier || contextTier || 'Not connected';
  const displayDiemStaked = stakingData?.diemStaked ?? contextDiemStaked ?? 0;

  return (
    <div className="min-h-screen pt-24 pb-16 px-6" style={{ backgroundColor: 'var(--paper-void)' }}>
      <div className="max-w-4xl mx-auto">
        {!walletAddress ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6" style={{ backgroundColor: 'var(--paper-deep)', border: '2px solid var(--accent-dim)' }}>
              <Wallet size={36} style={{ color: 'var(--accent-primary)' }} />
            </div>
            <h1 className="text-3xl font-display font-bold mb-4" style={{ color: 'var(--paper-text)' }}>
              Connect Your Wallet
            </h1>
            <p className="text-lg mb-8 max-w-md mx-auto" style={{ color: 'var(--paper-muted)' }}>
              Connect your wallet to view your staking position, voting weight, and governance participation.
            </p>
            <button
              onClick={handleConnectWallet}
              className="inline-flex items-center gap-2 px-8 py-4 text-lg font-mono font-bold rounded-lg transition-all hover:scale-105"
              style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--paper-void)' }}
            >
              <Wallet size={20} />
              CONNECT WALLET
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-display font-bold mb-2 tracking-tight" style={{ color: 'var(--paper-text)' }}>
                Participant Profile
              </h1>
              <p style={{ color: 'var(--paper-muted)' }}>
                Your staking position and activity within The Vault Experiment
              </p>
            </div>

            <section className="card mb-6" aria-labelledby="wallet-tier-heading">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-dim)] flex items-center justify-center">
                  <Wallet size={24} style={{ color: 'var(--paper-text)' }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-lg" style={{ color: 'var(--paper-text)' }} aria-label="Wallet address">
                      {truncateAddress(walletAddress)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-medium" style={{ color: TIER_COLORS[displayTier] || 'var(--paper-muted)' }}>
                      {displayTier}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section className="card mb-6" aria-labelledby="stats-heading">
              <h2 id="stats-heading" className="text-lg font-display font-semibold mb-6" style={{ color: 'var(--paper-text)' }}>
                Statistics
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="rounded-lg p-4 text-center" style={{ backgroundColor: 'var(--paper-surface)' }}>
                  <p className="text-2xl font-bold mb-1" style={{ color: 'var(--paper-text)' }}>{formatNumber(displayDiemStaked)}</p>
                  <p className="text-base" style={{ color: 'var(--paper-muted)' }}>DIEM Staked</p>
                </div>
                <div className="rounded-lg p-4 text-center" style={{ backgroundColor: 'var(--paper-surface)' }}>
                  <p className="text-2xl font-bold mb-1" style={{ color: 'var(--paper-text)' }}>{formatNumber(stakingData?.quadraticVotingWeight ?? 0)}</p>
                  <p className="text-base" style={{ color: 'var(--paper-muted)' }}>Voting Weight</p>
                </div>
                <div className="rounded-lg p-4 text-center" style={{ backgroundColor: 'var(--paper-surface)' }}>
                  <p className="text-2xl font-bold mb-1" style={{ color: 'var(--paper-text)' }}>{stakingData?.promptsSubmitted ?? 0}</p>
                  <p className="text-base" style={{ color: 'var(--paper-muted)' }}>Prompts</p>
                </div>
                <div className="rounded-lg p-4 text-center" style={{ backgroundColor: 'var(--paper-surface)' }}>
                  <p className="text-2xl font-bold mb-1" style={{ color: 'var(--paper-text)' }}>{stakingData?.proposalsCreated ?? 0}</p>
                  <p className="text-base" style={{ color: 'var(--paper-muted)' }}>Proposals</p>
                </div>
                <div className="rounded-lg p-4 text-center md:col-span-1" style={{ backgroundColor: 'var(--paper-surface)' }}>
                  <p className="text-2xl font-bold mb-1" style={{ color: 'var(--paper-text)' }}>{stakingData?.votingHistoryCount ?? 0}</p>
                  <p className="text-base" style={{ color: 'var(--paper-muted)' }}>Votes Cast</p>
                </div>
              </div>
            </section>

            <section className="card mb-6" aria-labelledby="activity-heading">
              <h2 id="activity-heading" className="text-lg font-display font-semibold mb-6" style={{ color: 'var(--paper-text)' }}>
                Recent Activity
              </h2>
              <div className="flex items-center justify-center py-8" style={{ color: 'var(--paper-muted)' }}>
                <p>Activity data not yet available. Participate in governance to see your history.</p>
              </div>
            </section>

            <section className="card" aria-labelledby="settings-heading">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(to bottom, var(--paper-surface), var(--paper-muted))' }}>
                  <Settings size={18} style={{ color: 'var(--paper-text)' }} />
                </div>
                <h2 id="settings-heading" className="text-lg font-display font-semibold" style={{ color: 'var(--paper-text)' }}>
                  Notification Settings
                </h2>
              </div>
              <div role="group" aria-label="Notification preferences">
                <Toggle
                  enabled={settings.emailNotifications}
                  onChange={() => {
                    const next = { ...settings, emailNotifications: !settings.emailNotifications };
                    setSettings(next);
                    saveSettings(next);
                  }}
                  label="Email Notifications"
                  description="Receive updates via email"
                />
                <Toggle
                  enabled={settings.pushNotifications}
                  onChange={() => {
                    const next = { ...settings, pushNotifications: !settings.pushNotifications };
                    setSettings(next);
                    saveSettings(next);
                  }}
                  label="Push Notifications"
                  description="Receive browser push notifications"
                />
                <Toggle
                  enabled={settings.proposalAlerts}
                  onChange={() => {
                    const next = { ...settings, proposalAlerts: !settings.proposalAlerts };
                    setSettings(next);
                    saveSettings(next);
                  }}
                  label="Proposal Alerts"
                  description="Get notified of new governance proposals"
                />
                <Toggle
                  enabled={settings.creatureUpdates}
                  onChange={() => {
                    const next = { ...settings, creatureUpdates: !settings.creatureUpdates };
                    setSettings(next);
                    saveSettings(next);
                  }}
                  label="Creature Updates"
                  description="Notifications about creature state changes"
                />
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
