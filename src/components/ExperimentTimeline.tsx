import { Calendar, Flag, CheckCircle } from 'lucide-react';

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

const typeIcons = {
  start: Flag,
  milestone: CheckCircle,
  proposal: Calendar,
  complete: CheckCircle,
};

const typeColors = {
  start: 'bg-[var(--vault-teal)]',
  milestone: 'bg-[var(--shell-success)]',
  proposal: 'bg-[var(--shell-accent)]',
  complete: 'bg-[var(--shell-text-muted)]',
};

export const ExperimentTimeline = () => {
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <Calendar size={16} className="text-[var(--vault-teal)]" />
        <span className="text-[10px] font-mono text-[var(--shell-text-muted)] uppercase tracking-wider">
          Study Timeline
        </span>
      </div>
      
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-px bg-[var(--shell-border)]" />
        
        <div className="space-y-4">
          {timeline.map((event) => {
            const Icon = typeIcons[event.type];
            return (
              <div key={event.cycle} className="flex items-start gap-3 relative">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${typeColors[event.type]}`}>
                  <Icon size={14} className="text-white" />
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[var(--shell-text)]">{event.title}</span>
                    <span className="text-[10px] font-mono text-[var(--vault-teal)]">C{event.cycle}</span>
                  </div>
                  <p className="text-xs text-[var(--shell-text-muted)] mt-0.5">{event.description}</p>
                  <span className="text-[10px] text-[var(--shell-text-muted)]">{event.date}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="mt-4 pt-3 border-t border-[var(--shell-border)]">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[var(--shell-text-muted)]">Cycle: 847 / Observation Phase</span>
          <span className="text-[var(--shell-text-muted)]">Started: 2026-05-01</span>
        </div>
      </div>
    </div>
  );
};

export default ExperimentTimeline;



