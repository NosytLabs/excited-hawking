# The Peoples Agent Governance Rules

**Document Version:** 1.0  
**Effective Date:** 2026-05-23  
**Last Updated:** 2026-05-23

---

## Table of Contents

1. [Proposal Submission Rules](#1-proposal-submission-rules)
2. [Voting Rules](#2-voting-rules)
3. [Public Participation](#3-public-participation)
4. [Slash Conditions](#4-slash-conditions)
5. [Emergency Governance](#5-emergency-governance)
6. [Treasury Rules](#6-treasury-rules)

---

## 1. Proposal Submission Rules

### 1.1 Minimum Deposit Requirement

| Field | Value |
|-------|-------|
| Minimum Deposit | 100 DIEM |
| Deposit Refundable | Yes (if proposal reaches quorum) |
| Deposit Forfeited | If proposal fails to reach quorum |

**Implementation Note:** The deposit is locked upon submission and held in escrow until the proposal's voting period concludes. Deposits are refunded to the proposer if the proposal achieves quorum, regardless of passage outcome.

### 1.2 Title Requirements

| Field | Requirement |
|-------|-------------|
| Maximum Length | 100 characters |
| Character Encoding | UTF-8 |
| Prohibited Content | HTML tags, special control characters |

**Example Valid Titles:**
- `Upgrade DIEM staking reward rate to 12% annually`
- `Fund community grants program Q3 2026`
- `Approve integration with Chainlink oracle network`

**Example Invalid Titles:**
- `<script>alert('xss')</script>Fund treasury` (contains HTML)
- `A proposal to allocate funds from the community treasury to deserving projects that benefit the entire ecosystem and sustainability` (exceeds 100 characters)

### 1.3 Description Requirements

| Field | Requirement |
|-------|-------------|
| Minimum Length | 200 characters |
| Maximum Length | 5,000 characters |
| Markdown Support | Yes (CommonMark subset) |
| Required Sections | Summary, Rationale, Implementation Plan |

**Required Description Structure:**

```
## Summary
[2-3 sentence executive summary of the proposal]

## Rationale
[Detailed explanation of why this proposal benefits the protocol]

## Implementation Plan
[Step-by-step execution plan with timelines]
```

### 1.4 Category Selection

Every proposal MUST specify one of the following categories:

| Category ID | Category Name | Description |
|-------------|---------------|-------------|
| `TREASURY` | Treasury Management | Fund allocation, grants, expenditures |
| `PROTOCOL` | Protocol Upgrade | Smart contract changes, parameter updates |
| `GOVERNANCE` | Governance Process | Voting rules, quorum thresholds, procedures |
| `PARTNERSHIP` | Partnership | Integration proposals, collaborations |
| `SECURITY` | Security | Security audits, vulnerability fixes |
| `COMMUNITY` | Community | Grants, events, outreach programs |

**Validation Rule:** Proposals without a valid category are rejected at submission.

### 1.5 Mandatory Review Period

| Field | Value |
|-------|-------|
| Review Period | 24 hours before voting begins |
| Editable During Review | Yes (within 2-hour edit window) |
| Withdrawable During Review | Yes |

**State Machine:**
```
DRAFT -> SUBMITTED -> REVIEW -> VOTING -> CLOSED -> EXECUTED/REJECTED
                         ^        |
                         |________|
                    (if cancelled)
```

### 1.6 Edit Window After Submission

| Field | Value |
|-------|-------|
| Edit Window Duration | 2 hours after initial submission |
| Editable Fields | Title, Description (not category) |
| Edit Triggers | Resets the 24-hour review period |

**Critical Rule:** Any edit to a submitted proposal automatically resets the review period timer. The 2-hour edit window begins at the time of the first edit and cannot be extended.

### 1.7 Cancel Window

| Field | Value |
|-------|-------|
| Cancel Window | Before voting period begins |
| Cancelled Proposals | Deposit forfeited |
| Post-Voting Cancellation | Not allowed |

**Cancellation Process:**
1. Proposer submits cancel request via governance interface
2. System verifies current proposal state is `REVIEW` (not `VOTING`)
3. Deposit is slashed per Section 4.1 (Proposal Spam)
4. Proposal state transitions to `CANCELLED`

---

## 2. Voting Rules

### 2.1 Voting Period

| Field | Value |
|-------|-------|
| Standard Voting Period | 7 days (168 hours) |
| Fast-Track Voting Period | 24 hours (Emergency only) |
| Extension Allowed | No extensions permitted |
| Early Closing | Not permitted |

**Voting Period Phases:**

| Phase | Duration | Allowable Actions |
|-------|----------|-------------------|
| Review | 24 hours | Editing, cancellation |
| Voting | 168 hours | Casting votes, changing votes (first 24h only) |
| Execution | 48 hours | On-chain execution of passed proposals |

### 2.2 Minimum Quorum

| Field | Value |
|-------|-------|
| Quorum Threshold | 10% of total DIEM supply |
| Quorum Calculation | `(Yes Votes + No Votes + Abstain Votes) / Total DIEM Supply` |
| Quorum Measured Against | Total circulating DIEM at proposal creation |

**Example Quorum Calculation:**

```
Total DIEM Supply: 1,000,000 DIEM
Required Quorum: 10% = 100,000 DIEM-equivalent

Scenario A:
- Yes Votes: 60,000 DIEM (quadratic-weighted)
- No Votes: 30,000 DIEM
- Abstain Votes: 20,000 DIEM
Total Participation: 110,000 DIEM-equivalent
Result: QUORUM REACHED (110,000 >= 100,000)

Scenario B:
- Yes Votes: 40,000 DIEM
- No Votes: 20,000 DIEM
- Abstain Votes: 10,000 DIEM
Total Participation: 70,000 DIEM-equivalent
Result: QUORUM NOT REACHED (70,000 < 100,000)
```

### 2.3 Passage Threshold

| Field | Value |
|-------|-------|
| Threshold for Passage | 51% of cast votes (excluding abstain) |
| Abstain Votes | Count toward quorum, NOT toward threshold |

**Passage Calculation:**

```
For passage, proposal must satisfy:
1. Quorum >= 10% of total DIEM supply
2. (Yes Votes / (Yes Votes + No Votes)) >= 0.51

Example - Passed Proposal:
- Yes: 55,000 DIEM-weighted
- No: 45,000 DIEM-weighted
- Abstain: 200,000 DIEM-weighted
- Quorum: 300,000 / 1,000,000 = 30% (REACHED)
- Yes %: 55,000 / 100,000 = 55% >= 51% (PASSED)

Example - Failed Proposal:
- Yes: 50,000 DIEM-weighted
- No: 50,000 DIEM-weighted
- Abstain: 10,000 DIEM-weighted
- Quorum: 110,000 / 1,000,000 = 11% (REACHED)
- Yes %: 50,000 / 100,000 = 50% < 51% (FAILED)
```

### 2.4 Quadratic Voting

| Field | Value |
|-------|-------|
| Formula | Vote Weight = sqrt(DIEM Amount) |
| Maximum Weight per Wallet | 1,000 sqrt(DIEM) cap |
| Minimum Weight | 1 (for any voting wallet) |

**Quadratic Weight Calculation:**

```
Voter DIEM Holdings | sqrt(DIEM) Weight | Effective Cap
--------------------|-------------------|-----------------
100 DIEM            | 10                | 10
1,000 DIEM          | 31.62             | 31.62
10,000 DIEM         | 100               | 100
100,000 DIEM        | 316.23            | 316.23 (capped at 1000)
1,000,000 DIEM      | 1,000             | 1,000 (capped)
```

**Rationale:** Quadratic voting reduces the influence of large DIEM holders, giving smaller holders proportionally more voting power. This prevents plutocracy and promotes democratic decision-making.

### 2.5 Double Voting Prevention

| Field | Value |
|-------|-------|
| One Vote Per Wallet | Enforced per proposal |
| Duplicate Vote Detection | Wallet address + proposal ID |
| Second Vote Attempt | Rejected with error |
| Vote Change | Allowed within first 24h only |

**Implementation Pseudocode:**

```typescript
function castVote(wallet: string, proposalId: string, vote: VoteType): Result {
  const existingVote = getVote(wallet, proposalId);
  
  if (existingVote !== null) {
    if (isWithinChangeWindow(proposalId)) {
      updateVote(wallet, proposalId, vote);
      return Result.Success;
    }
    return Result.DuplicateVoteRejected;
  }
  
  recordVote(wallet, proposalId, vote);
  return Result.Success;
}
```

### 2.6 Vote Change Window

| Field | Value |
|-------|-------|
| Change Window Duration | First 24 hours of voting period |
| After Change Window | Votes locked, immutable |
| Partial Changes | Not allowed (must cast new vote direction) |

**State Transition:**
```
FIRST 24 HOURS:     vote can be changed unlimited times
AFTER 24 HOURS:    vote is sealed and immutable
                    (change window closed)
```

### 2.7 Abstain Voting

| Field | Value |
|-------|-------|
| Abstain Option | Available to all voters |
| Counts Toward Quorum | YES |
| Counts Toward Threshold | NO |
| Deposit Required | NO (abstain is free) |

**Abstain Use Cases:**
- Wallet disagrees but accepts majority decision
- Wallet lacks strong opinion but wants participation
- Wallet wants to signal presence for quorum without affecting outcome

---

## 3. Public Participation

### 3.1 Anonymous Voting

| Field | Value |
|-------|-------|
| Minimum DIEM for Anonymous | 100 DIEM |
| Anonymous Mode | Optional toggle per vote |
| On-Chain Recording | Wallet hash (not full address) |
| Off-Chain Disclosure | Optional reveal for audit |

**Anonymous Voting Implementation:**

```typescript
interface AnonymousVote {
  proposalId: string;
  voteHash: string;           // keccak256(secret + wallet)
  quadraticWeight: bigint;   // pre-calculated
  timestamp: number;
}

interface RevealPayload {
  voteHash: string;
  secret: string;
  voteDirection: VoteType;
}
```

### 3.2 Guest Voting

| Field | Value |
|-------|-------|
| Guest Session | Session-based, no wallet required |
| Guest Vote Weight | 1 (minimum weight) |
| Session Duration | 24 hours |
| Conversion | Guests can link wallet to inherit vote |

**Guest Session Flow:**
```
1. Guest visits governance portal
2. System generates unique session token
3. Guest casts vote (stored with session token)
4. Vote weight = 1 (sqrt(1) = 1)
5. On wallet connection, vote can be re-cast with actual weight
```

### 3.3 Auto-Voting via Prompt Submission

| Field | Value |
|-------|-------|
| Auto-Vote Trigger | Submit AI prompt that triggers governance action |
| Prompt Requirements | Must reference active proposal ID |
| Delegation Override | User can set auto-vote preferences in settings |

**Auto-Vote Configuration:**

```typescript
interface AutoVotePreference {
  enabled: boolean;
  triggerKeywords: string[];  // e.g., ["vote yes", "support proposal"]
  defaultVote: VoteType | "abstain";
  scope: "all" | "category-specific" | ProposalId[];
}
```

### 3.4 Delegation Options

| Delegation Type | Description | Revocable |
|-----------------|-------------|-----------|
| Full Delegation | Delegate all voting power to another wallet | Yes |
| Category Delegation | Delegate to different wallets per category | Yes |
| Time-Limited Delegation | Delegation expires after specified time | Automatic |
| Snapshot Delegation | Delegation valid for specific proposal only | N/A |

**Delegation Commands:**

```
/delegate <wallet_address>              # Full delegation
/delegate TREASURY <wallet_address>     # Treasury category only
/delegate --expires 30d <wallet_address> # 30-day delegation
/revoke                                 # Revoke all delegations
```

---

## 4. Slash Conditions

### 4.1 Proposal Spam

| Field | Value |
|-------|-------|
| Slash Percentage | 50% of deposit |
| Trigger Condition | Proposal cancelled during review period |
| Additional Penalty | 24-hour submission ban |
| Repeated Offense | 7-day submission ban |

**Slash Calculation Example:**

```
Deposit: 100 DIEM
Spam Slash (50%): 50 DIEM forfeited
Refund: 50 DIEM returned to proposer
```

### 4.2 Bad Faith Voting

| Field | Value |
|-------|-------|
| Slash Percentage | 25% of voting weight |
| Trigger Conditions | Vote contradicts stated position; Coordinated voting; Evidence of bribery |
| Detection | Community report + governance moderator review |
| Appeal Process | 48-hour appeal window |

**Bad Faith Indicators:**
- Voter publicly states opposition then votes yes
- Coordinated voting pattern across multiple wallets
- Evidence of vote buying or coercion
- Copy-paste reasoning without protocol-specific analysis

### 4.3 Double Voting

| Field | Value |
|-------|-------|
| Slash Percentage | 100% of voting weight for that proposal |
| Additional Penalty | Vote removal from tally |
| Trigger Condition | Multiple votes cast from same wallet |
| Repeated Double Vote | Permanent voting suspension (7 days) |

**Double Vote Handling:**

```typescript
function processDoubleVote(wallet: string, proposalId: string): Penalty {
  const firstVote = getFirstVote(wallet, proposalId);
  const duplicateVote = getDuplicateVote(wallet, proposalId);
  
  return {
    slashPercent: 1.0,           // 100% slash
    voteRemoval: true,            // remove duplicate from tally
    isSecondOffense: checkHistory(wallet, "DOUBLE_VOTE"),
    suspension: isSecondOffense ? "7d" : null
  };
}
```

### 4.4 Failed Execution Attempts

| Field | Value |
|-------|-------|
| Retry Limit | 3 attempts |
| Failed Execution Slash | 10 DIEM from proposer |
| Trigger Condition | Passed proposal fails to execute within 48h |
| Exemption | Contract dependency failure (external factors) |

**Execution Failure Handling:**

```
Attempt 1: FAILED (insufficient gas)
   -> Retry automatically after 1 hour
   -> Proposer notified

Attempt 2: FAILED (contract reverted)
   -> Retry automatically after 6 hours
   -> Proposer notified with error details

Attempt 3: FAILED
   -> Proposal marked as FAILED_EXECUTION
   -> 10 DIEM slashed from proposer deposit
   -> Governance notified for manual review
```

---

## 5. Emergency Governance

### 5.1 Security Council

| Field | Value |
|-------|-------|
| Council Size | 5 members |
| Multisig Requirement | 3 of 5 signatures |
| Council Selection | Elected by governance quarterly |
| Emergency Powers | Defined in Section 5.2 |

**Security Council Members:**

| Member | Role | Address (Hash) |
|--------|------|----------------|
| Seat 1 | Chair | `0x71C7656EC7...` |
| Seat 2 | Technical | `0x6Bc25n8E2a...` |
| Seat 3 | Treasury | `0x3D3f5B8cE9...` |
| Seat 4 | Legal/Compliance | `0x8F4D6b2A1c...` |
| Seat 5 | Community | `0x2C5E7f9D3e...` |

### 5.2 Fast-Track Proposals

| Field | Value |
|-------|-------|
| Trigger Conditions | Security vulnerability, protocol exploitation, emergency |
| Voting Period | 24 hours |
| Quorum Requirement | 5% (reduced from 10%) |
| Threshold | 60% (increased from 51%) |
| Initiation Authority | Security Council only |

**Fast-Track Criteria (ANY must be met):**
1. Active exploitation of smart contract vulnerability
2. Protocol funds at risk of permanent loss
3. Regulatory action requiring immediate response
4. Partner integration deadline with time-sensitive requirements

### 5.3 Veto Override Capability

| Field | Value |
|-------|-------|
| Veto Authority | Security Council |
| Veto Window | Within 12 hours of proposal passage |
| Override Requirement | 4 of 5 council signatures |
| Transparency | Full veto reasoning published on-chain |

**Veto Process:**

```typescript
interface VetoOverride {
  proposalId: string;
  councilVotes: string[];      // 4 signatures required
  reason: string;              // Published reasoning
  timestamp: number;
  effectiveImmediately: boolean;
}
```

**Veto Transparency Requirements:**
- Full written rationale (minimum 200 characters)
- Specific protocol rules violated
- Alternative resolution timeline
- Published within 24 hours of veto execution

### 5.4 Transparency Requirements

| Disclosure Type | Timeline | Public Access |
|-----------------|-----------|---------------|
| Emergency Action | Within 4 hours | Full public |
| Council Decision | Within 24 hours | Full public |
| Veto Override Reason | Within 24 hours | Full public |
| Quarterly Report | 7 days after quarter end | Full public |
| Audit Findings | Upon completion | Full public |

---

## 6. Treasury Rules

### 6.1 Minimum Balance

| Field | Value |
|-------|-------|
| Minimum Treasury Balance | 1,000 USDC |
| Purpose | Operational runway, gas fees, emergency reserves |
| Enforcement | Large expenditure blocked if balance would fall below minimum |

**Treasury Health Check:**

```
IF (current_balance - proposed_expenditure) < MIN_BALANCE:
  REJECT expenditure with error:
  "Treasury balance would fall below 1,000 USDC minimum"
```

### 6.2 Large Expenditure Rules

| Field | Value |
|-------|-------|
| Threshold | > 10,000 USDC |
| Approval Requirement | Standard governance vote (7-day) |
| Quorum Required | 15% (increased from 10%) |
| Threshold | 60% majority |
| Emergency Exception | Security Council 3-of-5 approval |

**Large Expenditure Process:**

```
1. Proposer submits expenditure proposal
2. 100 DIEM deposit locked
3. 24-hour review period
4. 7-day voting period
5. If passed:
   - 60% threshold (quorum: 15%)
   - Execution within 48 hours
6. If failed:
   - Deposit refunded (minus potential spam slash)
   - Proposer can revise and resubmit
```

### 6.3 Medium Expenditure Rules

| Field | Value |
|-------|-------|
| Threshold | 1,000 - 10,000 USDC |
| Approval Requirement | Standard governance vote |
| Quorum Required | 10% (standard) |
| Threshold | 51% majority |
| Executive Exception | Up to 2,500 USDC without vote |

**Medium Expenditure Examples:**

```
Scenario A: $5,000 grant
- Standard process applies
- 51% threshold
- 10% quorum

Scenario B: $2,500 operational expense
- Can be approved by executive (no vote required)
- Must be documented within 48 hours
- Maximum 2 such approvals per calendar month
```

### 6.4 Small Expenditure Rules

| Field | Value |
|-------|-------|
| Threshold | < 1,000 USDC |
| Approval Requirement | Executive approval only |
| Documentation | Required within 48 hours |
| Monthly Limit | 5,000 USDC total |

**Small Expenditure Categories:**
- Bug bounty payments (up to $500 per critical bug)
- Emergency gas refunds
- Community recognition awards
- Minor operational expenses

### 6.5 Treasury Summary

| Expenditure Size | Vote Required | Quorum | Threshold | Notes |
|------------------|---------------|--------|-----------|-------|
| < 1,000 USDC | No | N/A | N/A | Executive approval |
| 1,000 - 10,000 USDC | Yes | 10% | 51% | Standard process |
| > 10,000 USDC | Yes | 15% | 60% | Enhanced scrutiny |
| Any (emergency) | No | N/A | N/A | Security Council 3-of-5 |

---

## Appendix A: State Machine Reference

```
PROPOSAL STATES:
================
DRAFT       -> Initial creation state (editable, no deposit)
SUBMITTED   -> Deposit locked, entering review
REVIEW      -> 24-hour mandatory review period
VOTING      -> Active voting (7 days standard)
CLOSED      -> Voting ended, awaiting execution
EXECUTED    -> Successfully executed on-chain
REJECTED    -> Failed quorum or threshold
CANCELLED   -> Withdrawn by proposer during review
FAILED_EXECUTION -> Passed but execution failed

VOTE STATES:
=============
PENDING     -> Vote cast but change window open
CAST        -> Vote sealed (change window closed)
REMOVED     -> Double-vote penalty applied
```

---

## Appendix B: Slash Summary Table

| Offense | Slash | Additional Penalty |
|---------|-------|-------------------|
| Proposal Spam | 50% of deposit | 24h submission ban |
| Bad Faith Voting | 25% of vote weight | Appeal window |
| Double Voting | 100% of vote weight | Vote removal, 7d suspension |
| Failed Execution | 10 DIEM | Retry attempts exhausted |

---

## Appendix C: Quick Reference Card

| Parameter | Standard Value | Fast-Track Value |
|-----------|----------------|-----------------|
| Voting Period | 7 days | 24 hours |
| Quorum | 10% | 5% |
| Threshold | 51% | 60% |
| Minimum Deposit | 100 DIEM | N/A |
| Edit Window | 2 hours | Not applicable |
| Vote Change Window | First 24 hours | First 6 hours |

---

**END OF DOCUMENT**

*This governance document is the authoritative source for The Peoples Agent governance rules. For questions or clarifications, contact the governance team or submit a governance proposal for rule modification.*