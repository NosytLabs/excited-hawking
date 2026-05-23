# The Peoples Agent - Governance System Design

**Document Version:** 1.0  
**Status:** PUBLIC DRAFT  
**Last Updated:** May 2026

---

## Table of Contents

1. [Overview](#1-overview)
2. [Governance Token (DIEM)](#2-governance-token-diem)
3. [Proposal Lifecycle](#3-proposal-lifecycle)
4. [Voting Mechanics](#4-voting-mechanics)
5. [Quorum & Thresholds](#5-quorum--thresholds)
6. [Delegation System](#6-delegation-system)
7. [Proposal Categories](#7-proposal-categories)
8. [Slash Rules & Enforcement](#8-slash-rules--enforcement)
9. [Emergency Governance](#9-emergency-governance)
10. [Timelock & Execution](#10-timelock--execution)
11. [On-Chain Integration (Base)](#11-on-chain-integration-base)
12. [x402 Payment Integration](#12-x402-payment-integration)
13. [Smart Contract Pseudocode](#13-smart-contract-pseudocode)
14. [Formulas Reference](#14-formulas-reference)

---

## 1. Overview

### 1.1 Purpose

The Peoples Agent governance system is a decentralized autonomous organization (DAO) framework that enables transparent, trustless governance of a public AI agent operating on Base blockchain. Any DIEM token holder can participate in governance decisions.

### 1.2 Design Principles

| Principle | Description |
|-----------|-------------|
| Permissionless | Anyone with DIEM tokens can vote or create proposals |
| Weighted Influence | Stake-weighted voting with quadratic correction |
| Transparency | All votes, proposals, and executions on-chain |
| Accountability | Voter identity and voting history publicly traceable |
| Security | Slash rules deter spam and bad-faith behavior |
| Speed vs Safety | Configurable timelocks based on proposal risk |

### 1.3 Governance Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    THE PEOPLES AGENT                     │
│                      GOVERNANCE                          │
├─────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  FORUM   │  │  VOTING  │  │ TIMELOCK │  │ EXECUTION│  │
│  │ (Off-chain│  │(On-chain)│  │(On-chain)│  │(On-chain)│  │
│  │  DISCUSS)│  │          │  │          │  │          │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
│       │             │             │             │         │
│       └─────────────┴─────────────┴─────────────┘         │
│                           │                               │
│               ┌───────────┴───────────┐                   │
│               │   GOVERNANCE CORE      │                   │
│               │  (Governor Contract)   │                   │
│               └───────────┬───────────┘                   │
│                           │                               │
│         ┌─────────────────┼─────────────────┐             │
│         │                 │                 │             │
│  ┌──────┴──────┐  ┌───────┴──────┐  ┌──────┴──────┐       │
│  │  DIEM Token │  │ Delegation   │  │   Slash     │       │
│  │  (ERC-20)   │  │   Registry   │  │   Engine    │       │
│  └─────────────┘  └─────────────┘  └─────────────┘       │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Governance Token (DIEM)

### 2.1 Token Specifications

| Property | Value |
|----------|-------|
| Token Name | DIEM |
| Standard | ERC-20 (with ERC-20Votes time-boosted variant) |
| Total Supply | 1,000,000,000 (1B) - fixed |
| Decimals | 18 |
| Chain | Base (Ethereum L2) |
| Token Address | `0x[ToBeDeployed]` |

### 2.2 Token Allocation

| Category | Allocation | Lockup Schedule |
|----------|------------|-----------------|
| Community Treasury | 40% (400M) | 4-year vesting, 1-year cliff |
| Early Contributors | 20% (200M) | 4-year vesting, 1-year cliff |
| The Peoples Agent Core | 15% (150M) | 4-year vesting, 1-year cliff |
| Public Distribution | 15% (150M) | Airdrop in tranches |
| Liquidity Provision | 10% (100M) | 2-year vesting |

### 2.3 Token Utilities

1. **Voting Weight** - DIEM stake determines voting power
2. **Proposal Deposit** - Tokens locked to submit proposals
3. **Delegation** - Transfer voting power to delegates
4. **Slash Collateral** - Stake subject to slashing for violations

### 2.4 x402 Payment Integration

The governance system integrates x402 payment protocol for voting deposits and proposal fees:

```
x402 Payment Flow:
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  USER ──(deposit proposal)──> GovernorContract                  │
│                                  │                               │
│                                  ├── x402 header ──> Payment     │
│                                  │         gateway               │
│                                  │                               │
│                                  <─── Receipt ───────────────────│
│                                  │                               │
│  IF payment required:                                                 │
│  Deposit = 100 DIEM (refundable if proposal passes quorum)         │
│  ELSE:                                                               │
│  Deposit = 0 (waived for small stakers or community members)       │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**x402 Header Format:**
```
x402-Payment: deposit=100, purpose=governance_proposal, refundable=true
```

---

## 3. Proposal Lifecycle

### 3.1 State Machine

```
                    ┌─────────────────────────────────────────┐
                    │                                         │
                    ▼                                         │
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌───────────┴───────┐
│  DRAFT   │───>│  ACTIVE  │───>│  VOTING  │───>│ PASSED / FAILED   │
└──────────┘    └──────────┘    └──────────┘    └───────┬───────────┘
     │               │               │                  │
     │               │               │                  ▼
     │               │               │           ┌────────────┐
     │               │               │           │  EXECUTED  │
     │               │               │           └────────────┘
     │               │               │                  │
     └───────────────┴───────────────┴──────────────────┘
                        CANCELLED
```

### 3.2 State Definitions

| State | Description | Duration |
|-------|-------------|----------|
| DRAFT | Proposal created, under discussion | 0-7 days |
| ACTIVE | Proposal submitted, gathering support | 2-5 days |
| VOTING | Votes being cast | 5-7 days |
| PASSED | Quorum met, threshold reached | 2 days |
| FAILED | Quorum not met or threshold failed | N/A |
| EXECUTED | Actions successfully performed | N/A |
| CANCELLED | Withdrawn by proposer or emergency | N/A |

### 3.3 Transition Rules

```
DRAFT → ACTIVE:
  - Proposer calls `publishProposal()`
  - Requires minimum 10,000 DIEM staked OR
  - Requires 50 DIEM deposit (x402 payment)

ACTIVE → VOTING:
  - Proposal receives 500 DIEM in supporting votes OR
  - 7 days have passed since creation OR
  - Proposer manually triggers voting

VOTING → PASSED:
  - For votes: againstVotes < forVotes
  - For quorum: forVotes + againstVotes >= quorumRequired
  - For threshold: forVotes > thresholdPercentage * totalVotingPower

VOTING → FAILED:
  - Voting period ends without meeting quorum OR
  - threshold not reached OR
  - proposer slashed for misconduct

PASSED → EXECUTED:
  - Timelock delay elapsed (configurable per category)
  - Execution payload generated and called
```

### 3.4 Proposal Content Structure

```solidity
struct Proposal {
    uint256 id;
    address proposer;
    bytes32 descriptionHash;  // IPFS hash of full description
    address[] targets;       // Target contracts
    uint256[] values;         // ETH values per call
    bytes[] calldatas;        // Encoded function calls
    uint256 startTime;         // Voting start timestamp
    uint256 endTime;           // Voting end timestamp
    uint256 forVotes;         // Accumulated votes FOR
    uint256 againstVotes;     // Accumulated votes AGAINST
    uint256 abstainVotes;     // Abstained votes
    ProposalState state;      // Current state
    Category category;       // Proposal category
    uint256 quorumVotes;      // Required quorum
    mapping(address => Receipt) receipts;  // Voter receipts
}
```

---

## 4. Voting Mechanics

### 4.1 Voting Weight Calculation

**Base Weight Formula:**

```
VotingWeight = DIEM_Staked × TierMultiplier × QuadraticFactor
```

**Tier Multipliers:**

| Tier | DIEM Staked | Multiplier |
|------|-------------|------------|
| Bronze | 1 - 999 | 1.0x |
| Silver | 1,000 - 9,999 | 1.25x |
| Gold | 10,000 - 99,999 | 1.5x |
| Platinum | 100,000 - 999,999 | 2.0x |
| Diamond | 1,000,000+ | 3.0x |

**Quadratic Factor (reduces whale dominance):**

```
QuadraticFactor = sqrt(DIEM_Staked / 1000)
```

**Example Calculations:**

| Staked DIEM | Tier | Raw Weight | Quadratic Factor | Final Weight |
|-------------|------|------------|------------------|--------------|
| 1,000 | Silver | 1,250 | 1.0 | 1,250 |
| 10,000 | Gold | 15,000 | 3.16 | 47,400 |
| 100,000 | Platinum | 200,000 | 10.0 | 2,000,000 |
| 1,000,000 | Diamond | 3,000,000 | 31.62 | 94,860,000 |

### 4.2 Voting Options

| Option | Description | Weight Impact |
|--------|-------------|---------------|
| FOR | Support the proposal | +VotingWeight |
| AGAINST | Oppose the proposal | -VotingWeight (reduces quorum denominator) |
| ABSTAIN | Participate but take no position | +VotingWeight (counts toward quorum) |

### 4.3 Vote Casting Rules

1. **One Person, One Vote**: Each address casts once per proposal
2. **Lockup Period**: Votes are locked for the duration of voting + 1 day
3. **Change Allowed**: Voters can change votes until voting period ends
4. **Self-delegate**: Voting with own tokens counts as self-delegation

### 4.4 Vote Delegation

```
┌─────────────────────────────────────────────────────────────┐
│                    DELEGATION CHAIN                         │
│                                                             │
│  Token Holder A ──(delegate)──> Holder B ──(redelegate)──> C │
│       │                               │                      │
│       │                               │                      │
│    500 DIEM                       5,000 DIEM                  │
│  (Bronze, 1x)                    (Gold, 1.5x)                │
│                                                             │
│  Result: C has combined voting power:                       │
│    500 × 1.0 + 5,000 × 1.5 = 8,000 raw weight                │
│    Quadratic correction applied at execution                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Quorum & Thresholds

### 5.1 Quorum Requirements

Quorum is calculated as a percentage of **total DIEM staked** (not total supply):

```
QuorumRequired = max(baseQuorum, minQuorumPercentage × totalStaked)
```

**Base Quorum by Category:**

| Category | Base Quorum | Min Quorum | Max Quorum |
|----------|-------------|------------|------------|
| Protocol Changes | 15% | 10% | 25% |
| Treasury Usage | 20% | 15% | 30% |
| Parameter Tuning | 10% | 5% | 20% |
| Social Norms | 5% | 3% | 15% |

**Quorum Adjustment Formula:**

```
# If voter turnout is low, minimum quorum is raised to prevent low-quality decisions
adjustedQuorum = baseQuorum + (lowTurnoutBonus × (1 - participationRate))
where:
  lowTurnoutBonus = 5%
  participationRate = (votesCast / eligibleVoters)
```

### 5.2 Threshold Requirements

**Threshold = Minimum percentage of FOR votes to pass**

| Category | Threshold | Explanation |
|----------|-----------|-------------|
| Protocol Changes | 60% | Significant changes require clear majority |
| Treasury Usage | 55% | Fund allocation needs reasonable consensus |
| Parameter Tuning | 51% | Tuning adjustments are routine |
| Social Norms | 50% + 1 | Simple majority for norms |

### 5.3 Combined Pass/Fail Logic

```
A proposal PASSES if:
  1. forVotes > againstVotes           (majority rule)
  2. forVotes >= threshold × totalVotes (threshold met)
  3. (forVotes + againstVotes + abstainVotes) >= quorumRequired (quorum met)

A proposal FAILS if any condition is false
```

### 5.4 Time-based Threshold Adjustment

```
# Proposals that attract more voters over time get reduced threshold
# This prevents long-running proposals from being stuck

effectiveThreshold = baseThreshold
  if (participationRate > 0.5):
    effectiveThreshold = baseThreshold × (1 - (participationRate - 0.5))
  # Minimum threshold is baseThreshold × 0.8
```

---

## 6. Delegation System

### 6.1 Delegation Types

| Type | Description | Use Case |
|------|-------------|----------|
| Direct Delegate | Tokens delegated to a single address | Active governance participants |
| Multi-delegate | Tokens split across multiple delegates | Diverse governance exposure |
| Liquid Delegation | Delegation via smart contract | Protocol-level delegation |
| Timelocked Delegate | Delegate changes subject to delay | Prevent flash loan attacks |

### 6.2 Delegation Rules

```
1. Minimum delegation: 100 DIEM
2. Delegation activates after 1 block confirmation
3. Delegation does NOT transfer tokens - only voting power
4. Delegated votes count toward both delegate's weight AND voter's accountability
5. Delegates can cast votes on behalf of delegators OR
   delegators can override and vote directly
```

### 6.3 Delegate Performance Tracking

```solidity
struct DelegateProfile {
    address delegate;
    uint256 totalDelegatedPower;
    uint256 proposalsVotedOn;
    uint256 votesFor;
    uint256 votesAgainst;
    uint256 votesAbstained;
    uint256 delegateCommission;  // % of voting rewards shared
    bool isSlashed;
}
```

### 6.4 Delegation Metadata (x402)

```json
{
  "delegate_action": {
    "type": "redelegate",
    "from": "0x...",
    "to": "0x...",
    "amount": 50000,
    "timestamp": 1700000000,
    "effective_after_blocks": 1
  }
}
```

---

## 7. Proposal Categories

### 7.1 Category Specifications

#### Category 1: Protocol Changes

**Description:** Core smart contract upgrades, new feature additions, architectural changes.

**Examples:**
- Upgrading DIEM token contract
- Adding new proposal types
- Changing voting algorithm parameters
- Integrating new external protocols

**Governance Parameters:**
- Quorum: 15%
- Threshold: 60%
- Timelock: 72 hours (3 days)
- Deposit: 1,000 DIEM (x402)

#### Category 2: Treasury Usage

**Description:** Allocation and management of community funds.

**Examples:**
- Grant disbursements
- Team compensation
- Ecosystem fund deployment
- Liquidity mining incentives

**Governance Parameters:**
- Quorum: 20%
- Threshold: 55%
- Timelock: 24 hours (1 day)
- Deposit: 500 DIEM (x402)

**Additional Rules:**
- Single transaction limit: 50M DIEM
- Monthly treasury outflow limit: 200M DIEM
- Multi-sig required for >10M DIEM

#### Category 3: Parameter Tuning

**Description:** Adjustment of existing protocol parameters.

**Examples:**
- Changing quorum thresholds
- Adjusting voting periods
- Modifying tier multipliers
- Updating slash percentages

**Governance Parameters:**
- Quorum: 10%
- Threshold: 51%
- Timelock: 12 hours
- Deposit: 100 DIEM (x402)

**Bounds:**
- No single parameter change > 50%
- No change to affected parameters within 7 days

#### Category 4: Social Norms

**Description:** Community standards, guidelines, and non-technical decisions.

**Examples:**
- Code of conduct enforcement
- Community mission statement
- Partnership approvals
- Trademark usage policies

**Governance Parameters:**
- Quorum: 5%
- Threshold: 50% + 1 vote
- Timelock: 6 hours
- Deposit: 50 DIEM (x402)

### 7.2 Category Detection

```solidity
enum Category {
    PROTOCOL_CHANGES,
    TREASURY_USAGE,
    PARAMETER_TUNING,
    SOCIAL_NORMS
}

function detectCategory(
    address[] memory targets,
    bytes[] memory calldatas
) internal pure returns (Category) {
    // Analyze calldata to determine category
    // Protocol changes: target is governance contract or core contracts
    // Treasury: target is Treasury contract with large value
    // Parameters: target is parameter store contract
    // Social: everything else (no on-chain changes)
}
```

---

## 8. Slash Rules & Enforcement

### 8.1 Slashable Offenses

| Offense | Description | Slash Amount |
|---------|-------------|---------------|
| Proposal Spam | Creating low-quality proposals repeatedly | 100-500 DIEM |
| Bad Faith Voting | Voting against well-performing proposals consistently | 50-200 DIEM |
| Double Voting | Casting vote twice on same proposal | 500 DIEM + loss of voting rights |
| Delegate Fraud | Delegate voting opposite to delegated instructions | 200 DIEM |
| Timelock Violation | Executing proposal before timelock expires | 1000 DIEM + proposal revert |

### 8.2 Slash Detection

```solidity
struct SlashEvent {
    uint256 timestamp;
    address offender;
    uint256 offenseType;
    uint256 slashAmount;
    bytes32 evidenceHash;  // IPFS reference
    bool contested;
}
```

**Detection Mechanisms:**

1. **Automated Monitoring**
   - Proposal quality scoring (off-chain AI assessment)
   - Voting pattern anomaly detection
   - Cross-proposal voting analysis

2. **Community Reporting**
   - Anyone can file a slash request
   - Requires 100 DIEM deposit (refundable if valid)
   - Slash committee reviews within 48 hours

3. **Slashing Process**
   ```
   Report Filed → Committee Review → Vote by DIEM Holders → Slash Executed
   ```

### 8.3 Slash Execution

```
Slashing Flow:
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  Slash Proposed                                         │
│       │                                                 │
│       ├──-> If approved by committee OR                 │
│       │    50% + 1 of voting power:                     │
│       │                                                 │
│       │    GovernorContract.call:                       │
│       │      DIEMToken.slash(address, amount)          │
│       │                                                 │
│       │    slashedTokens -= amount                      │
│       │    slashedRecipient = CommunityTreasury         │
│       │                                                 │
│       └──-> If rejected:                               │
│            Reporter loses 100 DIEM deposit             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 8.4 Appeal Process

1. Offender can appeal within 7 days
2. Appeal requires 200 DIEM deposit
3. 3-panel arbitration by randomly selected token holders
4. Appeal decision is final and cannot be slashed

---

## 9. Emergency Governance

### 9.1 Emergency Types

| Type | Trigger | Response Time |
|------|---------|---------------|
| Critical Bug | Smart contract vulnerability | Immediate (0h timelock) |
| Security Breach | Funds at risk | 1 hour timelock |
| Flash Crash | Economic parameter failure | 6 hour timelock |
| Governance Attack | Hostile takeover attempt | 12 hour timelock |

### 9.2 Emergency Proposal Process

```
Normal Process:                          Emergency Process:
                                         
DRAFT (7 days)                          DRAFT (0-24 hours)
    │                                       │
    ▼                                       ▼
ACTIVE (7 days)                         ACTIVE (0-1 hours)
    │                                       │
    ▼                                       ▼
VOTING (7 days) ───────────────────────> VOTING (6-48 hours)
    │                                       │
    ▼                                       ▼
PASSED (48h timelock)                   PASSED (0-6h timelock)
    │                                       │
    ▼                                       ▼
EXECUTED                                 EXECUTED
```

### 9.3 Emergency Roles

**Security Council (5 members):**
- Multi-sig wallet with 3/5 approval requirement
- Can propose and fast-track emergency proposals
- Can execute critical bug fixes without vote (fallback)
- Members voted in by token holders (2-year terms)
- Rotation: 1 member leaves every 6 months

**Veto Power:**
```
Emergency Action → Security Council Veto (3/5 signatures) → Action Cancelled
                         │
                         │ OR
                         │
                    80% token holder vote to remove Security Council member
```

### 9.4 Emergency Governor Contract

```solidity
contract EmergencyGovernor {
    uint256 public constant EMERGENCY_QUORUM = 40;  // 40% of staked
    uint256 public constant EMERGENCY_THRESHOLD = 66;  // 66% FOR votes
    uint256 public constant EMERGENCY_VOTING_PERIOD = 6 hours;
    uint256 public constant EMERGENCY_TIMELOCK = 1 hours;
    
    // Immediate execution for critical bugs
    bool public isCriticalEmergency;
    
    function proposeEmergency(
        address[] memory targets,
        bytes[] memory calldatas,
        string memory description,
        bool critical
    ) external returns (uint256) {
        require(hasEmergencyRole(msg.sender), "NOT_SECURITY_COUNCIL");
        // ... create proposal with emergency parameters
    }
}
```

### 9.5 Override Mechanism

**Token Holder Veto:**
- If Security Council acts maliciously, 60% of token holders can override
- Override requires 7-day voting period (no timelock)
- Council member is removed and replaced

```
Override Flow:
1. 60% of total staked DIEM votes to override
2. Security Council action is reverted
3. Council member is permanently banned
4. New council member elected via emergency election
```

---

## 10. Timelock & Execution

### 10.1 Timelock Specifications

| Category | Timelock Delay | Execution Window |
|----------|---------------|------------------|
| Protocol Changes | 72 hours | 24 hours |
| Treasury Usage | 24 hours | 48 hours |
| Parameter Tuning | 12 hours | 24 hours |
| Social Norms | 6 hours | 24 hours |
| Emergency (Critical) | 1 hour | 12 hours |
| Emergency (Standard) | 6 hours | 12 hours |

### 10.2 Timelock Queue

```solidity
struct TimelockTransaction {
    address target;
    uint256 value;
    bytes data;
    uint256 queuedAt;
    uint256 executeAfter;  // executeAfter = queuedAt + delay
    bytes32 predecessor;  // Must execute this tx first (optional)
    bool executed;
    bool cancelled;
}
```

### 10.3 Execution Rules

```
1. Transaction must be in queue for >= delay period
2. If predecessor specified, predecessor must be executed first
3. Execution window must not have expired (executeBefore > block.timestamp)
4. Caller must have EXECUTOR_ROLE in access control
```

### 10.4 Timelock Matrix

```
┌────────────────────────────┬────────┬────────┬────────┬─────────────┐
│ Category                    │ Delay  │ Window │ Cancel │ Retry       │
├────────────────────────────┼────────┼────────┼────────┼─────────────┤
│ Protocol Changes            │ 72h    │ 24h    │ Yes    │ 3 attempts  │
│ Treasury Usage              │ 24h    │ 48h    │ Yes    │ 5 attempts  │
│ Parameter Tuning            │ 12h    │ 24h    │ Yes    │ 5 attempts  │
│ Social Norms                │ 6h     │ 24h    │ Yes    │ 3 attempts  │
│ Emergency (Critical)        │ 1h     │ 12h    │ No     │ 1 attempt   │
│ Emergency (Standard)        │ 6h     │ 12h    │ No     │ 3 attempts  │
└────────────────────────────┴────────┴────────┴────────┴─────────────┘
```

### 10.5 Grace Period and Expiration

```
If execution window expires:
1. Transaction is moved to EXPIRED state
2. Transaction cannot be executed
3. Proposer may need to re-submit (loses deposit)
4. Automatic refund of deposit after 30 days
```

---

## 11. On-Chain Integration (Base)

### 11.1 Contract Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    BASE BLOCKCHAIN                               │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              GOVERNOR BRAVO (Fork of Compound)             │  │
│  │  ┌────────────────────────────────────────────────────┐   │  │
│  │  │                   Governor Contract                  │   │  │
│  │  │  - Proposal creation and state management           │   │  │
│  │  │  - Voting logic and vote casting                    │   │  │
│  │  │  - Quorum and threshold calculations               │   │  │
│  │  │  - Timelock integration                            │   │  │
│  │  └────────────────────────────────────────────────────┘   │  │
│  │                                                              │  │
│  │  ┌────────────────────────────────────────────────────┐   │  │
│  │  │                 Timelock Contract                   │   │  │
│  │  │  - Transaction queuing                            │   │  │
│  │  │  - Delay enforcement                               │   │  │
│  │  │  - Execution orchestration                         │   │  │
│  │  └────────────────────────────────────────────────────┘   │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│  ┌───────────────────────────┼───────────────────────────────┐  │
│                              │                                   │
│  ┌─────────────────┐  ┌──────┴────────┐  ┌─────────────────┐   │
│  │  DIEM Token     │  │ Delegation   │  │   Slash         │   │
│  │  (ERC-20Votes)  │  │   Registry   │  │   Engine        │   │
│  └─────────────────┘  └──────────────┘  └─────────────────┘   │
│                                                                  │
│  ┌─────────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │  Treasury       │  │  x402        │  │   Forum         │   │
│  │  Contract       │  │  Payment     │  │   Integration   │   │
│  └─────────────────┘  └──────────────┘  └─────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 11.2 Base-specific Optimizations

**Gas Optimization:**
- Use Base's lower gas costs for voting
- Batch vote casting for multi-proposal voting
- Event-based vote tracking instead of state storage

**Bridge Integration:**
```
Ethereum (L1) ──[Canonical Bridge]──> Base (L2)
     │                                    │
     │ DIEM token bridge for              │ Native DIEM on Base
     │ cross-chain governance              │ for voting
     │                                    │
     └────────────────────────────────────┘
                    │
                    ▼
         Cross-chain proposals can
         reference both L1 and L2 state
```

### 11.3 Chain-specific Constants (Base)

```solidity
// Base chain parameters
uint256 public constant BLOCK_TIME = 2;  // seconds
uint256 public constant DAY_BLOCKS = 43200;  // 86400 / 2

// Governor settings
uint256 public constant VOTING_PERIOD = 5 days;  // ~216,000 blocks
uint256 public constant PROPOSAL_THRESHOLD = 100000e18;  // 100k DIEM
uint256 public constant QUORUM_VOTES = 400000e18;  // 400k DIEM (4% of staking)

// Timelock settings
uint256 public constant TIMELOCK_DELAY = 2 days;

// Dynamic quorum settings
uint256 public constant MIN_QUORUM = 200000e18;  // 200k DIEM
uint256 public constant MAX_QUORUM = 10000000e18;  // 10M DIEM
```

### 11.4 Events & Indexing

```solidity
// Key events for off-chain indexing
event ProposalCreated(
    uint256 id,
    address proposer,
    address[] targets,
    uint256[] values,
    string description,
    Category category
);

event VoteCast(
    uint256 proposalId,
    address voter,
    uint8 support,  // 0=against, 1=for, 2=abstain
    uint256 weight,
    string reason
);

event ProposalExecuted(uint256 id, address executor);

event TimelockQueued(
    bytes32 txHash,
    address target,
    uint256 value,
    bytes data,
    uint256 executeAfter
);

event Slashed(
    address offender,
    uint256 amount,
    uint256 offenseType
);
```

---

## 12. x402 Payment Integration

### 12.1 Payment Flow for Deposits

```solidity
interface x402PaymentGateway {
    function payForGovernanceAction(
        string memory action,
        uint256 amount,
        bool refundable
    ) external payable returns (bytes32 receiptId);
    
    function getDepositRequirement(
        Category category,
        address proposer
    ) external view returns (uint256 deposit, bool waiveEligible);
}
```

### 12.2 x402 Deposit Structure

```json
{
  "x402-deposit": {
    "action": "create_proposal",
    "token": "DIEM",
    "amount": 1000,
    "refundable": true,
    "refund_condition": "proposal_reaches_voting",
    "recipient": "governance_treasury",
    "expires": 172800,  // 48 hours to reach voting
    "metadata": {
      "category": "protocol_changes",
      "ipfs_hash": "QmXxx...",
      "proposer_tier": "gold"
    }
  }
}
```

### 12.3 Deposit Refund Logic

```
Refund Eligibility:
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Proposal reaches VOTING state ──────────> Full deposit      │
│                                            refunded         │
│                                                             │
│  Proposal fails quorum ─────────────────> 80% refunded      │
│                                          20% to treasury    │
│                                                             │
│  Proposal cancelled by proposer ────────> 50% refunded      │
│                                          50% slashed        │
│                                                             │
│  Bad faith voting detected ─────────────> 0% refunded       │
│                                          Full to treasury   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 12.4 x402 Waiver System

**Auto-waiver Qualifying Conditions:**
1. Proposer staked >= 1M DIEM (no deposit needed)
2. Proposer is whitelisted delegate (no deposit needed)
3. Community airdrop recipient (deposit waived for first 3 proposals)
4. Emergency proposal (deposit waived, x402 header marks critical)

```solidity
function checkWaiverEligibility(
    address proposer,
    Category category
) public view returns (bool waiveEligible, uint256 waiverTier) {
    uint256 staked = DIEMToken.balanceOf(proposer) + 
                     DIEMToken.delegatedBalance(proposer);
    
    if (staked >= 1_000_000e18) return (true, 1);  // Diamond tier - full waiver
    if (delegationRegistry.isWhitelistedDelegate(proposer)) return (true, 2);
    if (airdropClaimedCount[proposer] < 3) return (true, 3);
    
    return (false, 0);
}
```

---

## 13. Smart Contract Pseudocode

### 13.1 DIEM Token (ERC-20Votes Extension)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20FlashMint.sol";

contract DIEMToken is ERC20, ERC20Votes, ERC20FlashMint {
    
    // Constants
    uint256 public constant INITIAL_SUPPLY = 1_000_000_000e18;  // 1B tokens
    
    // State
    mapping(address => uint256) public slashes;
    mapping(address => address) public delegates;
    
    // Roles
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant SLASHER_ROLE = keccak256("SLASHER_ROLE");
    
    constructor() ERC20("DIEM", "DIEM") {
        _mint(msg.sender, INITIAL_SUPPLY);
    }
    
    function mint(address to, uint256 amount) external {
        require(hasRole(MINTER_ROLE, msg.sender), "NOT_MINTER");
        _mint(to, amount);
    }
    
    function slash(address account, uint256 amount) external {
        require(hasRole(SLASHER_ROLE, msg.sender), "NOT_SLASHER");
        
        uint256 currentSlashed = slashes[account];
        slashes[account] = currentSlashed + amount;
        
        // Progressive slash - more slashing = higher percentage burned
        uint256 burnPercentage = Math.min(currentSlashed * 1e18 / balanceOf(account), 50e18);
        uint256 toBurn = (amount * burnPercentage) / 1e18;
        uint256 toTreasury = amount - toBurn;
        
        _burn(account, toBurn);
        // toTreasury goes to community treasury via transfer
        
        emit Slashed(account, amount, toBurn, toTreasury);
    }
    
    // Override to support quadratic voting calculation
    function getVotes(address account) public view override returns (uint256) {
        uint256 rawVotes = super.getVotes(account);
        uint256 quadraticFactor = sqrt(rawVotes / 1e18);
        return rawVotes * quadraticFactor / 1e9;  // Normalize back
    }
    
    // EIP-712 for vote signing
    function castVoteBySig(
        uint256 proposalId,
        uint8 support,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        bytes32 domainSeparator = _domainSeparator();
        bytes32 hash = keccak256(abi.encode(DOMAIN, proposalId, support));
        address signer = ecrecover(hash, v, r, s);
        _castVote(signer, proposalId, support);
    }
}
```

### 13.2 Governor Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";

contract ThePeoplesAgentGovernor is 
    Governor, 
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    GovernorTimelockControl
{
    // Structs
    enum Category { PROTOCOL_CHANGES, TREASURY_USAGE, PARAMETER_TUNING, SOCIAL_NORMS }
    
    struct ProposalConfig {
        Category category;
        uint256 deposit;
        uint256 quorumFraction;
        uint256 thresholdFraction;
        uint256 timelockDelay;
    }
    
    // Constants
    uint256 public constant FOR_VOTES = 1;
    uint256 public constant AGAINST_VOTES = 0;
    uint256 public constant ABSTAIN_VOTES = 2;
    
    // State
    mapping(Category => ProposalConfig) public categoryConfigs;
    mapping(uint256 => Category) public proposalCategories;
    mapping(address => uint256) public voterSlashBalance;
    
    // Slash Engine
    address public slashTreasury;
    uint256 public constant SLASH_PERCENTAGE = 20;
    
    // x402 Integration
    address public paymentGateway;
    
    // Events
    event ProposalCreatedWithCategory(
        uint256 proposalId,
        Category category,
        address proposer
    );
    event DepositRefunded(address proposer, uint256 amount);
    event SlashingApplied(address voter, uint256 amount);
    
    constructor(
        IVotes _token,
        TimelockController _timelock,
        address _paymentGateway
    ) 
        Governor("ThePeoplesAgentGovernor")
        GovernorSettings(5 days, 1 days, 10)
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(4)  // 4% of votes
        GovernorTimelockControl(_timelock)
    {
        paymentGateway = _paymentGateway;
        slashTreasury = msg.sender;
        
        // Initialize category configs
        categoryConfigs[Category.PROTOCOL_CHANGES] = ProposalConfig({
            category: Category.PROTOCOL_CHANGES,
            deposit: 1000e18,
            quorumFraction: 15,  // 15%
            thresholdFraction: 60,  // 60%
            timelockDelay: 3 days
        });
        
        categoryConfigs[Category.TREASURY_USAGE] = ProposalConfig({
            category: Category.TREASURY_USAGE,
            deposit: 500e18,
            quorumFraction: 20,
            thresholdFraction: 55,
            timelockDelay: 1 days
        });
        
        categoryConfigs[Category.PARAMETER_TUNING] = ProposalConfig({
            category: Category.PARAMETER_TUNING,
            deposit: 100e18,
            quorumFraction: 10,
            thresholdFraction: 51,
            timelockDelay: 12 hours
        });
        
        categoryConfigs[Category.SOCIAL_NORMS] = ProposalConfig({
            category: Category.SOCIAL_NORMS,
            deposit: 50e18,
            quorumFraction: 5,
            thresholdFraction: 51,
            timelockDelay: 6 hours
        });
    }
    
    // Proposal Creation with x402 payment
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description,
        Category category
    ) public payable override returns (uint256) {
        ProposalConfig memory config = categoryConfigs[category];
        
        // x402 payment processing
        if (msg.value > 0 || config.deposit > 0) {
            _processDeposit(config.deposit, category);
        }
        
        // Create proposal
        uint256 proposalId = super.propose(
            targets, 
            values, 
            calldatas, 
            description
        );
        
        proposalCategories[proposalId] = category;
        
        // Queue timelock for passed proposals
        // Note: actual timelock creation happens in _castVote for first vote
        
        emit ProposalCreatedWithCategory(proposalId, category, msg.sender);
        
        return proposalId;
    }
    
    function _processDeposit(uint256 deposit, Category category) internal {
        // Check waiver eligibility
        (bool waiveEligible, ) = _checkWaiver(msg.sender, category);
        
        if (!waiveEligible && deposit > 0) {
            // x402 payment integration
            if (paymentGateway != address(0)) {
                (bool success, ) = paymentGateway.call{value: deposit}("");
                require(success, "x402 payment failed");
            } else {
                // Direct deposit to contract
                IERC20(address(token)).transferFrom(msg.sender, address(this), deposit);
            }
            
            deposits[msg.sender][category] += deposit;
        }
    }
    
    function _checkWaiver(address proposer, Category category) 
        internal view returns (bool waiveEligible, uint256 tier) 
    {
        uint256 staked = token.getVotes(proposer);
        
        if (staked >= 1_000_000e18) return (true, 4);  // Diamond tier
        if (isWhitelistedDelegate[proposer]) return (true, 3);
        if (proposalCounts[proposer] < 3) return (true, 2);
        
        return (false, 0);
    }
    
    // Voting with quadratic weight calculation
    function castVote(
        uint256 proposalId,
        uint8 support
    ) public override returns (uint256) {
        return _castVote(msg.sender, proposalId, support, "");
    }
    
    function castVoteWithReason(
        uint256 proposalId,
        uint8 support,
        string memory reason
    ) public override returns (uint256) {
        return _castVote(msg.sender, proposalId, support, reason);
    }
    
    function _castVote(
        address voter,
        uint256 proposalId,
        uint8 support,
        string memory reason
    ) internal override returns (uint256) {
        uint256 weight = _get VotingWeight(voter);
        uint256 votes = super._castVote(voter, proposalId, support);
        
        // Apply quadratic factor to the cast votes
        uint256 adjustedVotes = _applyQuadraticFactor(votes);
        
        // Update proposal vote counts
        if (support == FOR_VOTES) {
            proposals[proposalId].forVotes += adjustedVotes;
        } else if (support == AGAINST_VOTES) {
            proposals[proposalId].againstVotes += adjustedVotes;
        } else {
            proposals[proposalId].abstainVotes += adjustedVotes;
        }
        
        emit VoteCast(voter, proposalId, support, adjustedVotes, reason);
        
        return adjustedVotes;
    }
    
    function _getVotingWeight(address voter) internal view returns (uint256) {
        uint256 rawVotes = token.getVotes(voter);
        
        // Get tier multiplier based on staked amount
        uint256 tierMultiplier = _getTierMultiplier(voter);
        
        // Calculate quadratic factor
        uint256 quadraticFactor = sqrt(rawVotes / 1e18);
        
        return rawVotes * tierMultiplier * quadraticFactor / 1e18;
    }
    
    function _getTierMultiplier(address voter) internal view returns (uint256) {
        uint256 staked = token.getVotes(voter);
        
        if (staked >= 1_000_000e18) return 3e18;  // Diamond: 3x
        if (staked >= 100_000e18) return 2e18;   // Platinum: 2x
        if (staked >= 10_000e18) return 15e17;   // Gold: 1.5x
        if (staked >= 1_000e18) return 125e15;   // Silver: 1.25x
        return 1e18;                              // Bronze: 1x
    }
    
    function _applyQuadraticFactor(uint256 votes) internal pure returns (uint256) {
        // QF = sqrt(votes / 1000)
        // This reduces whale dominance while maintaining meaningful weight
        return sqrt(votes / 1000);
    }
    
    // Dynamic quorum calculation
    function quorum(uint256 proposalId) public view override returns (uint256) {
        Category category = proposalCategories[proposalId];
        uint256 baseQuorum = categoryConfigs[category].quorumFraction;
        
        uint256 totalStaked = token.getTotalLocked();
        uint256 minQuorum = (totalStaked * baseQuorum) / 100;
        
        // Dynamic adjustment based on turnout
        uint256 totalVotes = proposals[proposalId].forVotes + 
                            proposals[proposalId].againstVotes +
                            proposals[proposalId].abstainVotes;
        
        uint256 participationRate = totalVotes / totalStaked;
        
        // If participation is low, raise quorum minimum
        if (participationRate < 20) {
            uint256 adjustedQuorum = minQuorum * 120 / 100;  // +20%
            return Math.min(adjustedQuorum, totalStaked * 25 / 100);  // Max 25%
        }
        
        return minQuorum;
    }
    
    // Proposal state override for category-based timing
    function state(uint256 proposalId) 
        public view override(Governor, GovernorTimelockControl) 
        returns (ProposalState) 
    {
        ProposalState currentState = super.state(proposalId);
        
        if (currentState == ProposalState.Succeeded) {
            Category category = proposalCategories[proposalId];
            uint256 delay = categoryConfigs[category].timelockDelay;
            
            // Queue with category-specific delay
            timelock.queueTransaction(
                proposals[proposalId].target,
                proposals[proposalId].value,
                proposals[proposalId].data,
                delay
            );
            
            return ProposalState.Queued;
        }
        
        return currentState;
    }
    
    // Slash voters for bad behavior
    function slashBadActors(address[] memory badActors) external onlyGovernance {
        for (uint256 i = 0; i < badActors.length; i++) {
            address actor = badActors[i];
            uint256 slashAmount = voterSlashBalance[actor];
            
            if (slashAmount > 0) {
                // Call DIEM token slash
                DIEMToken(token).slash(actor, slashAmount);
                voterSlashBalance[actor] = 0;
                
                emit SlashingApplied(actor, slashAmount);
            }
        }
    }
}
```

### 13.3 Timelock Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/governance/TimelockControl.sol";

contract ThePeoplesAgentTimelock is TimelockControl {
    
    // Execution windows per category
    mapping(bytes32 => uint256) public executionWindows;
    mapping(bytes32 => uint256) public queuedAt;
    
    // Constants
    uint256 public constant GRACE_PERIOD = 14 days;
    
    constructor(
        uint256 minDelay,
        address[] memory proposers,
        address[] memory executors
    ) TimelockController(minDelay, proposers, executors) {
        // Category default delays
        // These can be updated by governance
    }
    
    function updateDelayMapping(
        bytes32 categoryHash,
        uint256 newDelay
    ) external onlyGovernance {
        delayByCategory[categoryHash] = newDelay;
    }
    
    function queueTransaction(
        address target,
        uint256 value,
        bytes memory data,
        uint256 delay
    ) public onlyGovernance returns (bytes32) {
        bytes32 txHash = keccak256(abi.encode(target, value, data, delay));
        
        queuedAt[txHash] = block.timestamp;
        executionWindows[txHash] = delay + GRACE_PERIOD;
        
        // Queue in base TimelockController
        _queueTransaction(target, value, data, delay);
        
        emit TimelockQueued(txHash, target, value, data, delay);
        
        return txHash;
    }
    
    function executeTransaction(
        address target,
        uint256 value,
        bytes memory data,
        bytes32 predecessor
    ) public payable override onlyExecutor returns (bytes32) {
        bytes32 txHash = keccak256(abi.encode(target, value, data, 0));
        
        // Check execution window hasn't expired
        if (block.timestamp > queuedAt[txHash] + executionWindows[txHash]) {
            emit TimelockExpired(txHash);
            revert("EXECUTION_WINDOW_EXPIRED");
        }
        
        return _executeTransaction(target, value, data, predecessor);
    }
}
```

### 13.4 Slash Engine Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract SlashEngine is AccessControl {
    
    bytes32 public constant SLASHER_ROLE = keccak256("SLASHER_ROLE");
    bytes32 public constant ARBITER_ROLE = keccak256("ARBITER_ROLE");
    
    enum OffenseType {
        PROPOSAL_SPAM,
        BAD_FAITH_VOTING,
        DOUBLE_VOTING,
        DELEGATE_FRAUD,
        TIMELOCK_VIOLATION
    }
    
    struct SlashRequest {
        address offender;
        OffenseType offense;
        uint256 evidenceHash;
        uint256 proposedSlashAmount;
        address reporter;
        bool resolved;
        uint256 votesForSlash;
        uint256 votesAgainstSlash;
    }
    
    // State
    mapping(uint256 => SlashRequest) public slashRequests;
    uint256 public slashRequestCount;
    
    mapping(address => uint256) public offenses;
    mapping(address => uint256) public totalSlashed;
    
    // Configuration
    uint256 public constant REPORT_DEPOSIT = 100e18;
    uint256 public constant APPEAL_DEPOSIT = 200e18;
    uint256 public constant RESOLUTION_PERIOD = 48 hours;
    uint256 public constant SLASH_APPROVAL_THRESHOLD = 50;  // 50% of votes
    
    // Slash amounts by offense
    mapping(OffenseType => uint256) public slashAmounts;
    
    // Events
    event SlashReported(
        uint256 requestId,
        address offender,
        OffenseType offense,
        uint256 proposedSlash
    );
    event SlashResolved(
        uint256 requestId,
        bool approved,
        uint256 actualSlash
    );
    event AppealFiled(uint256 requestId, address appellant);
    
    constructor() {
        slashAmounts[OffenseType.PROPOSAL_SPAM] = 500e18;
        slashAmounts[OffenseType.BAD_FAITH_VOTING] = 200e18;
        slashAmounts[OffenseType.DOUBLE_VOTING] = 500e18;
        slashAmounts[OffenseType.DELEGATE_FRAUD] = 200e18;
        slashAmounts[OffenseType.TIMELOCK_VIOLATION] = 1000e18;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
    
    function reportSlash(
        address offender,
        OffenseType offense,
        bytes32 evidenceHash
    ) external returns (uint256 requestId) {
        // Require reporter deposit
        IERC20(diemToken).transferFrom(msg.sender, address(this), REPORT_DEPOSIT);
        
        requestId = slashRequestCount++;
        
        slashRequests[requestId] = SlashRequest({
            offender: offender,
            offense: offense,
            evidenceHash: evidenceHash,
            proposedSlash: slashAmounts[offense],
            reporter: msg.sender,
            resolved: false,
            votesForSlash: 0,
            votesAgainstSlash: 0
        });
        
        emit SlashReported(requestId, offender, offense, slashAmounts[offense]);
    }
    
    function voteOnSlash(
        uint256 requestId,
        bool supportSlash
    ) external {
        SlashRequest storage request = slashRequests[requestId];
        require(!request.resolved, "ALREADY_RESOLVED");
        
        uint256 voterWeight = diemToken.getVotes(msg.sender);
        
        if (supportSlash) {
            request.votesForSlash += voterWeight;
        } else {
            request.votesAgainstSlash += voterWeight;
        }
    }
    
    function resolveSlashRequest(uint256 requestId) external {
        SlashRequest storage request = slashRequests[requestId];
        require(!request.resolved, "ALREADY_RESOLVED");
        
        uint256 totalVotes = request.votesForSlash + request.votesAgainstSlash;
        uint256 approvalRate = (totalVotes > 0) 
            ? (request.votesForSlash * 100) / totalVotes 
            : 0;
        
        if (approvalRate >= SLASH_APPROVAL_THRESHOLD) {
            // Slash approved
            _executeSlash(request.offender, request.proposedSlash);
            request.resolved = true;
            
            // Refund reporter
            IERC20(diemToken).transfer(request.reporter, REPORT_DEPOSIT);
            
            emit SlashResolved(requestId, true, request.proposedSlash);
        } else {
            // Slash rejected - reporter loses deposit
            request.resolved = true;
            
            // Burn reporter deposit (send to treasury)
            emit SlashResolved(requestId, false, 0);
        }
    }
    
    function _executeSlash(address offender, uint256 amount) internal {
        // Check for progressive slash multiplier
        uint256 offenseCount = offenses[offender];
        uint256 progressiveMultiplier = 1 + (offenseCount * 50 / 100);  // +50% per offense
        
        uint256 finalSlash = amount * progressiveMultiplier / 1e18;
        
        // Cap at 50% of offender's balance
        uint256 maxSlash = diemToken.balanceOf(offender) * 50 / 100;
        finalSlash = Math.min(finalSlash, maxSlash);
        
        offenses[offender]++;
        totalSlashed[offender] += finalSlash;
        
        // Call token slash
        DIEMToken(diemToken).slash(offender, finalSlash);
        
        // Transfer to treasury
        IERC20(diemToken).transfer(treasury, finalSlash);
    }
    
    function appealSlash(
        uint256 requestId,
        string memory reason
    ) external {
        SlashRequest storage request = slashRequests[requestId];
        require(request.resolved, "NOT_YET_RESOLVED");
        require(msg.sender == request.offender, "NOT_OFFENDER");
        
        // Require appeal deposit
        IERC20(diemToken).transferFrom(msg.sender, address(this), APPEAL_DEPOSIT);
        
        emit AppealFiled(requestId, msg.sender);
        
        // 3-panel arbitration (simplified)
        // Real implementation would have randomized arbiter selection
        _arbitrateAppeal(requestId);
    }
}
```

---

## 14. Formulas Reference

### 14.1 Voting Weight Formula

```
VotingWeight = DIEM_Staked × TierMultiplier × √(DIEM_Staked / 1000)
```

**Expanded Form:**
```
VotingWeight = DIEM_Staked × TierMultiplier × sqrt(DIEM_Staked / 1000)
```

**Simplified (without tier):**
```
VotingWeight = DIEM_Staked^1.5 / sqrt(1000)
```

### 14.2 Quadratic Voting Factor

```
QF = √(Votes / Baseline)
```

Where Baseline = 1000 DIEM (configurable)

**Example Values:**
| Votes | QF |
|-------|-----|
| 1,000 | 1.0 |
| 10,000 | 3.16 |
| 100,000 | 10.0 |
| 1,000,000 | 31.62 |

### 14.3 Quorum Calculation

```
QuorumRequired = max(
    MIN_QUORUM,
    min(
        baseQuorum × totalStaked,
        maxQuorum × totalStaked
    )
)
```

**Dynamic Quorum Adjustment:**
```
if (participation < 20%):
    QuorumRequired *= 1.20  // +20% minimum quorum boost
```

### 14.4 Threshold Calculation

```
PassCondition = forVotes > threshold × totalVotes
```

Where threshold varies by category:
- Protocol Changes: 0.60 (60%)
- Treasury Usage: 0.55 (55%)
- Parameter Tuning: 0.51 (51%)
- Social Norms: 0.501 (50%+1)

### 14.5 Timelock Delay Formula

```
ExecutionTime = proposalCreationTime + categoryDelay

where categoryDelay is:
  - Protocol Changes: 72 hours
  - Treasury Usage: 24 hours
  - Parameter Tuning: 12 hours
  - Social Norms: 6 hours
  - Emergency (Critical): 1 hour
  - Emergency (Standard): 6 hours
```

### 14.6 Slash Amount Calculation (Progressive)

```
SlashAmount = baseOffenseAmount × (1 + 0.5 × offenseCount)

Capped at:
  maxSlash = min(slashAmount, balance × 0.5)
```

### 14.7 Delegation Power Aggregation

```
DelegatePower = Σ (delegator_staked × delegator_tier_multiplier)
```

**Example:**
```
Delegator A: 500 DIEM (Bronze, 1x) → 500 votes
Delegator B: 5,000 DIEM (Silver, 1.25x) → 6,250 votes
Delegator C: 50,000 DIEM (Gold, 1.5x) → 75,000 votes

Total Delegate Power = 500 + 6,250 + 75,000 = 81,750 votes
```

---

## Appendix A: Reference Implementations

**Compound Governor:** https://github.com/compound-finance/compound-governance  
**Uniswap Governance:** https://github.com/Uniswap/governance  
**Aave Governance:** https://github.com/aave/governance-v2  

---

## Appendix B: Upgrade Path

1. **Phase 1 (Launch):** Basic Governor with fixed quorum/threshold
2. **Phase 2 (Stabilization):** Implement dynamic quorum
3. **Phase 3 (Security):** Deploy slash engine and arbitration
4. **Phase 4 (Emergency):** Activate security council and emergency powers
5. **Phase 5 (Decentralization):** Remove admin keys entirely

---

**END OF DOCUMENT**

*Vault-Tec is not responsible for any unforeseen governance failures, DAO attacks, or existential dread resulting from decentralized decision-making. Remember: a better future is underground - and on-chain.*

**Document Hash:** `0x[GovernanceSpecV1.0]`  
**Classification:** PUBLIC