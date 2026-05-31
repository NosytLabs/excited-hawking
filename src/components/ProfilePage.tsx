/* Hallmark · component: profile-page · genre: terminal-aesthetic · theme: Terminal */
import { useState, useEffect } from 'react';
import { Wallet, Settings, ChevronUp, ChevronDown } from 'lucide-react';
import { useAgent } from '../context/useAgent';
import { useConnectionStore } from '../stores/connectionStore';
import { api } from '../services/api';
import type { StakingPosition } from '../services/api';

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
  status: 'loading' | 'loaded' | 'error';
  diemStaked: number;
  tier: string;
  quadraticVotingWeight: number;
  promptsSubmitted: number;
  proposalsCreated: number;
  votingHistoryCount: number;
}

interface StakingPositionState {
  position: StakingPosition | null;
  status: 'idle' | 'loading' | 'success' | 'error';
  error: string | null;
}

export function ProfilePage() {
  const { connectWallet, walletAddress, diemStaked: contextDiemStaked, tier: contextTier } = useAgent();
  const connectionStore = useConnectionStore();
  const [stakingData, setStakingData] = useState<StakingData>({ status: 'loading', diemStaked: 0, tier: '', quadraticVotingWeight: 0, promptsSubmitted: 0, proposalsCreated: 0, votingHistoryCount: 0 });
  const [settings, setSettings] = useState<SettingsState>(loadSettings);
  const [stakeAmount, setStakeAmount] = useState('');
  const [stakingPosition, setStakingPosition] = useState<StakingPositionState>({ position: null, status: 'idle', error: null });
  const [stakingActionLoading, setStakingActionLoading] = useState<'stake' | 'unstake' | null>(null);
  const [stakingActionError, setStakingActionError] = useState<string | null>(null);
  const [stakingActionSuccess, setStakingActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (walletAddress) {
      setStakingData(prev => ({ ...prev, status: 'loading' }));
      api.getStatus().then((status) => {
        setStakingData({
          status: 'loaded',
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
          status: 'error',
          diemStaked: contextDiemStaked,
          tier: contextTier,
          quadraticVotingWeight: 0,
          promptsSubmitted: 0,
          proposalsCreated: 0,
          votingHistoryCount: 0,
        });
      });
    } else {
      setStakingData({ status: 'loaded', diemStaked: contextDiemStaked, tier: contextTier, quadraticVotingWeight: 0, promptsSubmitted: 0, proposalsCreated: 0, votingHistoryCount: 0 });
    }
  }, [walletAddress, contextDiemStaked, contextTier]);

  useEffect(() => {
    if (walletAddress) {
      setStakingPosition(prev => ({ ...prev, status: 'loading', error: null }));
      api.getStakingStatus(walletAddress).then((position) => {
        setStakingPosition({ position, status: 'success', error: null });
      }).catch((err) => {
        console.error('Failed to fetch staking position:', err);
        setStakingPosition({ position: null, status: 'error', error: 'Failed to load staking position' });
      });
    } else {
      setStakingPosition({ position: null, status: 'idle', error: null });
    }
  }, [walletAddress]);

  const handleStake = async () => {
    if (!stakeAmount || !walletAddress) return;
    if (!connectionStore.walletSignature || !connectionStore.walletNonce) {
      setStakingActionError('Wallet signature not available. Please reconnect your wallet.');
      return;
    }
    setStakingActionLoading('stake');
    setStakingActionError(null);
    setStakingActionSuccess(null);
    try {
      const result = await api.stake(stakeAmount, walletAddress, connectionStore.walletSignature, connectionStore.walletNonce);
      if (result.success) {
        setStakingActionSuccess(`Staked ${stakeAmount} DIEM successfully`);
        setStakeAmount('');
        const position = await api.getStakingStatus(walletAddress);
        setStakingPosition({ position, status: 'success', error: null });
      } else {
        setStakingActionError('Stake failed. Please try again.');
      }
    } catch (err) {
      console.error('Stake error:', err);
      setStakingActionError('Stake failed. Please try again.');
    } finally {
      setStakingActionLoading(null);
    }
  };

  const handleUnstake = async () => {
    if (!stakeAmount || !walletAddress) return;
    if (!connectionStore.walletSignature || !connectionStore.walletNonce) {
      setStakingActionError('Wallet signature not available. Please reconnect your wallet.');
      return;
    }
    setStakingActionLoading('unstake');
    setStakingActionError(null);
    setStakingActionSuccess(null);
    try {
      const result = await api.unstakeRequest(stakeAmount, walletAddress, connectionStore.walletSignature, connectionStore.walletNonce);
      if (result.success) {
        setStakingActionSuccess(`Unstake request for ${stakeAmount} DIEM submitted`);
        setStakeAmount('');
        const position = await api.getStakingStatus(walletAddress);
        setStakingPosition({ position, status: 'success', error: null });
      } else {
        setStakingActionError('Unstake request failed. Please try again.');
      }
    } catch (err) {
      console.error('Unstake error:', err);
      setStakingActionError('Unstake request failed. Please try again.');
    } finally {
      setStakingActionLoading(null);
    }
  };

  const handleConnectWallet = async () => {
    await connectWallet();
  };

  const displayTier = stakingData.tier || contextTier || 'Not connected';

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
              {stakingData.status === 'loading' ? (
                <div className="flex items-center justify-center py-8">
                  <p style={{ color: 'var(--paper-muted)' }}>Loading staking data...</p>
                </div>
              ) : stakingData.status === 'error' ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <p className="mb-4" style={{ color: 'var(--error)' }}>Failed to load staking data</p>
                    <button
                      onClick={() => setStakingData(prev => ({ ...prev, status: 'loading' }))}
                      className="px-4 py-2 rounded-lg font-mono text-sm"
                      style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--paper-void)' }}
                    >
                      Retry
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div className="rounded-lg p-4 text-center" style={{ backgroundColor: 'var(--paper-surface)' }}>
                    <p className="text-2xl font-bold mb-1" style={{ color: 'var(--paper-text)' }}>{formatNumber(stakingData.diemStaked)}</p>
                    <p className="text-base" style={{ color: 'var(--paper-muted)' }}>DIEM Staked</p>
                  </div>
                  <div className="rounded-lg p-4 text-center" style={{ backgroundColor: 'var(--paper-surface)' }}>
                    <p className="text-2xl font-bold mb-1" style={{ color: 'var(--paper-text)' }}>{formatNumber(stakingData.quadraticVotingWeight)}</p>
                    <p className="text-base" style={{ color: 'var(--paper-muted)' }}>Voting Weight</p>
                  </div>
                  <div className="rounded-lg p-4 text-center" style={{ backgroundColor: 'var(--paper-surface)' }}>
                    <p className="text-2xl font-bold mb-1" style={{ color: 'var(--paper-text)' }}>{stakingData.promptsSubmitted}</p>
                    <p className="text-base" style={{ color: 'var(--paper-muted)' }}>Prompts</p>
                  </div>
                  <div className="rounded-lg p-4 text-center" style={{ backgroundColor: 'var(--paper-surface)' }}>
                    <p className="text-2xl font-bold mb-1" style={{ color: 'var(--paper-text)' }}>{stakingData.proposalsCreated}</p>
                    <p className="text-base" style={{ color: 'var(--paper-muted)' }}>Proposals</p>
                  </div>
                  <div className="rounded-lg p-4 text-center md:col-span-1" style={{ backgroundColor: 'var(--paper-surface)' }}>
                    <p className="text-2xl font-bold mb-1" style={{ color: 'var(--paper-text)' }}>{stakingData.votingHistoryCount}</p>
                    <p className="text-base" style={{ color: 'var(--paper-muted)' }}>Votes Cast</p>
                  </div>
                </div>
              )}
            </section>

            <section className="card mb-6" aria-labelledby="staking-heading">
              <h2 id="staking-heading" className="text-lg font-display font-semibold mb-6" style={{ color: 'var(--paper-text)' }}>
                Staking Vault
              </h2>
              {stakingPosition.status === 'loading' ? (
                <div className="flex items-center justify-center py-8">
                  <p style={{ color: 'var(--paper-muted)' }}>Loading staking position...</p>
                </div>
              ) : stakingPosition.status === 'error' ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <p className="mb-4" style={{ color: 'var(--error)' }}>{stakingPosition.error}</p>
                    <button
                      onClick={() => setStakingPosition(prev => ({ ...prev, status: 'loading', error: null }))}
                      className="px-4 py-2 rounded-lg font-mono text-sm"
                      style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--paper-void)' }}
                    >
                      Retry
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="rounded-lg p-4 text-center" style={{ backgroundColor: 'var(--paper-surface)' }}>
                      <p className="text-2xl font-bold mb-1" style={{ color: 'var(--paper-text)' }}>
                        {stakingPosition.position?.hasPosition ? formatNumber(Number(stakingPosition.position.stakedBalance)) : '0'}
                      </p>
                      <p className="text-base" style={{ color: 'var(--paper-muted)' }}>DIEM Staked</p>
                    </div>
                    <div className="rounded-lg p-4 text-center" style={{ backgroundColor: 'var(--paper-surface)' }}>
                      <p className="text-2xl font-bold mb-1" style={{ color: 'var(--paper-text)' }}>
                        {stakingPosition.position?.hasPosition ? formatNumber(Number(stakingPosition.position.votingPower)) : '0'}
                      </p>
                      <p className="text-base" style={{ color: 'var(--paper-muted)' }}>Voting Power</p>
                    </div>
                    <div className="rounded-lg p-4 text-center" style={{ backgroundColor: 'var(--paper-surface)' }}>
                      <p className="text-2xl font-bold mb-1" style={{ color: 'var(--paper-text)' }}>
                        {stakingPosition.position?.hasPosition ? formatNumber(Number(stakingPosition.position.inferenceBudget)) : '0'}
                      </p>
                      <p className="text-base" style={{ color: 'var(--paper-muted)' }}>Inference Budget</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <input
                        type="number"
                        value={stakeAmount}
                        onChange={(e) => setStakeAmount(e.target.value)}
                        placeholder="Enter amount in wei"
                        className="w-full px-4 py-3 rounded-lg font-mono text-sm"
                        style={{ backgroundColor: 'var(--paper-surface)', color: 'var(--paper-text)', border: '1px solid var(--paper-border)' }}
                      />
                      <p className="text-xs mt-1" style={{ color: 'var(--paper-muted)' }}>Amount in wei</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleStake}
                        disabled={stakingActionLoading !== null || !stakeAmount}
                        className="flex-1 sm:flex-none px-6 py-3 rounded-lg font-mono font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                        style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--paper-void)' }}
                      >
                        {stakingActionLoading === 'stake' ? (
                          <span className="animate-spin">⟳</span>
                        ) : (
                          <ChevronUp size={16} />
                        )}
                        STAKE
                      </button>
                      <button
                        onClick={handleUnstake}
                        disabled={stakingActionLoading !== null || !stakeAmount}
                        className="flex-1 sm:flex-none px-6 py-3 rounded-lg font-mono font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                        style={{ backgroundColor: 'var(--paper-muted)', color: 'var(--paper-text)' }}
                      >
                        {stakingActionLoading === 'unstake' ? (
                          <span className="animate-spin">⟳</span>
                        ) : (
                          <ChevronDown size={16} />
                        )}
                        UNSTAKE
                      </button>
                    </div>
                  </div>
                  {stakingActionError && (
                    <p className="text-sm" style={{ color: 'var(--error)' }}>{stakingActionError}</p>
                  )}
                  {stakingActionSuccess && (
                    <p className="text-sm" style={{ color: 'var(--success)' }}>{stakingActionSuccess}</p>
                  )}
                </div>
              )}
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
