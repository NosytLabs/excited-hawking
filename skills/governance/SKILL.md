# Governance Skill

## Overview

The Governance skill handles public voting mechanics, proposal lifecycles, quadratic voting, delegation systems, and slash rules for The Peoples Agent. It ensures democratic control over agent behavior modifications.

## How It Works

### Public Voting Mechanics

1. **Proposal Submission**: Any authorized participant submits a proposal
2. **Voting Period**: Time-bound voting window (default: 48h)
3. **Vote Counting**: Transparent tally via on-chain or off-chain mechanism
4. **Execution**: Approved proposals auto-execute via governance interface

### Proposal Lifecycle

```
DRAFT -> ACTIVE -> VOTING -> PASSED/FAILED -> EXECUTED/REJECTED
         |           |
         v           v
      WITHDRAWN   EXPIRED
```

- **DRAFT**: Proposal authored, not yet submitted
- **ACTIVE**: Proposal submitted, awaiting voting start
- **VOTING**: Active voting period
- **PASSED**: Quorum reached, approved
- **FAILED**: Did not reach quorum or majority
- **EXECUTED**: Successfully applied
- **REJECTED**: Vetoed or invalidated

### Quadratic Voting

Cost = votes^2

- 1 vote costs 1 token
- 2 votes cost 4 tokens
- 3 votes cost 9 tokens

This prevents vote buying and encourages genuine preference signaling.

### Delegation System

1. **Delegate Selection**: Participants delegate voting power to trusted agents
2. **Weight Transfer**: Delegator's tokens count toward delegate's voting power
3. **Override Capability**: Delegators can override delegated votes
4. **Delegation Expiry**: Optional time-bound delegations

### Slash Rules

Penalties for violations:
- **Spam Voting**: 5% token burn for low-quality proposals
- **Collusion**: 25% slash + temporary ban
- **Inactivity**: 1% slash per missed governance cycle

## Usage Examples

```yaml
governance:
  voting:
    period_duration: 48h
    quorum: 0.4
    threshold: 0.51
    
quadratic_voting:
  enabled: true
  max_votes: 10
  vote_cost_exponent: 2

delegation:
  enabled: true
  max_delegates: 5
  delegation_expiry: 30d
  allow_partial: true

slash_rules:
  spam_penalty: 0.05
  collusion_penalty: 0.25
  inactivity_penalty: 0.01
```

## Configuration

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `voting_period` | duration | `48h` | Time to vote |
| `quorum` | float | `0.4` | Minimum participation |
| `threshold` | float | `0.51` | Approval threshold |
| `quadratic_voting` | boolean | `true` | Enable QV |
| `max_delegates` | int | `5` | Max delegation count |
| `slashing_enabled` | boolean | `true` | Enable penalties |

## Troubleshooting

**Low voter participation:**
- Reduce quorum threshold
- Extend voting period
- Enable voter incentives

**Proposals stuck in voting:**
- Check block finality is working
- Verify off-chain relay is operational
- Confirm token balances for voters

**Delegation not working:**
- Verify delegation transaction was confirmed
- Check delegate has not been slashed
- Confirm delegation expiry has not passed