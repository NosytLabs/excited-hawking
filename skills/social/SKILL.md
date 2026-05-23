# Social Skill

## Overview

The Social skill handles social sharing, referral systems, public participation, and auto-voting from prompts for The Peoples Agent. It enables community engagement and network effects.

## How It Works

### Social Sharing

- **Content Distribution**: Share agent decisions, insights, proposals to social platforms
- **Privacy Controls**: Configurable visibility (public, friends-only, private)
- **Platform Integration**: Twitter, Discord, Telegram, webhooks
- **Analytics**: Track engagement metrics (views, shares, reactions)

### Referral System

1. **Referral Code Generation**: Unique codes for each participant
2. **Tracking**: Attribute referrals via code redemption
3. **Rewards**: Token incentives for successful referrals
4. **Tiers**: Reward scaling based on referral volume

Referral Flow:
```
User A shares code -> User B signs up with code -> Both get rewards
                              |
                              v
                    User B becomes referrer -> User C signs up -> A,B,C all rewarded
```

### Public Participation

- **Proposal Discovery**: Public feed of governance proposals
- **Vote Casting**: One-click voting for public proposals
- **Commentary**: Public discussion threads on proposals
- **Reputation**: Track participant contribution quality

### Auto-Voting from Prompts

Automated voting based on user-defined rules:
1. User sets prompt patterns (e.g., "always vote YES on infrastructure")
2. Matching proposals trigger auto-vote
3. User can override within configurable window
4. Vote history logged for transparency

## Usage Examples

```yaml
social:
  sharing:
    enabled: true
    platforms:
      - twitter
      - discord
    default_visibility: public
    auto_share_proposals: true
    
  referral:
    enabled: true
    reward_tiers:
      - referrals: 5
        reward: 100 DIEM
      - referrals: 20
        reward: 500 DIEM
      - referrals: 100
        reward: 2000 DIEM
        
  participation:
    public_feed: true
    vote_notifications: true
    reputation_enabled: true
    
  auto_voting:
    enabled: true
    override_window: 24h
    rules:
      - pattern: "infrastructure"
        vote: yes
      - pattern: "budget cut"
        vote: no
      - pattern: "marketing"
        abstain: true
```

## Configuration

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `sharing.enabled` | boolean | `true` | Enable sharing |
| `auto_share_proposals` | boolean | `false` | Auto-share governance |
| `referral.enabled` | boolean | `true` | Enable referral system |
| `auto_voting.enabled` | boolean | `false` | Enable auto-voting |
| `override_window` | duration | `24h` | Time to override auto-vote |

## Troubleshooting

**Referral not credited:**
- Verify referral code was entered correctly
- Check referral tracking cookie not blocked
- Confirm new user completed signup

**Auto-vote not triggering:**
- Check prompt pattern matching is correct
- Verify proposal filter is not too narrow
- Confirm auto_vote is enabled in config

**Social posts not publishing:**
- Verify API credentials for platforms
- Check rate limits not exceeded
- Confirm webhook endpoints accessible

**Public feed empty:**
- Verify governance proposals exist
- Check visibility settings are correct
- Confirm indexing service running