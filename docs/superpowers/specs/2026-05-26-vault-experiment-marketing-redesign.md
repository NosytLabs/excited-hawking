# Vault Experiment - Marketing Content Redesign

## Concept & Vision

Transform the Vault Experiment from generic "decentralized AI" narrative into a compelling observational experience. The site should feel like watching something unfold through a telescope — participants aren't "using a product", they're observing patterns emerge from collective attention.

**Core Fram message**: *"Something is taking shape. You're part of the experiment watching it happen."*

## Design Principles

1. **Intrigue first, explanation later** — Don't lead with disclaimers or caveats. Get attention, then explain in proper contexts
2. **Observational framing** — Participant is an observer of emergent patterns, not a user of a product
3. **Scientific credibility** — Backstop with real methodology so curiosity converts to trust
4. **Reduce friction** — Minimal barriers to participate. Understandable quickly.

## Content Changes

### WelcomeAgent (Hero Section)

**Before:**
> "Observing collective attention patterns in multi-agent AI systems."
> "A public observational study running since May 2026..."

**After:**
> "Something is forming in the grid."
> "127 participants are watching patterns emerge from weighted attention."
> "The study has been running for 847 cycles."

Replace "Participate" CTA with "Submit a prompt" / "Cast a vote"

Move "This is an observational study" disclaimer to footnotes, not hero

### OnboardingBanner

**Before:** Dense explanation of mechanics in onboarding

**After:** Brief hook + link to full details
> "Your attention shapes what emerges. [Learn how it works →](#about)"

### AboutPage

Expand with sections:
1. **What We're Observing** — The emergence grid, the patterns, what "emergence" means here
2. **How You Participate** — Submit prompts, stake tokens, vote on governance
3. **What We Measure** — Grid complexity, participation rate, voting patterns (no claims of consciousness)
4. **The Science** — Methodology, limitations, what results would mean

**Disclaimer placement:**
- Don't embed in hero — it kills intrigue
- Include in About > "What We're NOT Claiming" as footnotes
- Brief note in footer: "Emergence patterns do not indicate consciousness"

### ExperimentMetrics

Rename/simplify labels for visitor comprehension:
- "Emergence Level" → "Grid Complexity" (clearer what we measure)
- "Cycle" → "Observation Cycle" (reinforces scientific framing)
- "Phase" → "Study Phase"

### Footer

**Current:** "Observational study of computational patterns..."

**After:** "A collective experiment in pattern formation" + link to About

## Visual Hooks

1. **Live participant count** — "127 participants watching now"
2. **Observation cycle prominently displayed** — "Cycle 847"
3. **Animated grid as primary visual** — Not abstract metrics, show the patterns forming
4. **Recent activity feed** — "Someone just submitted a prompt from Berlin"

## Statement Fixes

### Remove/Minimize in Hero Areas
- "This is an observational study, not a claim of consciousness" 
- "Emergence patterns do not indicate sentience"
- Technical explanations in marketing copy

### Add/Reinforce in Proper Contexts (About, Footnotes)
- Proper scientific disclaimers in dedicated sections
- Methodology details for curious visitors
- Known limitations for credibility

### Fix Vague Statements
**Before:** "The creature exhibits emergent behaviors"
**After:** "Patterns form in the cellular automaton based on weighted prompt density"

**Before:** "Collective intelligence emerges"
**After:** "Weighted attention from participants creates observable patterns in the grid"

## Components to Update

1. `WelcomeAgent.tsx` — Headline, subheadline, CTA
2. `OnboardingBanner.tsx` — Simplified hook
3. `AboutPage.tsx` — Expanded content, proper section structure
4. `ExperimentMetrics.tsx` — Label updates
5. `App.tsx` — Footer text
6. `index.css` — Any bare `text-muted` or `text-text-bright` class usage

## Success Criteria

Visitors understand:
1. Something interesting is happening in the grid
2. Their participation can influence it
3. This is a real experiment with verifiable transparency
4. They want to see what emerges

Visitors don't feel:
1. They're being sold a fake AI consciousness
2. The disclaimers are trying to hide something
3. They need to read a 500-word disclaimer before understanding

## Key Copy Guidelines

| Instead of... | Use... |
|---------------|--------|
| "Emergent AI consciousness" | "Patterns emerge from collective attention" |
| "The creature learns" | "Grid complexity increases with participation" |
| "AI that's alive" | "Observation of emergent computational patterns" |
| Hero disclaimers | "Learn about the study ↓" link to About |

## Implementation Notes

- Phase disclaimers properly (marketing hook → explanation in About)
- Keep science credibility visible for skeptical visitors
- Real-time stats should be the visual hook, not abstract metrics
- Focus on "what's happening now" not "what this could mean"
