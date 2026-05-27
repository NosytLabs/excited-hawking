import { FlaskConical, Info } from 'lucide-react';

export const ExperimentHypothesis = () => {
  return (
    <div className="card mb-8">
      <div className="flex items-center gap-2 mb-4">
        <FlaskConical size={16} className="text-[var(--vault-teal)]" />
        <span className="text-[10px] font-mono text-[var(--shell-text-muted)] uppercase tracking-wider">
          Study Hypothesis
        </span>
      </div>
      
      <h3 className="text-xl font-display font-semibold text-[var(--shell-text)] mb-3">
        What happens when <span className="text-[var(--vault-teal)]">127 observers</span> focus their attention together?
      </h3>
      
      <div className="grid md:grid-cols-2 gap-4 text-sm text-[var(--shell-text-muted)]">
        <div>
          <h4 className="text-xs font-bold text-[var(--shell-text)] mb-1 uppercase">What We Observe</h4>
          <p>
            Weighted prompts flow into a cellular automaton. Watch how patterns form when collective attention focuses. See what emerges when many independent choices synchronize.
          </p>
        </div>
        <div>
          <h4 className="text-xs font-bold text-[var(--shell-text)] mb-1 uppercase">What We Measure</h4>
          <ul className="space-y-1 text-xs">
            <li>• Grid complexity — structural pattern density</li>
            <li>• Memory connections — semantic links forming</li>
            <li>• Pattern persistence — how long structures last</li>
            <li>• Participation patterns — when and how observers engage</li>
          </ul>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-[var(--shell-surface-2)] border border-[var(--term-amber)]/30 rounded-lg">
        <div className="flex items-start gap-2">
          <Info size={14} className="text-[var(--term-amber)] mt-0.5 flex-shrink-0" />
          <div className="text-xs text-[var(--shell-text-muted)]">
            <strong className="text-[var(--term-amber)]">Important disclaimer:</strong> This is an observational study of computational patterns—not claims of consciousness, sentience, or subjective experience. Results reflect structured participant interactions, not autonomous AI behavior. Results may not generalize beyond this specific system. The creature does not experience, learn, or have preferences.
          </div>
        </div>
      </div>
    </div>
  );
};
