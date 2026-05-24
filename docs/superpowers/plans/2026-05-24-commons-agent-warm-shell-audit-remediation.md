# Commons Agent Warm Shell Audit Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring The Commons Agent to the approved Warm Shell, Precise Core direction while fixing broken shell interactions, aligning frontend/backend contracts, and proving the result with tests, audits, and browser checks.

**Architecture:** Keep the current workbench composition, then remove the dishonest and conflicting parts. The frontend becomes the compatibility layer: it should talk to the backend routes that already exist, present signed-wallet behavior honestly, and stack support modules in the main flow on small screens instead of hiding them. The backend stays structurally intact unless verification proves a real defect.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind 4, plain CSS design tokens, Fastify, Socket.IO, Vitest, Testing Library, Playwright via Python helper script.

---

## File Structure And Responsibilities

- `package.json`
  Add the root frontend test script and frontend test dependencies.
- `package-lock.json`
  Lock the new frontend test dependencies.
- `vitest.config.ts`
  Root frontend test runner config for jsdom and Testing Library.
- `tsconfig.app.json`
  Add frontend test types so Vitest and jest-dom compile cleanly.
- `src/test/setup.ts`
  Shared frontend test setup and matcher registration.
- `src/services/api.ts`
  Frontend compatibility layer for `/api/status`, `/api/prompt`, `/api/logs/list`, and the signed `/api/vote` contract.
- `src/services/api.test.ts`
  Frontend API contract tests that fail before the compatibility fixes.
- `src/context/walletMode.ts`
  Small pure helper that defines honest wallet capability rules for this preview shell.
- `src/context/walletMode.test.ts`
  Tests for the wallet capability helper.
- `src/context/AgentContext.tsx`
  Wire the honest wallet mode into prompt voting and expose the gate state to the UI.
- `src/components/AppHeader.tsx`
  New focused header component that replaces the dead `CONNECT` affordance with honest status and a meaningful secondary action.
- `src/components/__tests__/AppHeader.test.tsx`
  Regression tests for the honest header behavior.
- `src/components/PromptBox.tsx`
  Prompt entry shell, valid anchor target, calmer copy, and stake guidance.
- `src/components/__tests__/PromptBox.test.tsx`
  Regression tests for the prompt anchors used by `WelcomeAgent` and `OnboardingBanner`.
- `src/App.tsx`
  Workbench layout, support rail stacking, secondary section ordering, and new header integration.
- `src/components/__tests__/AppLayout.test.tsx`
  Layout regression tests for the support rail and top-level shell copy.
- `src/index.css`
  Warm-shell tokens, sentence-case base rules, toned-down cards/buttons/inputs, and removal of CRT-heavy defaults.
- `src/components/WelcomeAgent.tsx`
  Warm-shell hero copy and calmer visual framing.
- `src/components/OnboardingBanner.tsx`
  Replace faux-terminal onboarding copy with clear task-oriented guidance.
- `src/components/PromptQueue.tsx`
  Honest voting UI, warmer copy, and state derived from `AgentContext`.
- `src/components/AgentStream.tsx`
  Warm-shell copy updates and shared websocket event constant usage.
- `src/components/LifeMeter.tsx`
  Replace garden-stage terminology with neutral progress terminology.
- `src/components/__tests__/WarmShellCopy.test.tsx`
  Regression tests for the approved warm-shell copy changes.
- `.gitignore`
  Ignore `.superpowers/` so brainstorm artifacts do not keep polluting the worktree.
- `scripts/check_warm_shell.py`
  Repeatable browser verification for desktop and mobile shell behavior.

## Task 1: Add Frontend Test Harness And Lock The Live API Contract

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `tsconfig.app.json`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Create: `src/services/api.test.ts`
- Modify: `src/services/api.ts`

- [ ] **Step 1: Install frontend test dependencies and add the root test script**

Run:

```bash
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

Update `package.json` so the scripts block includes:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "preview": "vite preview",
    "test": "vitest run"
  }
}
```

Expected: `package.json` and `package-lock.json` both change, and `npm run test -- --help` prints Vitest usage.

- [ ] **Step 2: Create the frontend Vitest config and test setup**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
    css: true,
    setupFiles: ['./src/test/setup.ts']
  }
});
```

Create `src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

Update `tsconfig.app.json`:

```json
{
  "compilerOptions": {
    "types": ["vite/client", "vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src"]
}
```

Expected: `npm run typecheck` still compiles after the config change.

- [ ] **Step 3: Write the failing API contract tests**

Create `src/services/api.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, normalizeStatusResponse, type ApiStatusEnvelope, type SignedVoteRequest } from './api';

const jsonResponse = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('normalizeStatusResponse', () => {
  it('flattens the backend status envelope for the frontend shell', () => {
    const payload: ApiStatusEnvelope = {
      agent: {
        tier: 'sprout',
        diemStaked: 25,
        treasuryUSDC: 9,
        status: 'alive',
        uptime: 120,
        version: '1.0.0'
      },
      wallet: 'anonymous',
      balance: 0,
      timestamp: '2026-05-24T00:00:00.000Z'
    };

    expect(normalizeStatusResponse(payload)).toEqual({
      diemStaked: 25,
      treasuryUSDC: 9,
      tier: 'sprout',
      connected: false
    });
  });
});

describe('api contract alignment', () => {
  it('posts prompts to /api/prompt', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ success: true }));
    vi.stubGlobal('fetch', fetchMock);

    await api.submitPrompt('Repair the shell');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/prompt'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ content: 'Repair the shell' })
      })
    );
  });

  it('reads logs from /api/logs/list', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ logs: [], total: 0 }));
    vi.stubGlobal('fetch', fetchMock);

    await api.getLogs();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/logs/list'),
      expect.any(Object)
    );
  });

  it('sends signed votes to /api/vote using auth headers', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ success: true }));
    vi.stubGlobal('fetch', fetchMock);

    const request: SignedVoteRequest = {
      promptId: 'prompt-1',
      vote: 'up',
      wallet: '0x1111111111111111111111111111111111111111',
      signature: '0x' + '1'.repeat(130),
      nonce: 'nonce-123'
    };

    await api.vote(request);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/vote'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'x-wallet-address': request.wallet,
          'x-signature': request.signature,
          'x-nonce': request.nonce
        }),
        body: JSON.stringify({
          promptId: request.promptId,
          vote: request.vote,
          wallet: request.wallet
        })
      })
    );
  });
});
```

- [ ] **Step 4: Run the API tests and verify they fail for the right reasons**

Run:

```bash
npm run test -- src/services/api.test.ts
```

Expected: FAIL because `api.ts` still points at `/api/prompts` and `/api/logs`, does not normalize the nested status envelope, and does not expose the signed vote request shape.

- [ ] **Step 5: Implement the API compatibility layer with the real backend contract**

Update `src/services/api.ts` so the public frontend contract stays simple while the wire contract matches the backend:

```ts
export interface StatusResponse {
  diemStaked: number;
  treasuryUSDC: number;
  tier: string;
  connected: boolean;
}

export interface ApiStatusEnvelope {
  agent: {
    diemStaked: number;
    treasuryUSDC: number;
    tier: string;
    status: string;
    uptime: number;
    version: string;
  };
  wallet?: string;
  balance?: number;
  timestamp: string;
}

export interface SignedVoteRequest {
  promptId: string;
  vote: 'up' | 'down';
  wallet: string;
  signature: string;
  nonce: string;
}

export function normalizeStatusResponse(payload: ApiStatusEnvelope): StatusResponse {
  return {
    diemStaked: payload.agent.diemStaked,
    treasuryUSDC: payload.agent.treasuryUSDC,
    tier: payload.agent.tier,
    connected: Boolean(payload.wallet && payload.wallet !== 'anonymous')
  };
}

async function getStatus(): Promise<StatusResponse> {
  const payload = await fetchJson<ApiStatusEnvelope>(`${BASE_URL}/api/status`);
  return normalizeStatusResponse(payload);
}

async function submitPrompt(content: string) {
  return fetchJson(`${BASE_URL}/api/prompt`, {
    method: 'POST',
    body: JSON.stringify({ content })
  });
}

async function getLogs() {
  return fetchJson(`${BASE_URL}/api/logs/list`);
}

async function vote(request: SignedVoteRequest) {
  return fetchJson(`${BASE_URL}/api/vote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-wallet-address': request.wallet,
      'x-signature': request.signature,
      'x-nonce': request.nonce
    },
    body: JSON.stringify({
      promptId: request.promptId,
      vote: request.vote,
      wallet: request.wallet
    })
  });
}
```

Expected: the frontend service matches `backend/src/routes/status.ts`, `backend/src/routes/prompt.ts`, `backend/src/routes/logs.ts`, and `backend/src/routes/vote.ts` exactly.

- [ ] **Step 6: Re-run the API tests and a typecheck pass**

Run:

```bash
npm run test -- src/services/api.test.ts
npm run typecheck
```

Expected: PASS on the API test file, then a clean typecheck.

- [ ] **Step 7: Commit the API compatibility layer**

Run:

```bash
git add package.json package-lock.json vitest.config.ts tsconfig.app.json src/test/setup.ts src/services/api.ts src/services/api.test.ts
git commit -m "test: add frontend api contract coverage"
```

Expected: one focused commit that only covers the new frontend test harness and API contract alignment.

## Task 2: Remove Fake Wallet Affordances And Repair Prompt Navigation

**Files:**
- Create: `src/context/walletMode.ts`
- Create: `src/context/walletMode.test.ts`
- Create: `src/components/AppHeader.tsx`
- Create: `src/components/__tests__/AppHeader.test.tsx`
- Create: `src/components/__tests__/PromptBox.test.tsx`
- Modify: `src/context/AgentContext.tsx`
- Modify: `src/components/PromptQueue.tsx`
- Modify: `src/components/PromptBox.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write the failing tests for honest wallet behavior and prompt anchors**

Create `src/context/walletMode.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { canVoteWithCurrentWallet, getVoteDisabledReason, getWalletMode } from './walletMode';

describe('walletMode', () => {
  it('keeps preview mode non-voting even when a local wallet string exists', () => {
    expect(getWalletMode()).toBe('preview');
    expect(canVoteWithCurrentWallet('preview', '0x1111111111111111111111111111111111111111')).toBe(false);
    expect(getVoteDisabledReason('preview')).toBe('Signed wallet voting is not available in this preview.');
  });
});
```

Create `src/components/__tests__/AppHeader.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

vi.mock('../../context/useAgent', () => ({
  useAgent: () => ({
    backendAvailable: true,
    walletMode: 'preview'
  })
}));

import { AppHeader } from '../AppHeader';

it('removes the fake connect action and keeps a real secondary action', async () => {
  const user = userEvent.setup();
  const openStaking = vi.fn();

  render(<AppHeader onOpenStaking={openStaking} />);

  expect(screen.queryByRole('button', { name: /connect wallet/i })).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /view staking/i }));
  expect(openStaking).toHaveBeenCalledTimes(1);
});
```

Create `src/components/__tests__/PromptBox.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('../../context/useAgent', () => ({
  useAgent: () => ({
    diemStaked: 0,
    tier: 'seed',
    addPrompt: vi.fn(),
    backendAvailable: false
  })
}));

import { PromptBox } from '../PromptBox';

it('exposes the prompt anchors used by the warm shell CTAs', () => {
  render(<PromptBox />);
  const region = screen.getByRole('region', { name: /prompt composer/i });

  expect(region).toHaveAttribute('id', 'prompt');
  expect(region).toHaveClass('prompt-box');
});
```

- [ ] **Step 2: Run the new tests and verify the current shell fails honestly**

Run:

```bash
npm run test -- src/context/walletMode.test.ts src/components/__tests__/AppHeader.test.tsx src/components/__tests__/PromptBox.test.tsx
```

Expected: FAIL because the helper file and header component do not exist yet, and `PromptBox` does not expose `#prompt` or `.prompt-box`.

- [ ] **Step 3: Implement the honest wallet gate and wire it into the context and queue**

Create `src/context/walletMode.ts`:

```ts
export type WalletMode = 'preview' | 'signed';

export function getWalletMode(): WalletMode {
  return 'preview';
}

export function canVoteWithCurrentWallet(walletMode: WalletMode, walletAddress: string | null): boolean {
  return walletMode === 'signed' && Boolean(walletAddress);
}

export function getVoteDisabledReason(walletMode: WalletMode): string {
  if (walletMode === 'preview') {
    return 'Signed wallet voting is not available in this preview.';
  }

  return 'Connect a verified wallet to vote.';
}
```

Update `src/context/AgentContext.tsx` so the context exposes `walletMode`, `canVote`, and `voteDisabledReason`, and so `votePrompt()` stops pretending it can complete a signed vote without the required headers:

```ts
const walletMode = getWalletMode();
const canVote = canVoteWithCurrentWallet(walletMode, walletAddress);
const voteDisabledReason = getVoteDisabledReason(walletMode);

const votePrompt = async (id: string) => {
  if (!canVote) {
    addLog({
      level: 'warn',
      source: 'wallet',
      message: voteDisabledReason,
      timestamp: new Date().toISOString()
    });
    return;
  }

  addLog({
    level: 'warn',
    source: 'wallet',
    message: `Signed wallet voting is not available for prompt ${id} in this preview.`,
    timestamp: new Date().toISOString()
  });
};
```

Update `src/components/PromptQueue.tsx` so the vote buttons are honest:

```tsx
const { prompts, votePrompt, canVote, voteDisabledReason } = useAgent();

<button
  type="button"
  disabled={!canVote}
  aria-describedby={!canVote ? 'prompt-vote-note' : undefined}
  onClick={() => votePrompt(prompt.id)}
>
  Vote
</button>

{!canVote && (
  <p id="prompt-vote-note" className="text-sm text-[var(--shell-text-muted)]">
    {voteDisabledReason}
  </p>
)}
```

Expected: prompt voting becomes honest immediately, even before a real signed-wallet flow exists.

- [ ] **Step 4: Add the focused header component and repair the prompt anchor target**

Create `src/components/AppHeader.tsx`:

```tsx
import { useAgent } from '../context/useAgent';

interface AppHeaderProps {
  onOpenStaking: () => void;
}

export function AppHeader({ onOpenStaking }: AppHeaderProps) {
  const { backendAvailable, walletMode } = useAgent();

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--shell-border)] bg-[color:var(--shell-surface)]/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-[var(--shell-text-muted)]">Commons agent</p>
          <h1 className="text-lg font-semibold text-[var(--shell-text)]">Warm shell preview</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-[var(--shell-border)] px-3 py-1 text-sm text-[var(--shell-text-muted)]">
            {backendAvailable ? 'Backend ready' : 'Offline preview'}
          </span>
          <span className="rounded-full border border-[var(--shell-border)] px-3 py-1 text-sm text-[var(--shell-text-muted)]">
            {walletMode === 'preview' ? 'Wallet preview' : 'Signed wallet'}
          </span>
          <button type="button" className="btn-secondary" onClick={onOpenStaking}>
            View staking
          </button>
        </div>
      </div>
    </header>
  );
}
```

Update `src/App.tsx` to use the new header:

```tsx
<AppHeader onOpenStaking={() => { window.location.href = '/#/stake'; }} />
```

Update the outer prompt shell in `src/components/PromptBox.tsx`:

```tsx
<section
  id="prompt"
  className="prompt-box"
  aria-label="Prompt composer"
  style={containerStyle}
>
```

Expected: the header no longer lies about wallet connect, and both CTA targets now exist.

- [ ] **Step 5: Re-run the wallet and anchor tests**

Run:

```bash
npm run test -- src/context/walletMode.test.ts src/components/__tests__/AppHeader.test.tsx src/components/__tests__/PromptBox.test.tsx
```

Expected: PASS on all three files.

- [ ] **Step 6: Commit the honesty and anchor fixes**

Run:

```bash
git add src/context/walletMode.ts src/context/walletMode.test.ts src/context/AgentContext.tsx src/components/AppHeader.tsx src/components/__tests__/AppHeader.test.tsx src/components/__tests__/PromptBox.test.tsx src/components/PromptBox.tsx src/components/PromptQueue.tsx src/App.tsx
git commit -m "fix: remove fake wallet shell affordances"
```

Expected: one focused commit with the honest header, prompt anchors, and vote gate.

## Task 3: Stack The Support Rail And Establish The Warm Token Base

**Files:**
- Create: `src/components/__tests__/AppLayout.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/index.css`

- [ ] **Step 1: Write the failing shell layout regression test**

Create `src/components/__tests__/AppLayout.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('../WelcomeAgent', () => ({ WelcomeAgent: () => <div>Welcome block</div> }));
vi.mock('../OnboardingBanner', () => ({ OnboardingBanner: () => <div>Onboarding block</div> }));
vi.mock('../PromptBox', () => ({ PromptBox: () => <div>Prompt box</div> }));
vi.mock('../AgentStream', () => ({ AgentStream: () => <div>Agent stream</div> }));
vi.mock('../PromptQueue', () => ({ PromptQueue: () => <div>Prompt queue</div> }));
vi.mock('../LifeMeter', () => ({ LifeMeter: () => <div>Life meter</div> }));
vi.mock('../MemoryBrain', () => ({ MemoryBrain: () => <div>Memory brain</div> }));
vi.mock('../SocialSharing', () => ({ SocialSharing: () => <div>Social sharing</div> }));
vi.mock('../Governance', () => ({ Governance: () => <div>Governance</div> }));
vi.mock('../CanvasLayer', () => ({ CanvasLayer: () => <div>Canvas</div> }));
vi.mock('../Guestbook', () => ({ Guestbook: () => <div>Guestbook</div> }));
vi.mock('../../context/useAgent', () => ({
  useAgent: () => ({
    backendAvailable: true,
    walletMode: 'preview'
  })
}));

import App from '../../App';

it('keeps the support rail in the mobile document flow', () => {
  render(<App />);
  expect(screen.getByTestId('support-rail').className).not.toMatch(/\bhidden\b/);
  expect(screen.getByText('Commons agent')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the shell layout test and verify it fails on the current layout**

Run:

```bash
npm run test -- src/components/__tests__/AppLayout.test.tsx
```

Expected: FAIL because the support rail still includes `hidden md:flex`, and the shell still uses the old terminal header copy.

- [ ] **Step 3: Update `src/App.tsx` so the support rail stacks instead of disappearing**

Replace the main layout shell with a two-lane desktop grid and a single-column mobile flow:

```tsx
<main className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
  <WelcomeAgent />
  <OnboardingBanner />

  <div className="grid gap-8 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.95fr)] xl:items-start">
    <section className="flex min-w-0 flex-col gap-8">
      <PromptBox />
      <AgentStream />
    </section>

    <aside
      data-testid="support-rail"
      className="flex flex-col gap-6 xl:sticky xl:top-24"
      aria-label="Support modules"
    >
      <PromptQueue />
      <LifeMeter />
      <MemoryBrain />
      <SocialSharing />
    </aside>
  </div>

  <section id="governance" className="space-y-6">
    <Governance />
  </section>

  <section id="canvas" className="space-y-6">
    <CanvasLayer />
  </section>

  <Guestbook />
</main>
```

Expected: mobile users keep the same priority order, just stacked into one readable flow.

- [ ] **Step 4: Replace the token collision in `src/index.css` with the approved warm-shell base**

Add or replace the root token block and base heading rules with:

```css
:root {
  --shell-bg: #11130f;
  --shell-surface: #171a15;
  --shell-surface-2: #1d211b;
  --shell-border: #32382e;
  --shell-text: #f2efe6;
  --shell-text-muted: #b9b3a4;
  --shell-accent: #86b87f;
  --shell-accent-strong: #b7d58c;
  --shell-success: #7dcf9a;
  --shell-danger: #e38b77;
}

body {
  background:
    radial-gradient(circle at top, rgba(134, 184, 127, 0.12), transparent 28%),
    linear-gradient(180deg, #161814 0%, var(--shell-bg) 100%);
  color: var(--shell-text);
}

@layer base {
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    text-transform: none;
    letter-spacing: -0.02em;
    color: var(--shell-text);
  }
}

.btn-primary,
.btn-secondary,
.card,
.glass-panel,
.input,
.terminal-frame {
  border-color: var(--shell-border);
  background: color-mix(in srgb, var(--shell-surface) 88%, transparent);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.24);
}

.crt-screen,
.scanline-overlay,
.neon-glow {
  background: none;
  box-shadow: none;
  text-shadow: none;
}
```

Expected: the app keeps depth and structure without the terminal/garden split or the all-caps default.

- [ ] **Step 5: Re-run the shell layout test and a production build**

Run:

```bash
npm run test -- src/components/__tests__/AppLayout.test.tsx
npm run build
```

Expected: PASS on the layout regression test and a clean production build.

- [ ] **Step 6: Commit the warm-shell layout foundation**

Run:

```bash
git add src/App.tsx src/index.css src/components/__tests__/AppLayout.test.tsx
git commit -m "feat: stack support rail in warm shell layout"
```

Expected: one focused commit covering the responsive shell and token foundation.

## Task 4: Harmonize Component Copy And Remove The Remaining Terminal/Garden Collision

**Files:**
- Create: `src/components/__tests__/WarmShellCopy.test.tsx`
- Modify: `src/components/WelcomeAgent.tsx`
- Modify: `src/components/OnboardingBanner.tsx`
- Modify: `src/components/PromptBox.tsx`
- Modify: `src/components/PromptQueue.tsx`
- Modify: `src/components/AgentStream.tsx`
- Modify: `src/components/LifeMeter.tsx`

- [ ] **Step 1: Write the failing copy regression test**

Create `src/components/__tests__/WarmShellCopy.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('../../context/useAgent', () => ({
  useAgent: () => ({
    diemStaked: 0,
    tier: 'seed',
    prompts: [],
    logs: [],
    proposals: [],
    backendAvailable: false,
    isConnected: false,
    canVote: false,
    voteDisabledReason: 'Signed wallet voting is not available in this preview.',
    addPrompt: vi.fn(),
    votePrompt: vi.fn()
  })
}));

import { WelcomeAgent } from '../WelcomeAgent';
import { OnboardingBanner } from '../OnboardingBanner';
import { PromptBox } from '../PromptBox';
import { PromptQueue } from '../PromptQueue';
import { LifeMeter } from '../LifeMeter';

it('uses the approved warm-shell copy instead of terminal or garden jargon', () => {
  render(
    <>
      <WelcomeAgent />
      <OnboardingBanner />
      <PromptBox />
      <PromptQueue />
      <LifeMeter />
    </>
  );

  expect(screen.queryByText(/welcome to agent terminal/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/greetings, user_/i)).not.toBeInTheDocument();
  expect(screen.queryByPlaceholderText(/plant an idea in the garden/i)).not.toBeInTheDocument();
  expect(screen.getByText('How this works')).toBeInTheDocument();
  expect(screen.getByText('Start a prompt')).toBeInTheDocument();
  expect(screen.getByText('No prompts in queue yet.')).toBeInTheDocument();
  expect(screen.getByText('Grounded')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the copy regression test and verify the old language still fails**

Run:

```bash
npm run test -- src/components/__tests__/WarmShellCopy.test.tsx
```

Expected: FAIL because the components still render terminal-only and garden-only language.

- [ ] **Step 3: Replace the hero and onboarding copy with the approved warm-shell language**

Update `src/components/WelcomeAgent.tsx` and `src/components/OnboardingBanner.tsx` to use this copy:

```tsx
// WelcomeAgent
<p className="text-xs font-mono uppercase tracking-[0.2em] text-[var(--shell-text-muted)]">Commons agent</p>
<h2 className="text-4xl font-semibold text-[var(--shell-text)]">Work with the agent, not the interface.</h2>
<p className="max-w-2xl text-base text-[var(--shell-text-muted)]">
  Start with one prompt. Follow the response, queue, memory, and governance without losing the thread.
</p>

// OnboardingBanner
<h3 className="text-2xl font-semibold text-[var(--shell-text)]">How this works</h3>
<ol className="space-y-3 text-[var(--shell-text-muted)]">
  <li>1. Write one clear prompt.</li>
  <li>2. Track the live response and queue.</li>
  <li>3. Use staking and signed voting when those actions are available.</li>
</ol>
```

Expected: the top of the app reads like a civic tool, not a retro terminal.

- [ ] **Step 4: Replace the conflicting prompt, queue, stream, and life-meter language**

Update the key strings in the remaining high-visibility components:

```tsx
// PromptBox
<h3 className="text-2xl font-semibold text-[var(--shell-text)]">Start a prompt</h3>
<p className="text-sm text-[var(--shell-text-muted)]">Describe what you want the agent to do, decide, or explain.</p>
<textarea placeholder="Describe what you want the agent to do, decide, or explain." />

// PromptQueue
<h3 className="text-xl font-semibold text-[var(--shell-text)]">Prompt queue</h3>
<p className="text-sm text-[var(--shell-text-muted)]">No prompts in queue yet.</p>

// AgentStream
<h3 className="text-xl font-semibold text-[var(--shell-text)]">Agent stream</h3>
<span>{isConnected ? 'Connected' : 'Offline preview'}</span>

// LifeMeter
const stages = ['Grounded', 'Gathering', 'Active', 'Amplified'] as const;
<h3 className="text-xl font-semibold text-[var(--shell-text)]">System health</h3>
```

Expected: the primary shell stops switching between CRT jargon and plant metaphors.

- [ ] **Step 5: Re-run the copy regression test and the full frontend test suite**

Run:

```bash
npm run test -- src/components/__tests__/WarmShellCopy.test.tsx
npm run test
```

Expected: PASS on the targeted copy test and then PASS on the full root frontend suite.

- [ ] **Step 6: Commit the component language pass**

Run:

```bash
git add src/components/WelcomeAgent.tsx src/components/OnboardingBanner.tsx src/components/PromptBox.tsx src/components/PromptQueue.tsx src/components/AgentStream.tsx src/components/LifeMeter.tsx src/components/__tests__/WarmShellCopy.test.tsx
git commit -m "refactor: unify warm shell component language"
```

Expected: one focused commit containing the approved warm-shell copy and high-visibility UI cleanup.

## Task 5: Lock Shared Event Usage, Add Browser Verification, Run Audits, And Clean Generated Artifacts

**Files:**
- Modify: `src/components/AgentStream.tsx`
- Modify: `.gitignore`
- Create: `scripts/check_warm_shell.py`

- [ ] **Step 1: Replace the raw cell-toggle event name with the shared constant**

Update `src/components/AgentStream.tsx`:

```tsx
websocketService.emit(WSEvents.EMERGENCE_CELL_TOGGLE, {
  x,
  y,
  alive: !cell.alive
});
```

Expected: the shell uses `shared/events.ts` consistently instead of hard-coded websocket event strings.

- [ ] **Step 2: Ignore the brainstorm artifacts before final cleanup**

Update `.gitignore`:

```gitignore
.superpowers/
```

Expected: generated brainstorm files stop showing up as project changes.

- [ ] **Step 3: Create the repeatable browser verification script**

Create `scripts/check_warm_shell.py`:

```python
from playwright.sync_api import sync_playwright

APP_URL = "http://127.0.0.1:5173"


def assert_absent(page, role, name):
    if page.get_by_role(role, name=name).count() != 0:
        raise AssertionError(f"Unexpected {role} with name {name!r}")


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)

    desktop = browser.new_page(viewport={"width": 1440, "height": 1600})
    desktop.goto(APP_URL)
    desktop.wait_for_load_state("networkidle")
    assert desktop.get_by_role("button", name="View staking").is_visible()
    assert desktop.get_by_text("How this works").is_visible()
    assert desktop.get_by_text("Prompt queue").is_visible()
    assert_absent(desktop, "button", "Connect wallet")

    mobile = browser.new_page(viewport={"width": 390, "height": 1400})
    mobile.goto(APP_URL)
    mobile.wait_for_load_state("networkidle")
    mobile.get_by_text("Prompt queue").scroll_into_view_if_needed()
    mobile.get_by_text("System health").scroll_into_view_if_needed()
    mobile.get_by_text("Governance").scroll_into_view_if_needed()
    assert mobile.get_by_text("Prompt queue").is_visible()
    assert mobile.get_by_text("System health").is_visible()
    assert mobile.get_by_text("Governance").is_visible()

    browser.close()
    print("warm shell checks passed")
```

Expected: one script covers the approved desktop and mobile shell priorities without manual clicking.

- [ ] **Step 4: Run the final verification wall**

Run:

```bash
npm run typecheck
npm run test
npm run build
npm --prefix backend test
npm audit
npm --prefix backend audit
python C:/Users/Tyson/.agents/skills/webapp-testing/scripts/with_server.py --server "npm run dev -- --host 127.0.0.1 --port 5173" --port 5173 -- python scripts/check_warm_shell.py
```

Expected:
- `npm run typecheck`: exit code `0`
- `npm run test`: exit code `0`
- `npm run build`: exit code `0`
- `npm --prefix backend test`: exit code `0`
- `npm audit` and `npm --prefix backend audit`: either exit code `0` or a small, documented set of findings that you intentionally triage in the task notes before moving on
- browser script prints `warm shell checks passed`

- [ ] **Step 5: Remove the generated brainstorm directory and confirm it stays ignored**

Run in PowerShell:

```powershell
if (Test-Path -LiteralPath ".superpowers\brainstorm") {
  Remove-Item -LiteralPath ".superpowers\brainstorm" -Recurse
}
git status --short
```

Expected: the brainstorm session directory is gone, `.superpowers/` no longer pollutes `git status`, and the remaining diff only contains planned source changes.

- [ ] **Step 6: Commit the final verification and cleanup pass**

Run:

```bash
git add .gitignore src/components/AgentStream.tsx scripts/check_warm_shell.py
git commit -m "chore: verify warm shell remediation"
```

Expected: one final commit covering shared event cleanup, repeatable browser verification, and safe generated-artifact cleanup.

## Self-Review Checklist

- Spec coverage:
  - Warm Shell, Precise Core direction: Tasks 3 and 4
  - Dead `CONNECT` action removal: Task 2
  - Prompt anchors and CTA repair: Task 2
  - Mobile stacking instead of hidden support modules: Task 3
  - Frontend/backend contract alignment: Task 1
  - Honest signed-vote behavior: Task 2
  - Shared event constant cleanup: Task 5
  - Security and dependency audits: Task 5
  - Safe cleanup of generated artifacts: Task 5
- Placeholder scan:
  - No `TODO`, `TBD`, or unnamed steps remain.
  - Every command includes an expected result.
  - Every code-changing step includes exact code to add or replace.
- Type consistency:
  - `WalletMode` is defined once in `src/context/walletMode.ts` and reused.
  - `ApiStatusEnvelope`, `StatusResponse`, and `SignedVoteRequest` are defined in `src/services/api.ts` and referenced consistently.
  - `WSEvents.EMERGENCE_CELL_TOGGLE` is the only cell-toggle event name used after Task 5.
