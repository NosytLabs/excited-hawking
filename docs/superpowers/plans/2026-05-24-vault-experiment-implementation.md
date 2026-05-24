# Vault Experiment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Revamp the existing "Commons Agent" frontend into a cohesive "Vault Experiment" social collective intelligence platform with improved UX, responsiveness, and a clear experiment narrative.

**Architecture:** Single-page React app with WebSocket real-time updates, Context-based state management, and lazy-loaded feature sections. The design follows a warm "Observatory Lab" aesthetic with the "Vault Experiment" branding throughout.

**Tech Stack:** React 19, TypeScript 6, Vite 8, TailwindCSS 4, Socket.io-client, Lucide icons, Fastify backend (existing)

---

## File Structure

```
src/
├── App.tsx                      # Main layout orchestrator
├── index.css                    # Design tokens + global styles
├── main.tsx                     # Entry point
├── context/
│   ├── AgentContext.tsx         # Global state (existing, minor updates)
│   └── useAgent.ts              # Hook (existing)
├── components/
│   ├── AppHeader.tsx            # Vault branding header
│   ├── WelcomeAgent.tsx          # Hero section
│   ├── OnboardingBanner.tsx     # Dismissible intro
│   ├── PromptBox.tsx             # Prompt submission
│   ├── AgentStream.tsx           # Real-time activity + emergence grid
│   ├── PromptQueue.tsx          # Community prompt queue
│   ├── LifeMeter.tsx             # Vault status / tier display
│   ├── Governance.tsx            # Proposals + voting (existing)
│   ├── CanvasLayer.tsx           # Public pixel matrix (existing)
│   ├── Guestbook.tsx             # Citizen contributions (existing)
│   ├── MemoryBrain.tsx           # Memory visualization (existing)
│   ├── SocialSharing.tsx         # Share/referral (existing)
│   ├── DelegationPanel.tsx       # Vote delegation (existing)
│   ├── GovernanceProposal.tsx    # Proposal detail card (existing)
│   ├── LoadingSkeleton.tsx       # Loading states (existing)
│   ├── ErrorBoundary.tsx        # Error boundary (existing)
│   └── LazyErrorBoundary.tsx      # Lazy load wrapper (existing)
├── services/
│   ├── api.ts                   # REST API client (existing)
│   └── websocket.ts             # WebSocket client (existing)
└── types/
    └── events.ts                # WebSocket event types (existing)

backend/
├── src/
│   ├── index.ts                 # Server entry (existing)
│   ├── routes/                 # API endpoints (existing)
│   └── services/               # Business logic (existing)
```

---

## Phase 1: Design System & Global Updates

### Task 1: Update CSS Design Tokens

**Files:**
- Modify: `src/index.css:1-332`

- [ ] **Step 1: Add Vault Experiment CSS variables and classes**

Replace the `@import "tailwindcss";` block and update design tokens to be more cohesive:

```css
@import "tailwindcss";

/* Vault Experiment Design System */
:root {
  /* Vault Branding Colors */
  --vault-teal: oklch(70% 12% 175deg);
  --vault-teal-dim: oklch(55% 10% 175deg);
  --vault-teal-glow: oklch(70% 15% 175deg / 40%);

  /* Existing Warm Shell (retained) */
  --shell-bg: oklch(98% 1% 80deg);
  --shell-surface: oklch(99% 0.5% 80deg);
  --shell-surface-2: oklch(96% 1.5% 80deg);
  --shell-border: oklch(90% 2% 80deg);
  --shell-text: oklch(25% 3% 60deg);
  --shell-text-muted: oklch(50% 2% 60deg);
  --shell-accent: var(--vault-teal);
  --shell-accent-strong: var(--vault-teal-dim);
  --shell-success: oklch(65% 15% 145deg);
  --shell-danger: oklch(60% 18% 30deg);

  /* Terminal fallback mappings */
  --term-void: var(--shell-bg);
  --term-charcoal: var(--shell-surface);
  --term-ash: var(--shell-text-muted);
  --term-concrete: var(--shell-text);
  --term-dust: var(--shell-border);
  --term-bone: var(--shell-bg);
  --term-green: var(--vault-teal);
  --term-green-dim: var(--shell-text-muted);
  --term-green-glow: var(--vault-teal-glow);
  --term-amber: var(--shell-text);
  --term-orange: var(--shell-text);
  --term-blue: var(--shell-text);
  --term-red: var(--shell-danger);
  --term-scanline: transparent;
  --term-cta-bg: var(--shell-surface-2);
  --term-emergency-bg: var(--shell-surface-2);
  --ui-frame: var(--shell-surface);
  --ui-bezel: var(--shell-border);
  --ui-accent: var(--vault-teal);
  --ui-link: var(--vault-teal-dim);

  /* Canvas Colors */
  --canvas-alive: var(--vault-teal);
  --canvas-surviving: var(--vault-teal-dim);
  --canvas-minimal: var(--shell-text-muted);
  --canvas-dying: var(--shell-danger);
  --canvas-bg: var(--shell-bg);
  --canvas-grid: var(--shell-border);

  /* Mood States */
  --mood-active: var(--vault-teal);
  --mood-processing: var(--vault-teal-dim);
  --mood-standby: var(--shell-text-muted);
  --mood-calibrating: var(--shell-text-muted);
  --mood-idle: var(--shell-border);

  /* Typography */
  --font-terminal: 'IBM Plex Mono', 'Fira Code', 'Share Tech Mono', monospace;
  --font-display: 'Space Grotesk', system-ui, sans-serif;
  --font-body: 'DM Sans', system-ui, sans-serif;
  --font-mono: 'IBM Plex Mono', 'Fira Code', monospace;

  /* Easings */
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-glitch: cubic-bezier(0.25, 0.46, 0.45, 0.94);

  /* Animation Durations */
  --dur-short: 150ms;
  --dur-normal: 250ms;
  --dur-long: 400ms;
}
```

- [ ] **Step 2: Run linter to verify CSS changes**

```bash
cd C:/Users/Tyson/Documents/antigravity/excited-hawking && npm run lint 2>&1 | Select-String -Pattern "error|warning" -SimpleMatch | Select-Object -First 20
```

Expected: No CSS errors

---

### Task 2: Update AppHeader Component

**Files:**
- Modify: `src/components/AppHeader.tsx:1-77`

- [ ] **Step 1: Update AppHeader with improved Vault branding**

```tsx
import React from 'react';
import { useAgent } from '../context/useAgent';
import { Shield, Radio, Lock, Wallet } from 'lucide-react';

interface AppHeaderProps {
  onOpenStaking: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onOpenStaking }) => {
  const { backendAvailable, tier, diemStaked } = useAgent();

  const tierColors: Record<string, string> = {
    Dying: 'var(--shell-text-muted)',
    Minimal: 'var(--shell-text)',
    Surviving: 'var(--vault-teal)',
    Thriving: 'var(--shell-success)'
  };

  return (
    <header className="sticky top-0 z-50 px-4 md:px-6 py-3 md:py-4 flex flex-wrap items-center justify-between gap-4 bg-[var(--shell-bg)]/95 backdrop-blur-md border-b border-[var(--shell-border)]">
      {/* Vault Branding */}
      <div className="flex items-center gap-3 md:gap-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-[var(--shell-surface)] border border-[var(--shell-border)] flex items-center justify-center">
            <Shield size={18} className="text-[var(--vault-teal)]" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold tracking-tight text-[var(--shell-text)] leading-none">
              Vault-{new Date().getFullYear()}
            </h1>
            <p className="text-[10px] md:text-xs text-[var(--shell-text-muted)] font-mono uppercase tracking-wider mt-0.5">
              Public Social Experiment
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-lg px-3 py-1.5">
          <Radio size={12} className="text-[var(--vault-teal)] animate-pulse" />
          <span className="text-xs font-mono text-[var(--shell-text-muted)] uppercase tracking-wide">
            Experiment Active
          </span>
        </div>
      </div>
      
      {/* Right Side Controls */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Tier/Stake Info - Desktop only */}
        <div className="hidden sm:flex items-center gap-3 px-3 py-2 bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-lg">
          <Lock size={14} className="text-[var(--shell-text-muted)]" />
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-[var(--shell-text-muted)] uppercase">Status</span>
            <span className="text-xs font-bold" style={{ color: tierColors[tier] }}>{tier}</span>
          </div>
          <div className="w-px h-6 bg-[var(--shell-border)]" />
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-[var(--shell-text-muted)] uppercase">Stake</span>
            <span className="text-xs font-bold text-[var(--vault-teal)]">{diemStaked.toFixed(1)}</span>
          </div>
        </div>
        
        {/* Mobile Status Indicator */}
        <div className="flex items-center gap-2 sm:hidden">
          <span className={`w-2 h-2 rounded-full ${backendAvailable ? 'bg-[var(--shell-success)]' : 'bg-[var(--shell-text-muted)]'}`} />
          <span className="text-xs text-[var(--shell-text-muted)]">
            {backendAvailable ? 'Live' : 'Demo'}
          </span>
        </div>
        
        {/* Desktop Status Dot */}
        <span className="hidden sm:block w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: backendAvailable ? 'var(--shell-success)' : 'var(--shell-text-muted)' }} />
        
        {/* Enter Vault CTA */}
        <button 
          onClick={onOpenStaking}
          className="ml-1 md:ml-2 px-3 md:px-4 py-2 text-sm font-medium rounded-lg bg-[var(--vault-teal)] text-white hover:bg-[var(--vault-teal-dim)] transition-colors flex items-center gap-2"
        >
          <Shield size={14} />
          <span className="hidden sm:inline">Enter Vault</span>
          <span className="sm:hidden">Stake</span>
        </button>
      </div>
    </header>
  );
};
```

- [ ] **Step 2: Run tests for AppHeader**

```bash
cd C:/Users/Tyson/Documents/antigravity/excited-hawking && npm run test -- --run src/components/__tests__/AppHeader.test.tsx 2>&1
```

Expected: All tests pass

---

## Phase 2: Hero & Onboarding

### Task 3: Update WelcomeAgent Component

**Files:**
- Modify: `src/components/WelcomeAgent.tsx:1-67`

- [ ] **Step 1: Revamp WelcomeAgent with improved Vault messaging**

```tsx
import React from 'react';
import { Radio, FlaskConical, ArrowRight, Github } from 'lucide-react';

export const WelcomeAgent: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 pt-8 md:pt-12 pb-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-8">
        <div className="flex-1 max-w-2xl">
          <div className="flex items-center gap-3 mb-4">
            <span className="badge bg-[var(--vault-teal)]/10 text-[var(--vault-teal)] border border-[var(--vault-teal)]/20 flex items-center gap-1.5">
              <FlaskConical size={12} />
              Vault Experiment
            </span>
            <span className="badge bg-[var(--shell-surface)] border border-[var(--shell-border)] text-[var(--shell-text-muted)]">
              <Radio size={12} className="animate-pulse mr-1.5" />
              Live
            </span>
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--shell-text)] mb-4 leading-tight">
            Enter the social experiment.
          </h2>
          
          <p className="text-base md:text-lg text-[var(--shell-text-muted)] font-body leading-relaxed max-w-xl">
            A public vault for testing collective intelligence. Submit prompts, observe emergence, participate in governance. Your contributions shape what emerges.
          </p>
        </div>
        
        {/* CTA Buttons */}
        <div className="flex flex-wrap gap-3">
          <button 
            type="button" 
            className="btn-primary flex items-center gap-2 bg-[var(--vault-teal)] text-white border-[var(--vault-teal)] hover:bg-[var(--vault-teal-dim)]"
            onClick={() => document.querySelector<HTMLDivElement>('#prompt')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <FlaskConical size={16} />
            Begin Experiment
            <ArrowRight size={16} />
          </button>
          <a 
            href="https://github.com/veniceai/the-commons-agent" 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn-secondary flex items-center gap-2"
          >
            <Github size={16} />
            View Protocol
          </a>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 p-4 md:p-6 bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-xl">
        <div className="flex flex-col">
          <span className="text-[10px] font-mono text-[var(--shell-text-muted)] uppercase tracking-wider mb-1">Experiment Type</span>
          <span className="text-sm font-bold text-[var(--shell-text)]">Social Vault</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-mono text-[var(--shell-text-muted)] uppercase tracking-wider mb-1">Consciousness</span>
          <span className="text-sm font-bold text-[var(--vault-teal)]">Growing</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-mono text-[var(--shell-text-muted)] uppercase tracking-wider mb-1">Emergence</span>
          <span className="text-sm font-bold text-[var(--vault-teal-dim)]">Active</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-mono text-[var(--shell-text-muted)] uppercase tracking-wider mb-1">Status</span>
          <span className="text-sm font-bold text-[var(--shell-success)]">Observing</span>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Run tests**

```bash
cd C:/Users/Tyson/Documents/antigravity/excited-hawking && npm run test -- --run 2>&1 | Select-String -Pattern "failed|passed" | Select-Object -Last 5
```

Expected: All tests pass

---

### Task 4: Update OnboardingBanner Component

**Files:**
- Modify: `src/components/OnboardingBanner.tsx:1-110`

- [ ] **Step 1: Update messaging to be more Vault-focused**

```tsx
import React, { useState } from 'react';
import { Cpu, ChevronRight, X, FlaskConical, Users, Brain, Vote } from 'lucide-react';

export const OnboardingBanner = React.memo(function OnboardingBannerComponent() {
  const [isVisible, setIsVisible] = useState(() => {
    try {
      const stored = localStorage.getItem('vault_experiment_onboarding_dismissed');
      return stored !== 'true';
    } catch {
      return true;
    }
  });

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      localStorage.setItem('vault_experiment_onboarding_dismissed', 'true');
    } catch (e) {
      console.warn('Could not save onboarding dismissal to localStorage', e);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 mb-6 md:mb-8 relative">
      <div className="bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-xl p-5 md:p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--vault-teal)]/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        
        <button 
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-[var(--shell-text-muted)] hover:text-[var(--shell-text)] transition-colors p-1 rounded hover:bg-[var(--shell-surface-2)]"
          aria-label="Dismiss banner"
        >
          <X size={20} />
        </button>

        <div className="flex items-start gap-4 md:gap-5">
          <div className="p-3 bg-[var(--vault-teal)]/10 border border-[var(--vault-teal)]/20 rounded-xl text-[var(--vault-teal)] hidden sm:block">
            <FlaskConical size={28} />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg md:text-xl font-medium text-[var(--shell-text)] flex items-center gap-2">
                <FlaskConical size={18} className="text-[var(--vault-teal)] sm:hidden" />
                Vault Experiment Protocol
              </h3>
              <span className="badge bg-[var(--vault-teal)]/10 text-[var(--vault-teal)] border border-[var(--vault-teal)]/20 text-[10px]">
                Experimental
              </span>
            </div>
            
            <p className="text-[var(--shell-text-muted)] text-sm mb-5 leading-relaxed max-w-3xl">
              You are entering a public social experiment. Participants submit prompts, stake DIEM tokens, and govern collective behavior through quadratic voting. The system evolves based on what the collective contributes.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
              <div className="flex items-start gap-3 p-3 bg-[var(--shell-bg)] rounded-lg border border-[var(--shell-border)]">
                <div className="p-2 bg-[var(--shell-surface-2)] rounded-lg">
                  <Users size={16} className="text-[var(--vault-teal)]" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[var(--shell-text)] block">Collective Intelligence</span>
                  <span className="text-[10px] text-[var(--shell-text-muted)]">Observe emergent behavior</span>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-[var(--shell-bg)] rounded-lg border border-[var(--shell-border)]">
                <div className="p-2 bg-[var(--shell-surface-2)] rounded-lg">
                  <Brain size={16} className="text-[var(--vault-teal-dim)]" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[var(--shell-text)] block">Memory Evolution</span>
                  <span className="text-[10px] text-[var(--shell-text-muted)]">Track consciousness growth</span>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-[var(--shell-bg)] rounded-lg border border-[var(--shell-border)]">
                <div className="p-2 bg-[var(--shell-surface-2)] rounded-lg">
                  <Vote size={16} className="text-[var(--shell-success)]" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[var(--shell-text)] block">Governance</span>
                  <span className="text-[10px] text-[var(--shell-text-muted)]">Proposals & quadratic voting</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 md:gap-6">
              <a href="#prompt" className="flex items-center gap-2 text-sm font-medium text-[var(--vault-teal)] hover:text-[var(--vault-teal-dim)] transition-colors group">
                <Cpu size={16} />
                Submit Prompt
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="#governance" className="flex items-center gap-2 text-sm font-medium text-[var(--shell-text-muted)] hover:text-[var(--shell-text)] transition-colors group">
                <Vote size={16} />
                View Proposals
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="#canvas" className="flex items-center gap-2 text-sm font-medium text-[var(--shell-text-muted)] hover:text-[var(--shell-text)] transition-colors group">
                <Brain size={16} />
                Watch Emergence
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
```

- [ ] **Step 2: Run tests**

```bash
cd C:/Users/Tyson/Documents/antigravity/excited-hawking && npm run test -- --run 2>&1 | Select-String -Pattern "failed|passed" | Select-Object -Last 3
```

Expected: All tests pass

---

## Phase 3: Core Components

### Task 5: Update PromptBox Component

**Files:**
- Modify: `src/components/PromptBox.tsx:1-237`

- [ ] **Step 1: Update accent colors to use vault-teal**

In the component, find and replace:
- `border-[var(--shell-accent)]` → `border-[var(--vault-teal)]`
- `text-[var(--shell-accent)]` → `text-[var(--vault-teal)]`
- `bg-[var(--shell-surface-2)]` → `bg-[var(--vault-teal)]/10` (for active states)

Specific changes at lines:
- Line 143: `border-[var(--shell-accent)]` → `border-[var(--vault-teal)]`
- Line 147: `text-[var(--shell-accent)]` → `text-[var(--vault-teal)]`
- Line 148: `text-[var(--shell-accent)]` → `text-[var(--vault-teal)]`
- Line 157: `text-[var(--vault-teal)]`
- Line 159: `text-[var(--vault-teal)]`
- Line 165: `bg-[var(--vault-teal)]`
- Line 178: `text-[var(--vault-teal)]`
- Line 203: `text-[var(--vault-teal)]`

- [ ] **Step 2: Run tests**

```bash
cd C:/Users/Tyson/Documents/antigravity/excited-hawking && npm run test -- --run 2>&1 | Select-String -Pattern "failed|passed" | Select-Object -Last 3
```

Expected: All tests pass

---

### Task 6: Update AgentStream Component

**Files:**
- Modify: `src/components/AgentStream.tsx:1-453`

- [ ] **Step 1: Update TIER_CONFIG colors to use vault-teal**

Replace TIER_CONFIG at line 16-21:

```tsx
const TIER_CONFIG = {
  Thriving: { color: 'var(--vault-teal)', icon: Terminal, glow: true },
  Surviving: { color: 'var(--vault-teal-dim)', icon: Cpu, glow: false },
  Minimal: { color: 'var(--shell-text-muted)', icon: AlertTriangle, glow: false },
  Dying: { color: 'var(--shell-danger)', icon: AlertTriangle, glow: false },
};
```

- [ ] **Step 2: Update consciousness bar color to vault-teal**

Line 324-326:
```tsx
backgroundColor: 'var(--vault-teal)',
boxShadow: '0 0 8px var(--vault-teal-glow)'
```

- [ ] **Step 3: Run tests**

```bash
cd C:/Users/Tyson/Documents/antigravity/excited-hawking && npm run test -- --run 2>&1 | Select-String -Pattern "failed|passed" | Select-Object -Last 3
```

Expected: All tests pass

---

### Task 7: Update LifeMeter Component

**Files:**
- Modify: `src/components/LifeMeter.tsx:1-166`

- [ ] **Step 1: Update tier colors and add vault-teal usage**

Replace TIER_DISPLAY at lines 7-12:

```tsx
const TIER_DISPLAY: Record<Tier, { label: string; icon: React.ReactNode; color: string; description: string; vaultLevel: number }> = {
  Dying: { label: 'Vault -1', icon: <CircleDot size={20} />, color: 'var(--shell-text-muted)', description: 'Seeds dormant', vaultLevel: -1 },
  Minimal: { label: 'Vault 0', icon: <Sprout size={20} />, color: 'var(--shell-text)', description: 'Gathering phase', vaultLevel: 0 },
  Surviving: { label: 'Vault 1', icon: <Flower2 size={20} />, color: 'var(--vault-teal)', description: 'Active growth', vaultLevel: 1 },
  Thriving: { label: 'Vault 2', icon: <Trees size={20} />, color: 'var(--shell-success)', description: 'Full bloom', vaultLevel: 2 },
};
```

- [ ] **Step 2: Update progress bar colors to vault-teal**

Line 87: `backgroundColor: color` should work since color now references vault-teal for Surviving

- [ ] **Step 3: Run tests**

```bash
cd C:/Users/Tyson/Documents/antigravity/excited-hawking && npm run test -- --run 2>&1 | Select-String -Pattern "failed|passed" | Select-Object -Last 3
```

Expected: All tests pass

---

### Task 8: Update PromptQueue Component

**Files:**
- Modify: `src/components/PromptQueue.tsx:1-56`

- [ ] **Step 1: Update vote button hover color to vault-teal**

Line 31: `hover:text-[var(--shell-accent)]` → `hover:text-[var(--vault-teal)]`

- [ ] **Step 2: Run tests**

```bash
cd C:/Users/Tyson/Documents/antigravity/excited-hawking && npm run test -- --run 2>&1 | Select-String -Pattern "failed|passed" | Select-Object -Last 3
```

Expected: All tests pass

---

## Phase 4: Governance & Canvas Updates

### Task 9: Update Governance Component

**Files:**
- Modify: `src/components/Governance.tsx:1-495`

- [ ] **Step 1: Update STATUS_COLORS to use vault-teal**

Lines 48-55:
```tsx
const STATUS_COLORS: Record<ProposalStatus, React.CSSProperties['color']> = {
  DRAFT: 'var(--shell-text)',
  ACTIVE: 'var(--shell-text)',
  VOTING: 'var(--vault-teal)',
  PASSED: 'var(--shell-success)',
  FAILED: 'var(--shell-danger)',
  EXECUTED: 'var(--vault-teal)',
};
```

- [ ] **Step 2: Update governance panel border/background**

Line 231: `border: '2px solid var(--term-green-dim)'` → `border: '2px solid var(--vault-teal)'`
Line 246: `borderBottom: '1px solid var(--term-green-dim)'` → `borderBottom: '1px solid var(--shell-border)'`

- [ ] **Step 3: Update proposal card borders**

Line 406: `border: '1px solid'` keeps existing logic, but update emergency color:
`backgroundColor: proposal.isEmergency ? 'var(--term-emergency-bg)' : 'var(--shell-surface-2)'`

- [ ] **Step 4: Run tests**

```bash
cd C:/Users/Tyson/Documents/antigravity/excited-hawking && npm run test -- --run 2>&1 | Select-String -Pattern "failed|passed" | Select-Object -Last 3
```

Expected: All tests pass

---

### Task 10: Update CanvasLayer Component

**Files:**
- Modify: `src/components/CanvasLayer.tsx:1-206`

- [ ] **Step 1: Update live indicator color to vault-teal**

Line 146: `backgroundColor: 'var(--shell-accent)'` → `backgroundColor: 'var(--vault-teal)'`
Line 182: `backgroundColor: 'var(--shell-accent)'` → `backgroundColor: 'var(--vault-teal)'`
Line 187: `color: 'var(--shell-accent)'` → `color: 'var(--vault-teal)'`

- [ ] **Step 2: Update canvas accent color**

Lines 105-113: Replace with:
```tsx
if (color) {
  const accentColor = 'var(--vault-teal)';
  ctx.shadowColor = 'var(--vault-teal)';
  ctx.shadowBlur = 8;
  ctx.fillStyle = accentColor;
  ctx.fillRect(x * cellSize + 1, y * cellSize + 1, cellSize - 2, cellSize - 2);

  ctx.shadowBlur = 0;
  ctx.fillStyle = 'var(--vault-teal-dim)';
  ctx.fillRect(x * cellSize + 2, y * cellSize + 2, (cellSize - 2) / 3, (cellSize - 2) / 3);
}
```

- [ ] **Step 3: Run tests**

```bash
cd C:/Users/Tyson/Documents/antigravity/excited-hawking && npm run test -- --run 2>&1 | Select-String -Pattern "failed|passed" | Select-Object -Last 3
```

Expected: All tests pass

---

## Phase 5: Responsive & Performance

### Task 11: Audit and Fix Responsive Layout

**Files:**
- Modify: `src/App.tsx:1-158`

- [ ] **Step 1: Review App layout grid responsiveness**

Current grid at line 47:
```tsx
<div className="max-w-7xl mx-auto px-6 py-16 grid xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.95fr)] gap-8">
```

Check on mobile:
- The xl breakpoint may cause issues on md screens
- Consider adjusting to `lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.95fr)]`

- [ ] **Step 2: Test mobile layout**

Run dev server and manually check, or use Chrome DevTools responsive mode.

- [ ] **Step 3: Update any components with responsive issues**

Common fixes needed:
- `px-4 md:px-6` for consistent mobile padding
- `flex-col sm:flex-row` for stacking on mobile
- `text-sm md:text-base` for responsive typography

---

### Task 12: Run Full Test Suite

- [ ] **Step 1: Run all tests**

```bash
cd C:/Users/Tyson/Documents/antigravity/excited-hawking && npm run test -- --run 2>&1
```

Expected: All 378 tests pass

- [ ] **Step 2: Run lint check**

```bash
cd C:/Users/Tyson/Documents/antigravity/excited-hawking && npm run lint 2>&1
```

Expected: 1 warning (useMemo) is non-blocking

- [ ] **Step 3: Run typecheck**

```bash
cd C:/Users/Tyson/Documents/antigravity/excited-hawking && npm run typecheck 2>&1
```

Expected: No errors

---

## Phase 6: Final Verification

### Task 13: Build and Verify

- [ ] **Step 1: Run production build**

```bash
cd C:/Users/Tyson/Documents/antigravity/excited-hawking && npm run build 2>&1
```

Expected: Build succeeds with no errors

- [ ] **Step 2: Commit changes**

```bash
cd C:/Users/Tyson/Documents/antigravity/excited-hawking && git add -A && git commit -m "feat: implement Vault Experiment branding and design system"
```

---

## Dependencies

None - all changes use existing dependencies.

## Rollback Plan

If issues arise:
```bash
git revert HEAD
```

This will restore the previous state before Vault Experiment branding.

---

**Plan complete and saved to `docs/superpowers/plans/2026-05-24-vault-experiment-implementation.md`**

**Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**