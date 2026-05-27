import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppHeader } from '../AppHeader';
import { AgentContext, type AgentState } from '../../context/AgentContext';

describe('AppHeader', () => {
  const mockState = {
    backendAvailable: true,
    walletMode: 'preview' as const,
    tier: 'Minimal' as const,
    diemStaked: 10,
  } as unknown as AgentState;

  it('renders vault experiment branding', () => {
    render(
      <AgentContext.Provider value={mockState}>
        <AppHeader onOpenStaking={() => {}} />
      </AgentContext.Provider>
    );
    
    expect(screen.getByText('The Commons Agent')).toBeInTheDocument();
    expect(screen.getByText('Vault Experiment · Public Study')).toBeInTheDocument();
  });

  it('renders Enter Vault button', () => {
    render(
      <AgentContext.Provider value={mockState}>
        <AppHeader onOpenStaking={() => {}} />
      </AgentContext.Provider>
    );
    
    expect(screen.getByText('Enter Vault')).toBeInTheDocument();
  });
});
