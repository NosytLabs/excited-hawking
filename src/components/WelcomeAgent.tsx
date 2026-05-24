import React from 'react';
import { Radio, FlaskConical } from 'lucide-react';

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
            Enter the social experiment.
          </h2>
          
          <p className="text-base md:text-lg text-[var(--shell-text-muted)] font-body leading-relaxed max-w-xl">
            A public vault for testing collective intelligence. Submit prompts, observe emergence, participate in governance. Your contributions shape what emerges.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button 
            type="button" 
            className="btn-primary flex items-center gap-2 bg-[var(--vault-teal)] text-white border-[var(--vault-teal)] hover:bg-[var(--vault-teal-dim)]"
            onClick={() => document.querySelector<HTMLDivElement>('#prompt')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <FlaskConical size={16} />
            Begin Experiment
          </button>
          <a 
            href="https://github.com/veniceai/the-commons-agent" 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn-secondary flex items-center gap-2"
          >
            View Protocol
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 p-4 md:p-6 bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-xl">
        <div className="flex flex-col">
          <span className="text-[10px] font-mono text-[var(--shell-text-muted)] uppercase tracking-wider mb-1">Experiment Type</span>
          <span className="text-sm font-bold text-[var(--shell-text)]">Social Vault</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-mono text-[var(--shell-text-muted)] uppercase tracking-wider mb-1">Consciousness</span>
          <span className="text-sm font-bold text-[var(--vault-teal)]">Growing</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-mono text-[var(--shell-text-muted)] uppercase tracking-wider mb-1">Emergence</span>
          <span className="text-sm font-bold text-[var(--vault-teal-dim)]">Active</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-mono text-[var(--shell-text-muted)] uppercase tracking-wider mb-1">Status</span>
          <span className="text-sm font-bold text-[var(--shell-success)]">Observing</span>
        </div>
      </div>
    </div>
  );
};