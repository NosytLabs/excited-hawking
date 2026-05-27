import React from 'react';
import { Radio, FlaskConical } from 'lucide-react';
import { ExperimentMetrics } from './ExperimentMetrics';
import { ProcessFlow } from './ProcessFlow';

export const WelcomeAgent: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 pt-8 md:pt-12 pb-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-8">
        <div className="flex-1 max-w-2xl">
          <div className="flex items-center gap-3 mb-4">
            <span className="badge bg-[var(--vault-teal)]/10 text-[var(--vault-teal)] border border-[var(--vault-teal)]/20 flex items-center gap-1.5">
              <FlaskConical size={12} />
              Vault Experiment
            </span>
            <span className="badge bg-[var(--shell-surface)] border border-[var(--shell-border)] text-[var(--shell-text-muted)]">
              <Radio size={12} className="animate-pulse mr-1.5" />
              Live
            </span>
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--shell-text)] mb-4 leading-tight">
            Something is forming in the grid.<br />
            <span className="text-[var(--vault-teal)]">127 observers</span> are watching it emerge.
          </h2>
          
          <p className="text-base md:text-lg text-[var(--shell-text-muted)] font-body leading-relaxed max-w-xl">
            A collective experiment where weighted attention shapes pattern emergence. 
            <span className="text-[var(--vault-teal)]">1,847 prompts</span> processed across 847 cycles.
            Your participation adds to what becomes visible.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button 
            type="button" 
            className="btn-primary flex items-center gap-2 bg-[var(--vault-teal)] text-white border-[var(--vault-teal)] hover:bg-[var(--vault-teal-dim)]"
            onClick={() => document.querySelector<HTMLDivElement>('#prompt')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <FlaskConical size={16} />
            Submit a Prompt
          </button>
          <a 
            href="#governance"
            className="btn-secondary flex items-center gap-2"
          >
            Cast a Vote
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <ExperimentMetrics />
        <ProcessFlow />
      </div>
    </div>
  );
};