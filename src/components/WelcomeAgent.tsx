import React from 'react';
import { Terminal, Vote } from 'lucide-react';
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
    <div className="space-y-6 md:space-y-8">
      {/* Left-aligned statement — no eyebrow, big type */}
      <div className="space-y-3 md:space-y-4">
        <h1 className="font-mono text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-[var(--paper-text)] leading-tight max-w-2xl">
          Something is forming in the grid.{' '}
          <span className="phosphor text-[var(--accent-primary)]">{totalObservers}</span> observers
          watching it emerge.
        </h1>
        <p className="font-mono text-sm sm:text-base text-[var(--paper-muted)] max-w-[65ch] leading-relaxed">
          A collective experiment where weighted attention shapes pattern emergence.{' '}
          <span className="phosphor text-[var(--accent-primary)]">{prompts.toLocaleString()}</span> prompts
          processed across <span className="text-[var(--paper-text)]">{cycles.toLocaleString()}</span> cycles.
          Your participation adds to what becomes visible.
        </p>
      </div>

      {/* Action row — left-aligned, not centered */}
      <div className="flex flex-wrap items-center gap-3 md:gap-4">
        <button
          type="button"
          onClick={() => document.querySelector<HTMLDivElement>('#modules')?.scrollIntoView({ behavior: 'smooth' })}
          className="btn-bloom text-sm md:text-base"
        >
          <Terminal size={14} />
          Submit a Prompt
        </button>
        <a
          href="#governance"
          className="btn-ghost inline-flex items-center gap-2 text-sm md:text-base"
        >
          <Vote size={14} />
          Cast a Vote
        </a>
      </div>

      {/* Cycle status row — inline, not card */}
      <div className="flex flex-wrap items-center gap-x-4 md:gap-x-6 gap-y-3 py-4 border-y border-[var(--paper-border)]">
        <div className="space-y-0.5">
          <span className="font-mono text-xs text-[var(--paper-muted)] uppercase tracking-widest block">Cycle</span>
          <span className="font-mono text-lg md:text-xl font-bold text-[var(--accent-primary)] phosphor">{cycles.toLocaleString()}</span>
        </div>
        <div className="space-y-0.5">
          <span className="font-mono text-xs text-[var(--paper-muted)] uppercase tracking-widest block">Phase</span>
          <span className="font-mono text-sm font-bold text-[var(--paper-text)]">Observation</span>
        </div>
        <div className="space-y-0.5">
          <span className="font-mono text-xs text-[var(--paper-muted)] uppercase tracking-widest block">State</span>
          <span className="font-mono text-sm font-bold text-[var(--success)]">{stateLabel}</span>
        </div>
        <div className="space-y-0.5">
          <span className="font-mono text-xs text-[var(--paper-muted)] uppercase tracking-widest block">Participants</span>
          <span className="font-mono text-lg md:text-xl font-bold text-[var(--paper-text)] phosphor">{totalObservers}</span>
        </div>
      </div>
    </div>
  );
};
