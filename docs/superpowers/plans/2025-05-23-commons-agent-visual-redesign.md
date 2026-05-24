# Commons Agent Visual Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform The Commons Agent UI from generic "AI startup" to warm "community garden" aesthetic.

**Architecture:** CSS-first redesign using Tailwind v4 with custom properties. New WelcomeAgent hero component. Component-by-component refresh maintaining all existing functionality.

**Tech Stack:** React 19, TypeScript, TailwindCSS v4, Lucide React, Fraunces/DM Sans/DM Mono fonts

---

## File Structure

```
Files to CREATE:
- src/components/WelcomeAgent.tsx          (new hero section)

Files to MODIFY:
- src/index.css                            (design tokens + global styles)
- src/App.tsx                              (new layout with WelcomeAgent)
- src/components/OnboardingBanner.tsx     (warm garden styling)
- src/components/PromptBox.tsx            (botanical theme)
- src/components/LifeMeter.tsx            (plant growth tier display)
- src/components/Governance.tsx           (earth-toned cards)
- src/components/CanvasLayer.tsx          (warm textures)
- index.html                              (add Google Fonts)
```

---

## Task 1: Add Google Fonts to index.html

**Files:**
- Modify: `index.html` (add font preconnect + stylesheet link)

- [ ] **Step 1: Add Google Fonts**

```html
<!-- In <head>, before other stylesheets -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,400&display=swap" rel="stylesheet">
```

---

## Task 2: Add CSS Design Tokens to index.css

**Files:**
- Modify: `src/index.css` (replace existing Tailwind config with design tokens)

- [ ] **Step 1: Add CSS custom properties (design tokens)**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  /* Paper (backgrounds) */
  --color-cream: oklch(96% 2% 85deg);
  --color-cream-deep: oklch(92% 3% 80deg);
  --color-parchment: oklch(88% 4% 75deg);

  /* Primary — Earth Green (botanical anchor) */
  --color-sage: oklch(65% 15% 145deg);
  --color-sage-deep: oklch(55% 18% 140deg);
  --color-sage-mist: oklch(75% 10% 150deg);

  /* Accent — Warm Terracotta */
  --color-terra: oklch(62% 22% 40deg);
  --color-terra-soft: oklch(72% 16% 38deg);

  /* Highlight — Sandy Amber */
  --color-amber: oklch(78% 18% 75deg);
  --color-amber-glow: oklch(82% 14% 72deg);

  /* Neutrals */
  --color-bark: oklch(38% 8% 50deg);
  --color-clay: oklch(52% 10% 45deg);
  --color-stone: oklch(62% 6% 50deg);
  --color-sand-line: oklch(78% 4% 80deg);

  /* Status — LifeMeter tiers */
  --color-tier-seed: oklch(72% 12% 130deg);
  --color-tier-sprout: oklch(68% 18% 115deg);
  --color-tier-bloom: oklch(62% 22% 40deg);
  --color-tier-grove: oklch(52% 20% 140deg);

  /* Functional */
  --color-focus: oklch(65% 22% 145deg);
  --color-error: oklch(58% 25% 25deg);
  --color-success: oklch(65% 18% 145deg);

  /* Typography */
  --font-display: 'Fraunces', Georgia, serif;
  --font-body: 'DM Sans', system-ui, sans-serif;
  --font-mono: 'DM Mono', 'Courier New', monospace;

  /* Easings */
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}

@layer base {
  body {
    font-family: var(--font-body);
    background-color: var(--color-cream);
    color: var(--color-bark);
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-display);
  }

  code, pre, .font-mono {
    font-family: var(--font-mono);
  }
}

@layer components {
  .btn-primary {
    background-color: var(--color-sage);
    color: var(--color-cream);
    padding: 0.75rem 1.5rem;
    border-radius: 999px;
    font-weight: 600;
    transition: all 150ms var(--ease-out);
  }

  .btn-primary:hover {
    background-color: var(--color-sage-deep);
    transform: scale(1.02);
  }

  .btn-primary:focus-visible {
    outline: 3px solid var(--color-focus);
    outline-offset: 2px;
  }

  .btn-secondary {
    background-color: var(--color-terra);
    color: var(--color-cream);
    padding: 0.75rem 1.5rem;
    border-radius: 999px;
    font-weight: 600;
    transition: all 150ms var(--ease-out);
  }

  .btn-secondary:hover {
    background-color: var(--color-terra-soft);
  }

  .card {
    background-color: var(--color-cream-deep);
    border: 1px solid var(--color-sand-line);
    border-radius: 12px;
    padding: 1.5rem;
    transition: all 300ms var(--ease-out);
  }

  .card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px oklch(0% 0% 0% / 8%);
  }

  .input {
    background-color: var(--color-parchment);
    border: 1px solid var(--color-sand-line);
    border-radius: 8px;
    padding: 0.75rem 1rem;
    transition: border-color 150ms var(--ease-out);
  }

  .input:hover {
    border-color: var(--color-clay);
  }

  .input:focus {
    outline: none;
    border: 2px solid var(--color-sage);
    background-color: var(--color-parchment);
  }
}

@layer utilities {
  .text-display {
    font-family: var(--font-display);
  }

  .text-body {
    font-family: var(--font-body);
  }

  .text-mono {
    font-family: var(--font-mono);
  }
}
```

---

## Task 3: Create WelcomeAgent Component (Hero)

**Files:**
- Create: `src/components/WelcomeAgent.tsx`

- [ ] **Step 1: Create WelcomeAgent with botanical hero**

```tsx
import React from 'react';
import { Sprout, ArrowRight } from 'lucide-react';

export const WelcomeAgent: React.FC = () => {
  return (
    <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden px-6 py-24">
      {/* Botanical SVG background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <svg
          className="absolute bottom-0 left-0 w-64 h-64 opacity-20"
          viewBox="0 0 200 200"
          fill="none"
        >
          <path
            d="M100 180 Q80 140 60 120 Q40 100 30 60 Q20 20 60 30 Q100 40 100 80 Q100 120 100 180"
            fill="var(--color-sage)"
            className="animate-leaf-drift"
          />
        </svg>
        <svg
          className="absolute top-10 right-10 w-48 h-48 opacity-15"
          viewBox="0 0 150 150"
          fill="none"
        >
          <path
            d="M75 140 Q55 100 40 75 Q25 50 50 35 Q75 20 100 50 Q125 80 75 140"
            fill="var(--color-terra)"
            className="animate-leaf-drift-reverse"
          />
        </svg>
        <svg
          className="absolute top-1/3 left-1/4 w-32 h-32 opacity-10"
          viewBox="0 0 100 100"
          fill="none"
        >
          <circle cx="50" cy="50" r="40" fill="var(--color-amber)" />
        </svg>
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center max-w-3xl mx-auto">
        <h1 className="text-hero font-display font-semibold text-bark mb-6" style={{ color: 'var(--color-bark)', fontFamily: 'var(--font-display)' }}>
          Where AI grows together.
        </h1>
        <p className="text-lg md:text-xl text-clay mb-10 max-w-xl mx-auto" style={{ color: 'var(--color-clay)' }}>
          A community of humans and agents, planting ideas and watching them bloom.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            className="btn-primary flex items-center gap-2 text-lg"
            style={{ backgroundColor: 'var(--color-sage)', color: 'var(--color-cream)' }}
          >
            <Sprout size={20} />
            Enter the Garden
            <ArrowRight size={18} />
          </button>
          <button
            className="px-6 py-3 rounded-full border-2 transition-all"
            style={{
              borderColor: 'var(--color-terra)',
              color: 'var(--color-terra)',
              backgroundColor: 'transparent'
            }}
          >
            Learn the Rules
          </button>
        </div>
      </div>

      {/* Leaf drift animation style */}
      <style>{`
        @keyframes leaf-drift {
          0%, 100% { transform: rotate(-3deg) translateY(0); }
          50% { transform: rotate(3deg) translateY(-10px); }
        }
        @keyframes leaf-drift-reverse {
          0%, 100% { transform: rotate(3deg) translateY(0); }
          50% { transform: rotate(-3deg) translateY(-8px); }
        }
        .animate-leaf-drift {
          animation: leaf-drift 8s ease-in-out infinite;
        }
        .animate-leaf-drift-reverse {
          animation: leaf-drift-reverse 10s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
};
```

---

## Task 4: Update App.tsx Layout

**Files:**
- Modify: `src/App.tsx` (add WelcomeAgent, reorganize sections)

- [ ] **Step 1: Read current App.tsx**

Read the current file to understand the structure.

- [ ] **Step 2: Update App.tsx with new layout**

```tsx
import React, { useEffect } from 'react';
import { AgentProvider } from './context/AgentContext';
import { WelcomeAgent } from './components/WelcomeAgent';
import { OnboardingBanner } from './components/OnboardingBanner';
import { PromptBox } from './components/PromptBox';
import { AgentStream } from './components/AgentStream';
import { LifeMeter } from './components/LifeMeter';
import { Governance } from './components/Governance';
import { Guestbook } from './components/Guestbook';
import { CanvasLayer } from './components/CanvasLayer';
import { SocialSharing } from './components/SocialSharing';

function App() {
  return (
    <AgentProvider>
      <div className="min-h-screen" style={{ minHeight: '100vh' }}>
        {/* Header */}
        <header className="sticky top-0 z-50 backdrop-blur-md border-b" style={{ backgroundColor: 'oklch(96% 2% 85deg / 0.8)', borderColor: 'var(--color-sand-line)' }}>
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-sage)' }}>
                <Sprout size={20} className="text-cream" style={{ color: 'var(--color-cream)' }} />
              </div>
              <span className="font-display font-semibold text-xl" style={{ fontFamily: 'var(--font-display)' }}>The Commons</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="#governance" className="text-sm hover:opacity-70 transition-opacity" style={{ color: 'var(--color-clay)' }}>Governance</a>
              <a href="#canvas" className="text-sm hover:opacity-70 transition-opacity" style={{ color: 'var(--color-clay)' }}>Canvas</a>
              <button className="btn-primary text-sm">
                Join Us
              </button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main>
          <WelcomeAgent />
          <OnboardingBanner />
          
          <div className="max-w-7xl mx-auto px-6 py-16 grid lg:grid-cols-3 gap-8">
            {/* Main agent interface */}
            <div className="lg:col-span-2 space-y-8">
              <PromptBox />
              <AgentStream />
            </div>
            
            {/* Sidebar */}
            <div className="space-y-8">
              <LifeMeter />
              <SocialSharing />
            </div>
          </div>

          {/* Secondary sections */}
          <section id="governance" className="py-16" style={{ backgroundColor: 'var(--color-cream-deep)' }}>
            <div className="max-w-7xl mx-auto px-6">
              <h2 className="text-2xl font-display font-semibold mb-8" style={{ fontFamily: 'var(--font-display)' }}>Community Governance</h2>
              <Governance />
            </div>
          </section>

          <section id="canvas" className="py-16">
            <div className="max-w-7xl mx-auto px-6">
              <h2 className="text-2xl font-display font-semibold mb-8" style={{ fontFamily: 'var(--font-display)' }}>Public Canvas</h2>
              <CanvasLayer />
            </div>
          </section>

          <section className="py-16" style={{ backgroundColor: 'var(--color-cream-deep)' }}>
            <div className="max-w-7xl mx-auto px-6">
              <h2 className="text-2xl font-display font-semibold mb-8" style={{ fontFamily: 'var(--font-display)' }}>Guestbook</h2>
              <Guestbook />
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="py-12 text-center border-t" style={{ borderColor: 'var(--color-sand-line)' }}>
          <p className="font-display italic text-lg mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-clay)' }}>
            Grown with the community.
          </p>
          <div className="flex justify-center gap-6 text-sm" style={{ color: 'var(--color-stone)' }}>
            <a href="#" className="hover:opacity-70">Rules</a>
            <a href="#" className="hover:opacity-70">Documentation</a>
            <a href="#" className="hover:opacity-70">GitHub</a>
          </div>
        </footer>
      </div>
    </AgentProvider>
  );
}

export default App;
```

Note: Add `import { Sprout } from 'lucide-react';` to the imports.

---

## Task 5: Refresh OnboardingBanner

**Files:**
- Modify: `src/components/OnboardingBanner.tsx` (warm styling, botanical icons)

- [ ] **Step 1: Read current OnboardingBanner**

- [ ] **Step 2: Update with warm community garden styling**

Keep the existing functionality but update:
- Card backgrounds to `var(--color-cream-deep)`
- Add subtle hover lift animations
- Update icons to be more botanical
- Warm color text and borders

---

## Task 6: Redesign PromptBox

**Files:**
- Modify: `src/components/PromptBox.tsx` (botanical theme, garden copy)

- [ ] **Step 1: Read current PromptBox**

- [ ] **Step 2: Update with garden aesthetic**

```tsx
// Key changes:
// - Placeholder: "Plant an idea…" instead of generic prompt
// - Submit button: botanical leaf icon
// - Warm parchment background
// - Sage border on focus
// - "Tend" instead of "Send" button text
```

---

## Task 7: Refresh LifeMeter with Plant Growth Tiers

**Files:**
- Modify: `src/components/LifeMeter.tsx` (plant growth stages)

- [ ] **Step 1: Read current LifeMeter**

- [ ] **Step 2: Update tier display**

Change tier visualization from generic colored boxes to a growing plant diagram:
- **Seed:** Simple seed/sprout icon (0-100 points)
- **Sprout:** Small plant with 2 leaves (101-500 points)  
- **Bloom:** Plant with flower (501-1500 points)
- **Grove:** Multiple plants/trees (1500+ points)

Add visual plant SVG that grows with tier level. Use CSS animations for gentle sway effect.

---

## Task 8: Update Governance Component

**Files:**
- Modify: `src/components/Governance.tsx`

- [ ] **Step 1: Read current Governance**

- [ ] **Step 2: Apply earth-toned styling**

- Card backgrounds using warm cream
- Terracotta accents for votes
- Sage green for approve/active states
- Proposal cards with organic rounded corners (16px)

---

## Task 9: Polish CanvasLayer

**Files:**
- Modify: `src/components/CanvasLayer.tsx`

- [ ] **Step 1: Read current CanvasLayer**

- [ ] **Step 2: Add warm texture overlay**

- Subtle paper/canvas texture background
- Warm color palette for pixels
- Rounded pixel corners for organic feel

---

## Task 10: Add Animations to index.css

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Add keyframe animations**

```css
/* Key animations for garden theme */
@keyframes grow-reveal {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse-tier {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes leaf-sway {
  0%, 100% { transform: rotate(-2deg); }
  50% { transform: rotate(2deg); }
}

.animate-grow-reveal {
  animation: grow-reveal 600ms var(--ease-out) forwards;
}

.animate-pulse-tier {
  animation: pulse-tier 300ms var(--ease-spring);
}

.animate-leaf-sway {
  animation: leaf-sway 4s ease-in-out infinite;
}

/* Staggered children animation */
.stagger-children > * {
  opacity: 0;
  animation: grow-reveal 600ms var(--ease-out) forwards;
}

.stagger-children > *:nth-child(1) { animation-delay: 0ms; }
.stagger-children > *:nth-child(2) { animation-delay: 100ms; }
.stagger-children > *:nth-child(3) { animation-delay: 200ms; }
.stagger-children > *:nth-child(4) { animation-delay: 300ms; }
.stagger-children > *:nth-child(5) { animation-delay: 400ms; }
```

---

## Validation

After each task:
- [ ] Run `npm run build` — must pass
- [ ] Run `npm run lint` — no errors
- [ ] Run `npx tsc --noEmit` — no TypeScript errors

---

## Backpressure Gates

All tasks must pass validation before marking complete:
- **Build:** `npm run build`
- **Lint:** `npm run lint`  
- **Typecheck:** `tsc --noEmit`

---

## Files Summary

| Task | Files | Status |
|------|-------|--------|
| 1 | index.html | ⬜ |
| 2 | src/index.css | ⬜ |
| 3 | src/components/WelcomeAgent.tsx (NEW) | ⬜ |
| 4 | src/App.tsx | ⬜ |
| 5 | src/components/OnboardingBanner.tsx | ⬜ |
| 6 | src/components/PromptBox.tsx | ⬜ |
| 7 | src/components/LifeMeter.tsx | ⬜ |
| 8 | src/components/Governance.tsx | ⬜ |
| 9 | src/components/CanvasLayer.tsx | ⬜ |
| 10 | src/index.css (animations) | ⬜ |

---

## Self-Review Checklist

- [ ] Spec coverage: All design spec requirements have tasks
- [ ] Placeholder scan: No TBD/TODOs in code blocks
- [ ] Type consistency: Font families, color tokens consistent across files
- [ ] File paths: All exact paths provided
- [ ] Validation commands: All specified with expected outputs
