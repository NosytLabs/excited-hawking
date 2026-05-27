import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WelcomeAgent } from '../WelcomeAgent';
import { OnboardingBanner } from '../OnboardingBanner';
import { PromptBox } from '../PromptBox';
import { PromptQueue } from '../PromptQueue';
import { AgentStream } from '../AgentStream';
import { LifeMeter } from '../LifeMeter';
import { AgentContext, type AgentState } from '../../context/AgentContext';

describe('Vault Experiment Copy', () => {
  const mockState = {
    backendAvailable: true,
    walletMode: 'preview' as const,
    tier: 'Minimal' as const,
    diemStaked: 100,
    treasuryUSDC: 50,
    prompts: [],
    logs: [],
    canvasPixels: [],
    proposals: [],
    addPrompt: vi.fn(),
    votePrompt: vi.fn(),
    addLog: vi.fn(),
    voteProposal: vi.fn(),
    isConnected: false,
    walletAddress: null,
    connectWallet: vi.fn(),
    disconnectWallet: vi.fn(),
    setProposals: vi.fn(),
    canVote: false,
    voteDisabledReason: 'Signed wallet voting is not available in this preview.'
  } as unknown as AgentState;

  const withProvider = (ui: React.ReactElement) => (
    <AgentContext.Provider value={mockState}>{ui}</AgentContext.Provider>
  );

  it('WelcomeAgent uses vault experiment copy', () => {
    render(withProvider(<WelcomeAgent />));
    expect(screen.getByText(/Something is forming in the grid/i)).toBeInTheDocument();
    expect(screen.getByText(/Vault Experiment/i)).toBeInTheDocument();
  });

  it('OnboardingBanner uses vault experiment copy', () => {
    render(withProvider(<OnboardingBanner />));
    expect(screen.getByText(/Watch patterns emerge from collective attention/i)).toBeInTheDocument();
    expect(screen.getByText(/127 participants/i)).toBeInTheDocument();
  });

  it('PromptBox uses warm copy', () => {
    render(withProvider(<PromptBox />));
    expect(screen.getByText(/Start a prompt/i)).toBeInTheDocument();
  });

  it('PromptQueue uses warm copy', () => {
    render(withProvider(<PromptQueue />));
    expect(screen.getByText(/Prompt queue/i)).toBeInTheDocument();
    expect(screen.getByText(/No prompts in queue yet/i)).toBeInTheDocument();
  });

  it('AgentStream uses vault experiment copy', () => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    render(withProvider(<AgentStream />));
    expect(screen.getByText(/Agent stream/i)).toBeInTheDocument();
    expect(screen.getByText(/Offline preview/i)).toBeInTheDocument();
  });

  it('LifeMeter uses vault experiment copy', () => {
    render(withProvider(<LifeMeter />));
    expect(screen.getByText(/Vault Status/i)).toBeInTheDocument();
    expect(screen.getByText(/Vault 0/i)).toBeInTheDocument();
  });
});