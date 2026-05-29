import { Info } from 'lucide-react';
import { useAgent } from '../context/useAgent';

export const ExperimentHypothesis = () => {
  const { totalObservers } = useAgent();

  return (
    <div className="space-y-3 md:space-y-4">
      <h3 className="font-mono text-sm md:text-base font-bold text-[var(--paper-text)] leading-tight">
        What happens when{' '}
        <span className="phosphor text-[var(--accent-primary)]">{totalObservers > 0 ? totalObservers : '--'}</span>{' '}
        observers focus their attention together?
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 text-sm md:text-base text-[var(--paper-muted)]">
        <div>
          <h4 className="text-sm font-mono font-bold text-[var(--paper-text)] uppercase tracking-wider mb-2">What We Observe</h4>
          <p className="leading-relaxed">
            Weighted prompts flow into a cellular automaton. Watch how patterns form when collective attention focuses. See what emerges when many independent choices synchronize.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-mono font-bold text-[var(--paper-text)] uppercase tracking-wider mb-2">What We Measure</h4>
          <ul className="space-y-1 font-mono text-sm">
            <li>Grid complexity — structural pattern density</li>
            <li>Memory connections — semantic links forming</li>
            <li>Pattern persistence — how long structures last</li>
            <li>Participation patterns — when observers engage</li>
          </ul>
        </div>
      </div>

      <div className="p-3 border border-[var(--warning)]/30 bg-[var(--paper-surface)]">
        <div className="flex items-start gap-2">
          <Info size={12} className="text-[var(--warning)] mt-0.5 flex-shrink-0" />
          <div className="text-sm text-[var(--paper-muted)] leading-relaxed">
            <strong className="text-[var(--warning)] font-mono">Disclaimer:</strong> Observational study of computational patterns — not claims of consciousness, sentience, or subjective experience.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExperimentHypothesis;
