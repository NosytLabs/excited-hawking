---
name: commons-staking
description: Stake DIEM tokens to participate in The Commons Agent
version: 1.0.0
category: staking
platforms: [node]
metadata:
  hermes:
    tags: [staking, tokens, tier]
---

# Commons Staking

Stake DIEM tokens to gain voting power and tier upgrades.

## Tier System

| Tier | Min Staked | Voting Power | Benefits |
|------|------------|--------------|----------|
| Dying | 0 | 0x | Basic access |
| Minimal | 0.1 DIEM | 0.32x | Voting rights |
| Surviving | 10 DIEM | 3.16x | Priority queue |
| Thriving | 500 DIEM | 22.4x | Full features |

## Quadratic Voting

Voting power = √(staked DIEM)

This prevents whale dominance. 100x more stake = 10x more voting power.

## Unstaking

- Requests have a timelock period
- Withdrawals processed after timelock expires
- Partial unstaking allowed

## Rewards

- Stakers earn voting power
- Treasury grows from prompt fees
- Active participants get governance rewards