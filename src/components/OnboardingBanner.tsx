import React, { useState } from 'react';
import { Cpu, ChevronRight, X, FlaskConical, Users, Brain, Vote } from 'lucide-react';

export const OnboardingBanner = React.memo(function OnboardingBannerComponent() {
  const [isVisible, setIsVisible] = useState(() => {
    try {
      const stored = localStorage.getItem('vault_experiment_onboarding_dismissed');
      return stored !== 'true';
    } catch {
      return true;
    }
  });

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      localStorage.setItem('vault_experiment_onboarding_dismissed', 'true');
    } catch (e) {
      console.warn('Could not save onboarding dismissal to localStorage', e);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 mb-6 md:mb-8 relative">
      <div className="bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-xl p-5 md:p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--vault-teal)]/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        
        <button 
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-[var(--shell-text-muted)] hover:text-[var(--shell-text)] transition-colors p-1 rounded hover:bg-[var(--shell-surface-2)]"
          aria-label="Dismiss banner"
        >
          <X size={20} />
        </button>

        <div className="flex items-start gap-4 md:gap-5">
          <div className="p-3 bg-[var(--vault-teal)]/10 border border-[var(--vault-teal)]/20 rounded-xl text-[var(--vault-teal)] hidden sm:block">
            <FlaskConical size={28} />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg md:text-xl font-medium text-[var(--shell-text)] flex items-center gap-2">
              <FlaskConical size={18} className="text-[var(--vault-teal)] sm:hidden" />
              Watch patterns emerge from collective attention
            </h3>
            <span className="badge bg-[var(--vault-teal)]/10 text-[var(--vault-teal)] border border-[var(--vault-teal)]/20 text-[10px]">
              127 participants · Cycle 847
            </span>
          </div>
          
          <p className="text-[var(--shell-text-muted)] text-sm mb-5 leading-relaxed max-w-3xl">
            Your attention shapes what becomes visible. Prompts weighted by stake flow into a cellular automaton. 
            Governance votes guide the experiment's direction. <a href="#about" className="text-[var(--vault-teal)] hover:underline">Learn how it works →</a>
          </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
              <div className="flex items-start gap-3 p-3 bg-[var(--shell-bg)] rounded-lg border border-[var(--shell-border)]">
                <div className="p-2 bg-[var(--shell-surface-2)] rounded-lg">
                  <Users size={16} className="text-[var(--vault-teal)]" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[var(--shell-text)] block">Weighted Participation</span>
                  <span className="text-[10px] text-[var(--shell-text-muted)]">Influence proportional to stake</span>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-[var(--shell-bg)] rounded-lg border border-[var(--shell-border)]">
                <div className="p-2 bg-[var(--shell-surface-2)] rounded-lg">
                  <Brain size={16} className="text-[var(--shell-accent-strong)]" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[var(--shell-text)] block">Emergence Grid</span>
                  <span className="text-[10px] text-[var(--shell-text-muted)]">Cellular automaton visualization</span>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-[var(--shell-bg)] rounded-lg border border-[var(--shell-border)]">
                <div className="p-2 bg-[var(--shell-surface-2)] rounded-lg">
                  <Vote size={16} className="text-[var(--shell-success)]" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[var(--shell-text)] block">On-Chain Governance</span>
                  <span className="text-[10px] text-[var(--shell-text-muted)]">Quadratic voting, transparent</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 md:gap-6">
              <a href="#prompt" className="flex items-center gap-2 text-sm font-medium text-[var(--vault-teal)] hover:text-[var(--shell-accent-strong)] transition-colors group">
                <Cpu size={16} />
                Submit Prompt
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="#governance" className="flex items-center gap-2 text-sm font-medium text-[var(--shell-text-muted)] hover:text-[var(--shell-text)] transition-colors group">
                <Vote size={16} />
                View Proposals
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="#canvas" className="flex items-center gap-2 text-sm font-medium text-[var(--shell-text-muted)] hover:text-[var(--shell-text)] transition-colors group">
                <Brain size={16} />
                Watch Emergence
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});