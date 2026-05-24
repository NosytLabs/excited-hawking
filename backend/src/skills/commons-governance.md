---
name: commons-governance
description: Governance and voting for The Peoples Agent
version: 1.0.0
category: governance
platforms: [node]
metadata:
  hermes:
    tags: [governance, voting, proposals]
    requires_toolsets: [terminal]
---

# Commons Governance Skill

Democratic control over agent behavior through quadratic voting.

## Proposal Lifecycle

```
DRAFT → ACTIVE → VOTING → PASSED/FAILED → EXECUTED/REJECTED
```

## Quadratic Voting

Vote cost = votes²

- 1 vote = 1 token
- 2 votes = 4 tokens
- 3 votes = 9 tokens

This prevents vote buying and encourages genuine preference signaling.

## Creating Proposals

Proposals require:
- Title (max 100 chars)
- Description (max 1000 chars)
- Deposit (minimum 10 DIEM)

## Voting

- Voting period: 48 hours
- Quorum: 40% of staked DIEM
- Threshold: 51% for approval

## Slash Rules

- Spam voting: 5% token burn
- Collusion: 25% slash + temporary ban
- Inactivity: 1% slash per missed cycle