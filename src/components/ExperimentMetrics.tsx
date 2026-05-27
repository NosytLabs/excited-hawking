import React from 'react';
import { Users, MessageSquare, Brain, GitBranch, Zap, Activity } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  delta?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, delta, icon, trend = 'stable' }) => (
  <div className="flex flex-col p-3 bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-lg">
    <div className="flex items-center gap-2 mb-2">
      <span className="text-[var(--shell-text-muted)]">{icon}</span>
      <span className="text-[10px] font-mono text-[var(--shell-text-muted)] uppercase tracking-wider">{label}</span>
    </div>
    <div className="text-xl font-bold text-[var(--shell-text)] font-mono">{value}</div>
    {delta && (
      <div className={`text-[10px] font-mono mt-1 ${
        trend === 'up' ? 'text-[var(--shell-success)]' : 
        trend === 'down' ? 'text-[var(--shell-danger)]' : 
        'text-[var(--shell-text-muted)]'
      }`}>
        {delta}
      </div>
    )}
  </div>
);

interface ExperimentMetricsProps {
  participants?: number;
  promptsProcessed?: number;
  emergenceLevel?: number;
  memoryNodes?: number;
  connections?: number;
  patternVectors?: number;
  cycle?: number;
}

export const ExperimentMetrics: React.FC<ExperimentMetricsProps> = ({
  participants = 127,
  promptsProcessed = 1847,
  emergenceLevel = 3,
  memoryNodes = 4,
  connections = 12,
  patternVectors = 7,
  cycle = 847,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Activity size={14} className="text-[var(--vault-teal)]" />
        <span className="text-[10px] font-mono text-[var(--shell-text-muted)] uppercase tracking-wider">
          Experiment Metrics
        </span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <MetricCard
          label="Participants"
          value={participants.toLocaleString()}
          delta="+12 today"
          icon={<Users size={14} />}
          trend="up"
        />
        <MetricCard
          label="Prompts Processed"
          value={promptsProcessed.toLocaleString()}
          delta="+43 today"
          icon={<MessageSquare size={14} />}
          trend="up"
        />
        <MetricCard
          label="Grid Complexity"
          value={`Stage ${emergenceLevel}`}
          delta="+0.2% growth"
          icon={<Zap size={14} />}
          trend="up"
        />
        <MetricCard
          label="Memory Nodes"
          value={memoryNodes}
          delta="stable"
          icon={<Brain size={14} />}
          trend="stable"
        />
        <MetricCard
          label="Connections"
          value={connections}
          delta="forming"
          icon={<GitBranch size={14} />}
          trend="up"
        />
        <MetricCard
          label="Pattern Vectors"
          value={patternVectors}
          delta="detected"
          icon={<Activity size={14} />}
          trend="stable"
        />
      </div>

      <div className="grid grid-cols-3 gap-3 p-3 bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-lg">
        <div className="flex flex-col">
          <span className="text-[10px] font-mono text-[var(--shell-text-muted)] uppercase tracking-wider mb-1">Cycle</span>
          <span className="text-sm font-bold text-[var(--vault-teal)] font-mono">{cycle}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-mono text-[var(--shell-text-muted)] uppercase tracking-wider mb-1">Study Phase</span>
          <span className="text-sm font-bold text-[var(--shell-text)] font-mono">Observation</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-mono text-[var(--shell-text-muted)] uppercase tracking-wider mb-1">State</span>
          <span className="text-sm font-bold text-[var(--shell-success)] font-mono">Running</span>
        </div>
      </div>
    </div>
  );
};

export default ExperimentMetrics;