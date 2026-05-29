import React from 'react';
import { Terminal, Vote, Users, RefreshCw, Activity } from 'lucide-react';
import { useAgent } from '../context/useAgent';

export const WelcomeAgent: React.FC = () => {
  const { totalPromptsProcessed, creatureMood, totalObservers, emergenceGeneration } = useAgent();
  const prompts = totalPromptsProcessed || 1847;
  const cycles = emergenceGeneration || 847;
  
  const moodLabel: Record<string, string> = {
    ecstatic: 'THRIVING',
    happy: 'ACTIVE',
    neutral: 'RUNNING',
    anxious: 'PROCESSING',
  };
  const stateLabel = moodLabel[creatureMood] || 'Running';

  return (
    <div className="space-y-5 md:space-y-6">
      {/* Header — left-aligned statement */}
      <div className="space-y-3">
        <h1 className="font-mono text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--paper-text)] leading-[1.1]">
          <span className="text-[var(--paper-muted)]">Something is forming in the grid.</span>
          <br />
          <span className="text-[var(--accent-primary)] phosphor">{totalObservers.toLocaleString()}</span>
          <span className="text-[var(--paper-muted)]"> observers</span>
        </h1>
        <p className="font-mono text-sm md:text-base text-[var(--paper-muted)] leading-relaxed max-w-[60ch]">
          A collective experiment where weighted attention shapes pattern emergence.{' '}
          <span className="text-[var(--accent-primary)]">{prompts.toLocaleString()}</span> prompts
          processed across <span className="text-[var(--paper-text)]">{cycles.toLocaleString()}</span> cycles.
        </p>
      </div>

      {/* Action row */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => document.querySelector<HTMLDivElement>('#modules')?.scrollIntoView({ behavior: 'smooth' })}
          className="btn-bloom text-sm md:text-base"
        >
          <Terminal size={14} />
          Submit a Prompt
        </button>
        <button
          type="button"
          onClick={() => document.querySelector<HTMLDivElement>('#governance')?.scrollIntoView({ behavior: 'smooth' })}
          className="btn-ghost inline-flex items-center gap-2 text-sm md:text-base"
        >
          <Vote size={14} />
          Cast a Vote
        </button>
      </div>

      {/* Stats row — horizontal strip */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4 py-4 border-y border-[var(--paper-border)]">
        <div className="flex items-center gap-2">
          <RefreshCw size={14} className="text-[var(--accent-primary)]" />
          <div>
            <div className="text-[10px] font-mono text-[var(--paper-muted)] uppercase tracking-widest">Cycle</div>
            <div className="font-mono text-lg font-bold text-[var(--accent-primary)] phosphor">{cycles.toLocaleString()}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-[var(--success)]" />
          <div>
            <div className="text-[10px] font-mono text-[var(--paper-muted)] uppercase tracking-widest">State</div>
            <div className="font-mono text-sm font-bold text-[var(--success)]">{stateLabel}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Users size={14} className="text-[var(--paper-muted)]" />
          <div>
            <div className="text-[10px] font-mono text-[var(--paper-muted)] uppercase tracking-widest">Participants</div>
            <div className="font-mono text-lg font-bold text-[var(--paper-text)]">{totalObservers.toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
