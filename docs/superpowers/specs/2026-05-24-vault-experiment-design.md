# Vault Experiment - Social Collective Intelligence Platform

> **Date:** 2026-05-24  
> **Status:** Draft for Implementation

## Concept & Vision

**The Vault Experiment** is a public social experiment where participants join a digital commons, submit prompts, stake DIEM tokens, and observe emergent collective intelligence. It feels like stepping into a community garden where your contributions actually matter - a living laboratory where the whole becomes greater than the sum of its parts.

The experience should feel like being part of something meaningful - a real-time social experiment where you're both observer and participant. The "vault" framing evokes a Fallout-inspired bunker experiment, but in a warm, approachable way - like a scientist's notebook crossed with a community bulletin board.

## Design Language

### Aesthetic Direction: "Observatory Lab"
Clean, scientific, but warm and approachable. The interface communicates: "this is serious research, and you can participate."

### Color Palette
- **Base Background:** `oklch(98% 1% 80deg)` - Warm off-white
- **Surface:** `oklch(99% 0.5% 80deg)` - Clean light surface
- **Surface 2:** `oklch(96% 1.5% 80deg)` - Slightly darker for cards
- **Border:** `oklch(90% 2% 80deg)` - Subtle warm gray
- **Text:** `oklch(25% 3% 60deg)` - Deep charcoal
- **Text Muted:** `oklch(50% 2% 60deg)` - Mid gray
- **Accent (Primary):** `oklch(65% 15% 145deg)` - Sage green (the "vault teal")
- **Accent Strong:** `oklch(45% 18% 145deg)` - Deep sage
- **Success:** `oklch(65% 15% 145deg)` - Same as accent
- **Danger:** `oklch(60% 18% 30deg)` - Warm red

### Typography
- **Headings:** Space Grotesk (bold, tracking-tight)
- **Body:** DM Sans
- **Mono/Data:** IBM Plex Mono

### Spatial System
- Cards: 1.25rem padding, 1rem border-radius
- Section spacing: 4rem vertical rhythm
- Grid gap: 2rem between major sections

### Motion Philosophy
- Subtle and purposeful - no gratuitous animation
- 200-300ms transitions for interactions
- Progress bars animate over 500ms with ease-out

## Layout & Structure

### Page Architecture

```
┌─────────────────────────────────────────────────────┐
│ HEADER: Vault-2026 branding + Status indicator     │
├─────────────────────────────────────────────────────┤
│ HERO: Welcome + Vault Status Summary               │
│ - Experiment badge                                 │
│ - Tagline: "Enter the social experiment"           │
│ - Quick stats (Consciousness, Emergence, Status)   │
│ - CTA: Begin Experiment                            │
├─────────────────────────────────────────────────────┤
│ ONBOARDING BANNER (dismissible)                    │
│ - What is the Vault Experiment                     │
│ - How to participate                               │
│ - Key features explained                            │
├─────────────────────────────────────────────────────┤
│ MAIN GRID (2 columns on xl)                        │
│ ┌─────────────────────┬───────────────────────┐   │
│ │ PROMPT BOX          │ SUPPORT RAIL          │   │
│ │ - Composer          │ - Prompt Queue        │   │
│ │ - Depth selector    │ - LifeMeter/Vault      │   │
│ │ - Influence meter   │ - MemoryBrain         │   │
│ │                     │ - SocialSharing        │   │
│ ├─────────────────────┤                       │   │
│ │ AGENT STREAM        │                       │   │
│ │ - Emergence grid    │                       │   │
│ │ - Consciousness     │                       │   │
│ │ - Status/mood       │                       │   │
│ │ - Log stream        │                       │   │
│ └─────────────────────┴───────────────────────┘   │
├─────────────────────────────────────────────────────┤
│ GOVERNANCE SECTION                                  │
│ - Terminal aesthetic panel                         │
│ - Proposals list with filtering                     │
│ - Create new proposal                              │
│ - Delegation panel                                 │
├─────────────────────────────────────────────────────┤
│ PUBLIC MATRIX (Canvas Layer)                       │
│ - Emergence grid visualization                     │
│ - Activity events feed                             │
├─────────────────────────────────────────────────────┤
│ CITIZEN LOG (Guestbook)                            │
│ - Wall of contributions                            │
│ - Leaderboard                                      │
├─────────────────────────────────────────────────────┤
│ FOOTER                                             │
└─────────────────────────────────────────────────────┘
```

### Responsive Strategy
- **Mobile (< sm):** Single column, stacked sections
- **Tablet (sm-md):** 2-column grid for main content
- **Desktop (lg+):** Full layout with sticky sidebar

## Features & Interactions

### 1. Vault Status (LifeMeter component)
The central health indicator showing participant's tier and stake.

**Tiers:**
- Dying: < 0.1 DIEM (Vault -1)
- Minimal: 0.1-10 DIEM (Vault 0) 
- Surviving: 10-500 DIEM (Vault 1)
- Thriving: > 500 DIEM (Vault 2)

**Display:**
- Vault level with icon
- Vitality percentage bar
- Growth progress to next tier
- Seeds (DIEM staked), Growth (sqrt(Stake)), Treasury (USDC), Influence (quadratic weight)

### 2. Prompt Submission
Submit prompts to the collective queue.

**Flow:**
1. User types prompt in textarea
2. Selects depth tier ($0.01, $0.05, $0.25, $1.00)
3. Sees influence meter based on stake
4. Submits with cost calculation
5. Prompt appears in queue

**States:**
- Default: Prompt composer visible
- Processing: "Processing..." state with spinner
- Success: Share modal with copy/share options

### 3. Emergence Stream (AgentStream)
Real-time visualization of agent activity + Conway's Life grid.

**Components:**
- Tier icon with glow for Thriving
- Emergence matrix (Conway's Life visualization)
- Consciousness bar (percentage based on stake/500)
- Memory usage bar
- Status/mood indicator
- Log stream with auto-scroll

### 4. Prompt Queue
Public queue showing all submitted prompts.

**Display:**
- Sorted by votes (highest first)
- Vote button with count
- Prompt text (truncated)
- User and cost info

**Interactions:**
- Click vote to upvote (requires connected wallet)
- Shows vote disabled reason if not eligible

### 5. Governance
Terminal-aesthetic panel for proposals and voting.

**Features:**
- Status filter (ALL, SEEDLING, SPROUTING, BLOOMING, PASSED, FAILED, EXECUTED)
- Category filter (COMPOST, SOIL, SPROUT, ROOTS, GRAFT)
- My Proposals toggle
- Proposal cards with:
  - Title, status badge, category badge
  - Vote progress bar (for/against)
  - Quorum progress bar
  - Expand for details + voting
- Create proposal form
- Delegation panel

### 6. Public Matrix (Canvas)
Pixel canvas where 1 prompt = 1 pixel.

**Display:**
- Grid visualization
- Cell density percentage
- Birth/death event counters
- Live status indicator

### 7. Citizen Log (Guestbook)
Wall of contributions and leaderboard.

**Features:**
- Contribution entries
- Leaderboard ranking
- Activity history

## Component Inventory

### AppHeader
- Vault-2026 branding with shield icon
- Public Social Experiment tagline
- Status badge (Experiment Active)
- Tier/stake display (desktop)
- Enter Vault button

### WelcomeAgent
- Experiment badge (Vault Experiment)
- Live status badge
- Hero headline and description
- CTA buttons (Begin Experiment, View Protocol)
- Quick stats grid (Experiment Type, Consciousness, Emergence, Status)

### OnboardingBanner
- Vault Experiment Protocol title
- Feature cards (Collective Intelligence, Memory Evolution, Governance)
- Navigation links (Submit Prompt, View Proposals, Watch Emergence)
- Dismissible with localStorage persistence

### PromptBox
- Title: "Start a prompt"
- Help tooltip
- Description text
- Form with:
  - Textarea (2000 char max)
  - Depth selector (4 tiers)
  - Your Influence meter
  - Cost display
  - Submit button
- Unlocking state for low stake users

### AgentStream
- Terminal-style container with bezel border
- Header with tier icon, TIER label, STAKE, connection status
- Emergence grid (canvas)
- Stats: Consciousness, Memory, Status/Mood
- Log stream with timestamps
- Status bar with last update

### PromptQueue
- Title: "Prompt queue"
- Empty state message
- Prompt cards with vote button, text, user, cost
- Vote disabled message

### LifeMeter
- Vault Status title with icon
- Current tier display (Vault -1, 0, 1, 2)
- Vitality progress bar
- Growth progress bar with tier markers
- 4 stat cards: Seeds, Growth, Treasury, Influence

### Governance
- Terminal aesthetic (dark bg, green text, scanlines)
- Header with ROBCO INDUSTRIES styling
- Filter controls
- Proposal cards (expandable)
- Create proposal form
- Delegation panel

### CanvasLayer
- Emergence Grid title with live indicator
- Stats row (density, units, status)
- Canvas with scanline overlay
- Live event counters

### Guestbook
- Citizen Log title
- Contribution entries
- Leaderboard

### SocialSharing
- Share options
- Referral info

### MemoryBrain
- Memory visualization
- Stats display

## Technical Approach

### Frontend Stack
- React 19.2.6
- TypeScript 6.0.2
- Vite 8.0.12
- TailwindCSS 4.3.0 (via @tailwindcss/vite)
- Socket.io-client 4.8.3
- Lucide React 1.16.0

### State Management
- React Context (AgentContext) for global state
- WebSocket service for real-time updates
- localStorage for onboarding dismissal

### API Integration
- REST API via fetch (api.ts)
- WebSocket for real-time events (websocket.ts)
- x402 payment protocol for prompt submission

### Key Services
- `api.ts`: REST endpoints for status, prompts, governance
- `websocket.ts`: WebSocket client for real-time updates
- `AgentContext.tsx`: Global state provider

### Backend (Node.js/Fastify)
- Fastify 5.2.0 with websocket plugin
- Socket.io 4.8.0
- x402 payment integration
- ChromaDB for embeddings