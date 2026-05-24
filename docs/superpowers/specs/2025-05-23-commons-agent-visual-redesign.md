# The Commons Agent — Visual Redesign Spec

**Date:** 2025-05-23
**Author:** Commons Agent Design Team
**Status:** APPROVED

---

## Vision

A decentralized AI agent social experiment that feels like a **community garden**. Users don't need to understand AI or crypto — they plant ideas, watch them grow, and vote on what blooms. The aesthetic is warm, organic, and alive. Every interaction should feel like tending a garden with friends.

---

## Emotional Goals

1. **Community belonging** — Users feel they're part of something, not just using a tool
2. **Trust/safety** — No crypto jargon, approachable for normies
3. **Living/alive** — AI evolves visibly in real-time, feels like growth not computation

---

## Design Language

### Aesthetic Direction: "Warm Community Garden"

Organic, welcoming, approachable. Like a farmers market, not a tech startup. Earth greens, warm terracotta, soft amber, natural cream backgrounds. Soft shapes. Nature-inspired motion.

### Color Palette

```css
/* === The Commons Agent — Garden Palette === */

:root {
  /* Paper (backgrounds) */
  --color-cream:       oklch(96% 2% 85deg);   /* Main background */
  --color-cream-deep:  oklch(92% 3% 80deg);   /* Card backgrounds */
  --color-parchment:   oklch(88% 4% 75deg);   /* Input fields, wells */

  /* Primary — Earth Green (botanical anchor) */
  --color-sage:        oklch(65% 15% 145deg);  /* Primary actions */
  --color-sage-deep:   oklch(55% 18% 140deg);  /* Hover states */
  --color-sage-mist:   oklch(75% 10% 150deg);  /* Soft accents */

  /* Accent — Warm Terracotta */
  --color-terra:       oklch(62% 22% 40deg);   /* Secondary actions, highlights */
  --color-terra-soft:  oklch(72% 16% 38deg);   /* Hover, subtle accents */

  /* Highlight — Sandy Amber */
  --color-amber:       oklch(78% 18% 75deg);   /* Active states, progress */
  --color-amber-glow:  oklch(82% 14% 72deg);   /* Glow effects */

  /* Neutrals */
  --color-bark:        oklch(38% 8% 50deg);   /* Primary text */
  --color-clay:        oklch(52% 10% 45deg);   /* Secondary text */
  --color-stone:       oklch(62% 6% 50deg);   /* Muted text */
  --color-sand-line:   oklch(78% 4% 80deg);   /* Borders, dividers */

  /* Status — LifeMeter tiers */
  --color-tier-seed:   oklch(72% 12% 130deg);  /* Seedling — basic */
  --color-tier-sprout: oklch(68% 18% 115deg);  /* Sprouting — active */
  --color-tier-bloom:  oklch(62% 22% 40deg);   /* Blooming — advanced */
  --color-tier-grove:  oklch(52% 20% 140deg);  /* Grove — elite */

  /* Functional */
  --color-focus:       oklch(65% 22% 145deg);  /* Focus rings */
  --color-error:       oklch(58% 25% 25deg);   /* Error states */
  --color-success:     oklch(65% 18% 145deg);  /* Success feedback */
}
```

### Typography

**Display:** Fraunces (optical-size serif with organic personality)  
**Body:** DM Sans (warm geometric sans)  
**Mono:** DM Mono (matches DM Sans family)

```
--font-display: 'Fraunces', Georgia, serif;
--font-body:    'DM Sans', system-ui, sans-serif;
--font-mono:    'DM Mono', 'Courier New', monospace;

--text-xs:    0.75rem;
--text-sm:    0.875rem;
--text-base:  1rem;
--text-lg:    1.125rem;
--text-xl:    1.375rem;
--text-2xl:   1.75rem;
--text-3xl:   2.25rem;
--text-hero:  clamp(2.5rem, 6vw, 4rem);
```

### Spatial System

```
Base unit: 8px
Border radius: 8px (small), 12px (cards), 16px (hero), 999px (pills)
Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64, 96
```

### Motion

```
/* Easings */
--ease-out:    cubic-bezier(0.22, 1, 0.36, 1);
--ease-in:     cubic-bezier(0.64, 0, 0.78, 0);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);

/* Durations */
--dur-fast:  150ms;
--dur-base:  300ms;
--dur-slow:  600ms;

/* Key animations */
1. grow-reveal  — fading entrance with upward slide
2. leaf-drift  — botanical illustration sway
3. pulse-tier  — LifeMeter ring pulse on action
4. tier-up     — plant celebration on tier promotion
```

---

## Layout & Structure

### Page Hierarchy

1. **Hero Section** — Full-width botanical composition, headline + CTA
2. **Onboarding (3 cards)** — Chat / Earn / Vote introduction
3. **Agent Interface** — Main workbench with prompt + response
4. **Secondary features** — Governance, Guestbook, Canvas
5. **Footer** — "Grown with the community" statement

### Responsive Strategy

- Mobile-first with breakpoints at 640px, 768px, 1024px
- Single column on mobile, expand to grid on larger screens
- Touch-friendly tap targets (min 44px)

---

## Features & Interactions

### Landing Hero

**Visual:** Botanical CSS illustration (hand-crafted SVG leaves/stems)  
**Headline:** "Where AI grows together."  
**Subheadline:** "A community of humans and agents, planting ideas and watching them bloom."  
**CTA:** "Enter the Garden" (sage green pill)  
**Secondary:** "Learn the Rules" (ghost button)

### Onboarding Cards (3)

**Card 1 — Chat**
- Icon: speech bubble made of leaves
- "Talk with your agent" — "Ask anything. The agent learns your voice and grows more helpful over time."

**Card 2 — Earn**
- Icon: watering can + coins
- "Earn while you sleep" — "Complete tasks, train the community model, and watch your LifeMeter rise."

**Card 3 — Vote**
- Icon: three leaves forming checkmark
- "Shape what grows" — "Proposals bubble up from the community. One human, one vote."

### Agent Interface

**Prompt Input:**
- Placeholder: "Plant an idea…" (not generic "Enter prompt")
- Botanical leaf icon on submit button
- Character count display

**Agent Response:**
- Botanical avatar that "blooms" based on tier
- Markdown rendering with garden-themed code blocks
- Smooth typewriter-style streaming

### LifeMeter (Status Sidebar)

Display as plant growth stages:
- **Seed:** 0–100 points (new user)
- **Sprout:** 101–500 points
- **Bloom:** 501–1500 points  
- **Grove:** 1500+ points

Plant illustration with increasing botanical detail per tier. Ring progress shows % to next tier.

### Governance

- Earth-toned proposal cards
- Warm voting interface
- Community-focused copy

### Canvas

- Subtle texture overlay
- Warm pixel coloring
- Community-drawn art display

---

## Component Inventory

### Buttons

| State | Primary (Sage) | Secondary (Terra) | Ghost |
|-------|----------------|------------------|-------|
| Default | Sage bg, cream text | Terra bg, cream text | Transparent, terra border |
| Hover | Sage-deep bg, scale(1.02) | Terra-soft bg | Terra-soft bg |
| Focus | 3px focus ring | 3px focus ring | 3px focus ring |
| Active | scale(0.98) | scale(0.98) | scale(0.98) |
| Disabled | 40% opacity | 40% opacity | 40% opacity |
| Loading | "Planting…" spinner | "Tending…" spinner | "Reading…" spinner |

### Cards

- Background: --color-cream-deep
- Border: 1px --color-sand-line
- Radius: 12px
- Padding: 24px
- Hover: translateY(-4px), shadow lift

### Inputs

- Background: --color-parchment
- Border: --color-sand-line, shifts to --color-clay on hover
- Focus: 2px --color-sage border
- Radius: 8px
- Padding: 12px 16px

---

## Technical Approach

### Stack

- React 19 + TypeScript
- Vite + TailwindCSS v4
- Lucide icons (warm styling)
- Socket.io for real-time

### Implementation Order

1. Update index.css with design tokens
2. Redesign App.tsx with new layout
3. Create WelcomeAgent component (hero)
4. Refresh OnboardingBanner
5. Redesign PromptBox
6. Refresh LifeMeter styling
7. Update Governance styling
8. Polish CanvasLayer
9. Test all flows
10. Build + validate

### Font Loading

```html
<link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,400&display=swap" rel="stylesheet">
```

---

## Backpressure Gates

- `npm run build` — Must pass
- `npm run lint` — No errors
- `tsc --noEmit` — No TypeScript errors

---

## Success Criteria

1. ✅ Feels like a warm community garden, not a tech startup
2. ✅ Normies can understand the value proposition in <5 seconds
3. ✅ Tier system visual as plant growth stages
4. ✅ All existing functionality preserved
5. ✅ Build/lint/typecheck pass
