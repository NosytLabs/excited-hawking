import React, { useMemo } from 'react';
import { useAgent } from '../context/useAgent';
import type { Tier } from '../context/AgentContext';
import { Sprout, Flower2, Trees, Coins, Leaf, Heart, CircleDot, Activity, FlaskConical } from 'lucide-react';
import { CardSkeleton } from './LoadingSkeleton';

const TIER_DISPLAY: Record<Tier, { label: string; icon: React.ReactNode; color: string; description: string; vaultLevel: number }> = {
  Dying: { label: 'Vault -1', icon: <CircleDot size={20} />, color: 'var(--shell-text-muted)', description: 'Seeds dormant', vaultLevel: -1 },
  Minimal: { label: 'Vault 0', icon: <Sprout size={20} />, color: 'var(--shell-text)', description: 'Gathering phase', vaultLevel: 0 },
  Surviving: { label: 'Vault 1', icon: <Flower2 size={20} />, color: 'var(--vault-teal)', description: 'Active growth', vaultLevel: 1 },
  Thriving: { label: 'Vault 2', icon: <Trees size={20} />, color: 'var(--shell-success)', description: 'Full bloom', vaultLevel: 2 },
};

export const LifeMeter = React.memo(function LifeMeterComponent() {
  const { tier, diemStaked, treasuryUSDC, backendAvailable } = useAgent();

  const gardenVitality = Math.min(100, Math.max(0, (diemStaked / 500) * 100));
  const display = TIER_DISPLAY[tier];
  const color = display.color;

  const tierRanges = useMemo(() => ({
    Thriving: { min: 500, max: Infinity },
    Surviving: { min: 10, max: 500 },
    Minimal: { min: 0.1, max: 10 },
    Dying: { min: 0, max: 0.1 },
  }), []);

  const tierProgress = useMemo(() => {
    const range = tierRanges[tier];
    if (tier === 'Thriving') {
      return Math.min(100, (diemStaked / 1000) * 100);
    } else if (tier === 'Dying') {
      return diemStaked < 0.1 ? 100 : 0;
    } else {
      const size = range.max - range.min;
      return ((diemStaked - range.min) / size) * 100;
    }
  }, [tier, diemStaked, tierRanges]);

  const nextTier = useMemo(() => {
    if (tier === 'Dying') return 'Vault 0 (0.1 DIEM)';
    if (tier === 'Minimal') return 'Vault 1 (10 DIEM)';
    if (tier === 'Surviving') return 'Vault 2 (500 DIEM)';
    return 'Maximum level';
  }, [tier]);

  if (!backendAvailable && diemStaked === 0 && treasuryUSDC === 0) {
    return <CardSkeleton />;
  }

  return (
    <div className="card flex flex-col bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-xl p-4 md:p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3 md:gap-4">
          <div
            className="w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center border transition-all"
            style={{
              backgroundColor: 'var(--shell-surface-2)',
              color: color,
              borderColor: 'var(--shell-border)',
            }}
          >
            <FlaskConical size={18} />
          </div>
          <div>
            <p className="text-[10px] text-[var(--shell-text-muted)] font-mono uppercase tracking-wider mb-0.5">Vault Status</p>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[var(--shell-text)] leading-none">
              {display.label}
            </h2>
            <p className="text-xs text-[var(--shell-text-muted)]">{display.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3 px-3 py-2 bg-[var(--shell-bg)] rounded-xl border border-[var(--shell-border)]">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-[var(--vault-teal)]" />
            <span className="text-[10px] font-mono text-[var(--shell-text-muted)] uppercase hidden sm:inline">Vitality</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-20 md:w-24 h-1.5 bg-[var(--shell-surface-2)] rounded-full overflow-hidden">
              <div
                role="progressbar"
                aria-valuenow={Math.round(gardenVitality)}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-full bg-[var(--vault-teal)] transition-all duration-1000"
                style={{ width: `${gardenVitality}%` }}
              />
            </div>
            <span className="text-xs font-mono font-bold text-[var(--vault-teal-dim)]">{Math.round(gardenVitality)}%</span>
          </div>
        </div>
      </div>

      <div className="mb-4 p-3 md:p-4 bg-[var(--shell-bg)] rounded-xl border border-[var(--shell-border)]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono text-[var(--shell-text-muted)] uppercase">Growth Progress</span>
          <span className="text-[10px] font-mono text-[var(--shell-text-muted)]">
            Next: <span style={{ color }}>{nextTier}</span>
          </span>
        </div>
        <div className="relative h-2 bg-[var(--shell-surface-2)] rounded-full overflow-hidden">
          <div
            role="progressbar"
            aria-label="Growth progress"
            aria-valuenow={Math.round(tierProgress)}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-full transition-all duration-1000"
            style={{ width: `${tierProgress}%`, backgroundColor: color }}
          />
          <div className="absolute inset-0 flex items-center">
            {[0, 25, 50, 75, 100].map(mark => (
              <div key={mark} className="absolute w-px h-full bg-[var(--shell-border)]" style={{ left: `${mark}%` }} />
            ))}
          </div>
        </div>
        <div className="flex justify-between mt-1 text-[9px] md:text-[10px] font-mono text-[var(--shell-text-muted)]">
          <span>-1</span>
          <span>0</span>
          <span>1</span>
          <span>2</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
        <div className="p-2.5 md:p-3 bg-[var(--shell-bg)] rounded-xl border border-[var(--shell-border)]">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Leaf size={12} className="text-[var(--vault-teal)]" />
            <span className="font-mono text-[10px] uppercase text-[var(--shell-text-muted)]">Seeds</span>
          </div>
          <p className="text-base md:text-lg font-mono font-bold text-[var(--shell-text)]">{diemStaked.toFixed(2)}</p>
          <p className="text-[9px] md:text-[10px] font-mono text-[var(--shell-text-muted)] mt-0.5">DIEM staked</p>
        </div>

        <div className="p-2.5 md:p-3 bg-[var(--shell-bg)] rounded-xl border border-[var(--shell-border)]">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Heart size={12} className="text-[var(--vault-teal-dim)]" />
            <span className="font-mono text-[10px] uppercase text-[var(--shell-text-muted)]">Growth</span>
          </div>
          <p className="text-base md:text-lg font-mono font-bold text-[var(--vault-teal-dim)]">{gardenVitality.toFixed(0)}%</p>
          <p className="text-[9px] md:text-[10px] font-mono text-[var(--shell-text-muted)] mt-0.5">sqrt(Stake)</p>
        </div>

        <div className="p-2.5 md:p-3 bg-[var(--shell-bg)] rounded-xl border border-[var(--shell-border)]">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Coins size={12} className="text-[var(--shell-text)]" />
            <span className="font-mono text-[10px] uppercase text-[var(--shell-text-muted)]">Treasury</span>
          </div>
          <p className="text-base md:text-lg font-mono font-bold text-[var(--shell-text)]">${treasuryUSDC.toFixed(1)}</p>
          <p className="text-[9px] md:text-[10px] font-mono text-[var(--shell-text-muted)] mt-0.5">USDC</p>
        </div>

        <div className="p-2.5 md:p-3 bg-[var(--shell-bg)] rounded-xl border border-[var(--shell-border)]">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sprout size={12} className="text-[var(--shell-text-muted)]" />
            <span className="font-mono text-[10px] uppercase text-[var(--shell-text-muted)]">Influence</span>
          </div>
          <p className="text-base md:text-lg font-mono font-bold text-[var(--shell-text)]">{Math.sqrt(diemStaked).toFixed(2)}</p>
          <p className="text-[9px] md:text-[10px] font-mono text-[var(--shell-text-muted)] mt-0.5">Quadratic</p>
        </div>
      </div>
    </div>
  );
});