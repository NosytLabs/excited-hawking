import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Leaderboard } from '../Leaderboard';

describe('Leaderboard', () => {
  it('should render without crashing', () => {
    render(<Leaderboard />);
  });

  it('should display participant rankings header', () => {
    const { getByText } = render(<Leaderboard />);
    expect(getByText('Participant Rankings')).toBeInTheDocument();
  });

  it('should display cycle number', () => {
    const { getByText } = render(<Leaderboard />);
    expect(getByText('Cycle 847')).toBeInTheDocument();
  });

  it('should render all 5 mock leaderboard entries', () => {
    const { getByText } = render(<Leaderboard />);
    expect(getByText('0x1234...5678')).toBeInTheDocument();
    expect(getByText('0xabcd...efgh')).toBeInTheDocument();
    expect(getByText('0x9876...5432')).toBeInTheDocument();
  });

  it('should display contribution counts', () => {
    const { getByText } = render(<Leaderboard />);
    expect(getByText('847')).toBeInTheDocument();
    expect(getByText('623')).toBeInTheDocument();
    expect(getByText('412')).toBeInTheDocument();
  });

  it('should display total participants', () => {
    const { getByText } = render(<Leaderboard />);
    expect(getByText('Total participants: 127+')).toBeInTheDocument();
  });

  it('should display ranking explanation', () => {
    const { getByText } = render(<Leaderboard />);
    expect(getByText('Rank by: weight × sqrt(contributions)')).toBeInTheDocument();
  });
});
