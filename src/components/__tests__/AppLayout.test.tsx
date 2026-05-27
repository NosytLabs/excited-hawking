import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../../App';

vi.mock('../WelcomeAgent', () => ({ WelcomeAgent: () => <div /> }));
vi.mock('../OnboardingBanner', () => ({ OnboardingBanner: () => <div /> }));
vi.mock('../PromptBox', () => ({ PromptBox: () => <div /> }));
vi.mock('../AgentStream', () => ({ AgentStream: () => <div /> }));
vi.mock('../PromptQueue', () => ({ PromptQueue: () => <div /> }));
vi.mock('../LifeMeter', () => ({ LifeMeter: () => <div /> }));
vi.mock('../MemoryBrain', () => ({ MemoryBrain: () => <div /> }));
vi.mock('../SocialSharing', () => ({ SocialSharing: () => <div /> }));

describe('App Layout', () => {
  it('shows support rail on all screen sizes', () => {
    render(<App />);
    const supportRail = screen.getByTestId('support-rail');
    expect(supportRail.className).not.toContain('hidden');
  });
  
  it('renders vault branding', () => {
    render(<App />);
    expect(screen.getByText(/Vault Experiment · Public Study/i)).toBeInTheDocument();
  });
});