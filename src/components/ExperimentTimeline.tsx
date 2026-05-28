import { Calendar, Flag } from 'lucide-react';

interface TimelineEvent {
  cycle: number;
  date: string;
  title: string;
  description: string;
  type: 'start' | 'milestone' | 'proposal' | 'complete';
}

const timeline: TimelineEvent[] = [
  { cycle: 0, date: '2026-05-01', title: 'Experiment Launched', description: 'Study parameters initialized, first participants join', type: 'start' },
  { cycle: 100, date: '2026-05-10', title: 'First Proposal', description: 'G-001: Initial treasury allocation approved', type: 'proposal' },
  { cycle: 250, date: '2026-05-15', title: 'Grid Milestone', description: 'Emergence grid reaches 25% density', type: 'milestone' },
  { cycle: 500, date: '2026-05-22', title: 'Memory Graph', description: 'First persistent memory connections form', type: 'milestone' },
  { cycle: 750, date: '2026-05-25', title: 'Governance Update', description: 'Quadratic voting parameters adjusted', type: 'proposal' },
  { cycle: 847, date: '2026-05-26', title: 'Current Cycle', description: 'Observational phase ongoing', type: 'complete' },
];

const typeColors = {
  start: 'bg-[var(--accent-primary)]',
  milestone: 'bg-[var(--success)]',
  proposal: 'bg-[var(--accent-dim)]',
  complete: 'bg-[var(--paper-muted)]',
};

export const ExperimentTimeline = () => {
  return (
    <div>
      {/* Header — no eyebrow */}
      <div className="flex items-center gap-3 mb-5 md:mb-6 pb-4 border-b border-[var(--paper-border)]">
        <Calendar size={14} className="text-[var(--accent-primary)]" />
        <div className="flex items-center justify-between w-full">
          <span className="text-sm font-mono text-[var(--paper-muted)]">Cycle 847 — Observation Phase</span>
          <span className="text-sm font-mono text-[var(--paper-muted)]">Started: 2026-05-01</span>
        </div>
      </div>

      {/* Timeline — left rail */}
      <div className="relative pl-5 md:pl-6">
        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-[var(--paper-border)]" />

        <div className="space-y-4 md:space-y-5">
          {timeline.map((event) => (
            <div key={event.cycle} className="flex items-start gap-3 md:gap-4 relative">
              <div className={`absolute left-[-17px] w-5 h-5 rounded-full flex items-center justify-center ${typeColors[event.type]}`}>
                <Flag size={10} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-mono font-medium text-[var(--paper-text)]">{event.title}</span>
                  <span className="text-sm font-mono text-[var(--accent-primary)] shrink-0">C{event.cycle}</span>
                </div>
                <p className="text-sm text-[var(--paper-muted)] mt-0.5">{event.description}</p>
                <span className="text-xs text-[var(--paper-muted)] font-mono">{event.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExperimentTimeline;
