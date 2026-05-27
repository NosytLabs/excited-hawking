import { BookOpen, Target, BarChart3, AlertTriangle } from 'lucide-react';

export const Methodology = () => {
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen size={16} className="text-[var(--vault-teal)]" />
        <span className="text-[10px] font-mono text-[var(--shell-text-muted)] uppercase tracking-wider">
          Study Methodology
        </span>
      </div>
      
      <div className="space-y-4 text-xs">
        <div className="p-3 bg-[var(--shell-surface-2)] rounded-lg border border-[var(--shell-border)]">
          <div className="flex items-center gap-2 mb-2">
            <Target size={12} className="text-[var(--shell-accent)]" />
            <span className="font-medium text-[var(--shell-text)]">Research Question</span>
          </div>
          <p className="text-[var(--shell-text-muted)] leading-relaxed">
            How do structured participant interactions affect pattern emergence in a deterministic computational system?
            Can decentralized coordination produce measurable structural complexity over time?
          </p>
        </div>
        
        <div className="p-3 bg-[var(--shell-surface-2)] rounded-lg border border-[var(--shell-border)]">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 size={12} className="text-[var(--vault-teal)]" />
            <span className="font-medium text-[var(--shell-text)]">Metrics</span>
          </div>
          <p className="text-[var(--shell-text-muted)] leading-relaxed">
            Grid Complexity: Structural pattern density in response generation<br />
            Contribution Weight: Token-weighted input influence<br />
            Governance Participation: Voting rates on proposals<br />
            Treasury Flow: Resource allocation patterns
          </p>
        </div>
        
<div className="p-3 bg-[var(--shell-surface-2)] rounded-lg border border-[var(--shell-border)]">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={12} className="text-[var(--term-amber)]" />
            <span className="font-medium text-[var(--shell-text)]">Limitations</span>
          </div>
          <p className="text-[var(--shell-text-muted)] leading-relaxed">
            This is an observational study of computational patterns—not claims of consciousness, 
            sentience, or subjective experience. Results reflect structured participant interactions, 
            not autonomous AI behavior.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Methodology;
