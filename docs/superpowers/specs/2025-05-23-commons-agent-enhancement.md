# The Commons Agent - Enhancement Design

Date: 2025-05-23
Status: Implemented

## Overview

Major enhancement to The Commons Agent incorporating best practices from Hermes Agent, Trae AI, and OpenClaw — plus a playful educational UI redesign for non-technical users.

---

## AI Agent Enhancements

### 1. Fixed agent.ts (task-10445)
**Problem:** 369 placeholder TODO lines in agent.ts  
**Solution:**
- Added proper SkillDefinition, SkillBundle, AgentSkill interfaces
- Created BUNDLED_SKILLS array with 5 core skills
- Added skill_manage tool for autonomous skill creation
- Implemented TOOL_DEFINITIONS with 8 tools including skill_manage

### 2. Bounded Memory Snapshots (task-10446)
**Inspired by:** Hermes Agent's MEMORY.md/USER.md  
**Implementation:**
- BoundedSnapshot class with MAX_COLLECTIVE_CHARS (2200) and MAX_USER_CHARS (1375)
- Delimiter-separated multi-wallet storage
- Automatic truncation on overflow
- Persisted to memory.json alongside main state

### 3. Skills System (task-10447)
**Inspired by:** Hermes Agent's progressive disclosure  
**Implementation:**
- SkillsRegistry class in backend/src/skills/index.ts
- Frontmatter parsing for SKILL.md metadata
- FSWatcher-based hot reload on skill file changes
- Category/tag filtering for skill discovery
- Created commons-core.md and commons-governance.md skills

### 4. Procedural Memory (task-10448)
**Inspired by:** Hermes Agent's autonomous skill creation  
**Implementation:**
- ProceduralMemory class with LearnedPattern interface
- recordSolution() - triggers after 5+ tool calls
- recordUsage() - confidence adjustment on success/failure
- findPatterns() - retrieval by prompt similarity
- patternToSkill() - converts patterns for context injection
- mergePatterns() - self-improvement via pattern consolidation

---

## UI/UX Redesign

### 5. Playful Education Theme (task-10449)
**Changes:**
- New color palette: Purple (#6366f1), Cyan (#06b6d4), Amber (#f59e0b)
- edu-card class with gradient backgrounds and hover effects
- Badge styles (badge-purple, badge-cyan, badge-emerald)
- progress-bar with gradient fill animation
- Rounder corners (8px-24px radius)
- New animations: float, shimmer

### 6. Humanized Onboarding (task-10450)
**Changes:**
- OnboardingBanner: "Hey there! I'm The Commons Agent 👋"
- 3-card layout: Chat with Me / Earn Rewards / Shape Decisions
- Emoji icons for visual friendliness
- PromptBox: Friendly tier names (Quick, Deep Dive, Power User)
- Gradient buttons replacing monochrome
- Help tooltip explaining cost distribution

### 7. OpenClaw-Inspired Features (task-10451)
**Changes:**
- New commons-staking.md skill for tier/voting documentation
- Updated LifeMeter colors to match new palette
- Skill bundles approach documented

---

## Architecture Summary

```
Backend:
├── src/lib/
│   ├── agent.ts          # Core agent with skills system
│   ├── memory.ts          # Bounded snapshots added
│   └── procedural-memory.ts  # NEW: Autonomous skill creation
├── src/skills/
│   ├── index.ts          # Skills registry with hot reload
│   ├── commons-core.md   # Core capabilities
│   ├── commons-governance.md  # Voting docs
│   └── commons-staking.md    # Staking docs
└── src/services/
    └── state.ts          # Persists bounded snapshot

Frontend:
├── src/index.css         # Playful education theme
├── src/components/
│   ├── OnboardingBanner.tsx  # Humanized onboarding
│   └── PromptBox.tsx         # Friendly interface
└── src/App.tsx           # Updated header/colors
```

---

## Key Patterns Adopted

1. **Progressive Disclosure** - Skills load on demand, not all at once
2. **Bounded Memory** - Frozen snapshots prevent unbounded growth
3. **Agent-Managed Memory** - Agent creates skills from experience
4. **Hot Reload** - Skills watched and reloaded without restart
5. **Quadratic Voting** - Prevents whale dominance
6. **Self-Improvement Loop** - Patterns merge and confidence adjusts

---

## Next Steps

1. Test agent.ts compiles without errors
2. Verify skills system loads on startup
3. Test hot reload by modifying a skill file
4. Validate bounded snapshot persistence
5. Run frontend to see playful theme in action