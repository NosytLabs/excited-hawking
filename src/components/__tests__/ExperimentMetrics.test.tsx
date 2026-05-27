import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ExperimentMetrics } from '../ExperimentMetrics';

describe('ExperimentMetrics', () => {
  it('should render without crashing', () => {
    render(<ExperimentMetrics />);
  });

  it('should display default participant count', () => {
    const { getByText } = render(<ExperimentMetrics />);
    expect(getByText('127')).toBeInTheDocument();
  });

  it('should display custom props when provided', () => {
    const { getByText } = render(
      <ExperimentMetrics participants={500} promptsProcessed={10000} emergenceLevel={5} />
    );
    expect(getByText('500')).toBeInTheDocument();
    expect(getByText('10,000')).toBeInTheDocument();
    expect(getByText('Stage 5')).toBeInTheDocument();
  });

  it('should display metrics label', () => {
    const { getByText } = render(<ExperimentMetrics />);
    expect(getByText('Experiment Metrics')).toBeInTheDocument();
  });

  it('should display cycle information', () => {
    const { getByText } = render(<ExperimentMetrics cycle={999} />);
    expect(getByText('999')).toBeInTheDocument();
    expect(getByText('Cycle')).toBeInTheDocument();
  });

  it('should show study phase', () => {
    const { getByText } = render(<ExperimentMetrics />);
    expect(getByText('Observation')).toBeInTheDocument();
    expect(getByText('Study Phase')).toBeInTheDocument();
  });

  it('should show running state', () => {
    const { getByText } = render(<ExperimentMetrics />);
    expect(getByText('Running')).toBeInTheDocument();
    expect(getByText('State')).toBeInTheDocument();
  });
});
