import React from 'react';
import { FileInput, Cpu, Network, Sparkles, BarChart3 } from 'lucide-react';

interface ProcessStepProps {
  step: number;
  label: string;
  description: string;
  isActive?: boolean;
  isComplete?: boolean;
}

const ProcessStep: React.FC<ProcessStepProps> = ({ step, label, description, isActive = false, isComplete = false }) => (
  <div className="flex flex-col items-center text-center">
    <div 
      className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
        isComplete 
          ? 'bg-[var(--shell-success)]/20 text-[var(--shell-success)]' 
          : isActive 
            ? 'bg-[var(--vault-teal)]/20 text-[var(--vault-teal)]' 
            : 'bg-[var(--shell-surface)] text-[var(--shell-text-muted)] border border-[var(--shell-border)]'
      }`}
    >
      {isComplete ? (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <span className="text-sm font-mono font-bold">{step}</span>
      )}
    </div>
    <span className={`text-xs font-mono mb-1 ${isActive ? 'text-[var(--vault-teal)]' : 'text-[var(--shell-text-muted)]'}`}>
      {label}
    </span>
    <span className="text-[10px] text-[var(--shell-text-muted)] max-w-[80px]">{description}</span>
  </div>
);

interface ProcessFlowProps {
  activeStep?: number;
  completedSteps?: number[];
}

export const ProcessFlow: React.FC<ProcessFlowProps> = ({ 
  activeStep = 1, 
  completedSteps = [0] 
}) => {
  const steps = [
    { num: 1, label: 'Input', description: 'Submit weighted prompt', icon: FileInput },
    { num: 2, label: 'Weight', description: 'Stake determines influence', icon: Cpu },
    { num: 3, label: 'Process', description: 'CA grid updates', icon: Network },
    { num: 4, label: 'Emergence', description: 'Patterns visible in grid', icon: Sparkles },
    { num: 5, label: 'Output', description: 'Results recorded on-chain', icon: BarChart3 },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Network size={14} className="text-[var(--vault-teal)]" />
        <span className="text-[10px] font-mono text-[var(--shell-text-muted)] uppercase tracking-wider">
          Emergence Process
        </span>
      </div>

      <div className="flex items-center justify-between p-4 bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-lg">
        {steps.map((step, index) => (
          <React.Fragment key={step.num}>
            <ProcessStep
              step={step.num}
              label={step.label}
              description={step.description}
              isActive={step.num === activeStep}
              isComplete={completedSteps.includes(step.num)}
            />
            {index < steps.length - 1 && (
              <div className={`flex-1 h-px mx-2 ${
                completedSteps.includes(step.num + 1) 
                  ? 'bg-[var(--shell-success)]' 
                  : 'bg-[var(--shell-border)]'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="text-[10px] font-mono text-[var(--shell-text-muted)] text-center">
        Weighted attention → cellular automaton → observable pattern emergence
      </div>
    </div>
  );
};

export default ProcessFlow;