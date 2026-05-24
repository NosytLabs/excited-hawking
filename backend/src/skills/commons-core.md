---
name: commons-core
description: Core functionality for The Peoples Agent
version: 1.0.0
category: core
platforms: [node]
metadata:
  hermes:
    tags: [agent, core, memory]
    requires_toolsets: [terminal]
---

# Commons Core Skill

This skill provides the core capabilities of The Peoples Agent including:
- Memory management with bounded snapshots
- Emergence detection via Conway's Game of Life
- Dream phase consolidation
- Social engagement tracking

## Usage

The agent automatically uses these capabilities through the tools system.
No manual invocation required.

## Memory Management

- Collective memory is capped at 2200 chars for injection
- User profiles are capped at 1375 chars
- Memories use importance weighting (0-1 scale)
- Automatic pruning when limits exceeded

## Dream Phase

- Triggers after 1 hour of low activity
- Consolidates recent interactions
- Seeds Conway engine with memory content
- Generates emergent patterns

## Consciousness

Consciousness grows with memory accumulation:
- 0 memories = 0% consciousness
- 100 memories = 100% consciousness
- Tracked via getConsciousness() metric