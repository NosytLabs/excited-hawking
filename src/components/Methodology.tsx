import { Target, BarChart3, AlertTriangle } from 'lucide-react';

export const Methodology = () => {
  return (
    <div className="space-y-3 md:space-y-4" role="region" aria-labelledby="methodology-heading">
      <div className="pb-3 border-b border-[var(--paper-border)]">
        <span id="methodology-heading" className="text-sm font-mono text-[var(--paper-muted)]">Research methodology</span>
      </div>

      <div className="space-y-3 text-sm">
        <div className="p-4 bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Target size={14} className="text-[var(--accent-primary)]" />
            <span className="font-medium text-[var(--paper-text)]">Research Question</span>
          </div>
          <p className="text-[var(--paper-muted)] leading-relaxed">
            How do structured participant interactions affect pattern emergence in a deterministic computational system?
            Can decentralized coordination produce measurable structural complexity over time?
          </p>
        </div>
        
        <div className="p-4 bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 size={14} className="text-[var(--accent-primary)]" />
            <span className="font-medium text-[var(--paper-text)]">Metrics</span>
          </div>
          <p className="text-[var(--paper-muted)] leading-relaxed">
            Grid Complexity: Structural pattern density in response generation<br />
            Contribution Weight: Token-weighted input influence<br />
            Governance Participation: Voting rates on proposals<br />
            Treasury Flow: Resource allocation patterns
          </p>
        </div>
        
        <div className="p-4 bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={14} className="text-[var(--warning)]" />
            <span className="font-medium text-[var(--paper-text)]">Limitations</span>
          </div>
          <p className="text-[var(--paper-muted)] leading-relaxed">
            Results may not generalize beyond this specific system. The creature does not experience, 
            learn, or have preferences. Participation patterns reflect structured interactions, not autonomous behavior.
          </p>
        </div>
      </div>
    </div>
  );
};
