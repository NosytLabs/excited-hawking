import React from 'react';
import { useAgent } from '../context/useAgent';
import { Shield, Radio, Lock } from 'lucide-react';

interface AppHeaderProps {
  onOpenStaking: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onOpenStaking }) => {
  const { backendAvailable, tier, diemStaked } = useAgent();

  const tierColors: Record<string, string> = {
    Dying: 'var(--shell-text-muted)',
    Minimal: 'var(--shell-text)',
    Surviving: 'var(--vault-teal)',
    Thriving: 'var(--shell-success)'
  };

  return (
<header className="sticky top-0 z-50 px-4 md:px-6 py-3 md:py-4 flex flex-wrap items-center justify-between gap-4 bg-[var(--shell-bg)]/95 backdrop-blur-md border-b border-[var(--shell-border)]" role="banner">
      <div className="flex items-center gap-3 md:gap-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-[var(--shell-surface)] border border-[var(--shell-border)] flex items-center justify-center">
            <Shield size={18} className="text-[var(--vault-teal)]" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold tracking-tight text-[var(--shell-text)] leading-none">
              The Commons Agent
            </h1>
            <p className="text-[10px] md:text-xs text-[var(--shell-text-muted)] font-mono uppercase tracking-wider mt-0.5">
              Vault Experiment · Public Study
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-lg px-3 py-1.5">
          <Radio size={12} className="text-[var(--vault-teal)] animate-pulse" />
          <span className="text-xs font-mono text-[var(--shell-text-muted)] uppercase tracking-wide">
            Experiment Active
          </span>
        </div>
      </div>
      
      <nav className="flex items-center gap-2 md:gap-4" aria-label="Main navigation">
        <div className="hidden sm:flex items-center gap-3 px-3 py-2 bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-lg">
          <Lock size={14} className="text-[var(--shell-text-muted)]" />
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-[var(--shell-text-muted)] uppercase">Status</span>
            <span className="text-xs font-bold" style={{ color: tierColors[tier] }}>{tier}</span>
          </div>
          <div className="w-px h-6 bg-[var(--shell-border)]" />
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-[var(--shell-text-muted)] uppercase">Stake</span>
            <span className="text-xs font-bold text-[var(--shell-accent)]">{diemStaked.toFixed(1)}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 sm:hidden">
            <span className={`w-2 h-2 rounded-full ${backendAvailable ? 'bg-[var(--shell-success)]' : 'bg-[var(--shell-text-muted)]'}`}></span>
            <span className="text-xs text-[var(--shell-text-muted)] sm:hidden">
              {backendAvailable ? 'Live' : 'Demo'}
            </span>
          </div>
          <span className="hidden sm:block w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: backendAvailable ? 'var(--shell-success)' : 'var(--shell-text-muted)' }} />
          <button 
            onClick={onOpenStaking}
            className="ml-1 md:ml-2 px-3 md:px-4 py-2 text-sm font-medium rounded-lg bg-[var(--vault-teal)] text-white hover:bg-[var(--vault-teal-dim)] transition-colors flex items-center gap-2"
            aria-label="Stake DIEM to unlock features"
          >
            <Shield size={14} />
            <span className="hidden sm:inline">Enter Vault</span>
            <span className="sm:hidden">Stake</span>
          </button>
        </div>
      </nav>
    </header>
  );
};