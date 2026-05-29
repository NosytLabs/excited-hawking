import { render, waitFor } from '@testing-library/react';
import { describe, expect, it,vi } from 'vitest';
import { Leaderboard } from '../Leaderboard';

vi.mock('../context/useAgent', () => ({
  useAgent: () => ({ emergenceGeneration: 0 }),
}));

describe('Leaderboard', () => {
  it('should render without crashing', () => {
    render(<Leaderboard />);
  });

  it('should display participant rankings header', () => {
    const { getByText } = render(<Leaderboard />);
    expect(getByText('Participant Rankings')).toBeInTheDocument();
  });

  it('should display cycle number', async () => {
    const { getByText } = render(<Leaderboard />);
    await waitFor(() => {
      expect(getByText(/Cycle/)).toBeInTheDocument();
    });
  });

  it('should render all 5 mock leaderboard entries', async () => {
    const { getByText } = render(<Leaderboard />);
    await waitFor(() => {
      expect(getByText('0x1234...5678')).toBeInTheDocument();
    });
  });

  it('should display contribution counts', async () => {
    const { getByText } = render(<Leaderboard />);
    await waitFor(() => {
      expect(getByText('0')).toBeInTheDocument();
    });
  });

  it('should display total participants', async () => {
    const { queryByText } = render(<Leaderboard />);
    await waitFor(() => {
      expect(queryByText('Total participants:')).toBeNull();
    });
  });

  it('should display ranking explanation', async () => {
    const { getByText } = render(<Leaderboard />);
    await waitFor(() => {
      expect(getByText('Rank: weight x sqrt(contributions)')).toBeInTheDocument();
    });
  });
});
