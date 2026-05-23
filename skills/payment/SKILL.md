# Payment Skill

## Overview

The Payment skill handles x402 payment integration, DIEM tokenomics, USDC on Base, and tier-based pricing for The Peoples Agent. It enables decentralized payment flows for agent services.

## How It Works

### x402 Payment Integration

x402 is an open payment protocol enabling payments to any on-chain address:
- **Payment Request**: Agent generates x402 payment requests
- **Header Injection**: `Authorization: x402 <signature>`
- **Native Token Payments**: ETH, MATIC, BASE payments supported
- **Fallback Handling**: Retry with alternative payment tokens

### DIEM Tokenomics

The DIEM token serves as the primary utility token:
- **Staking**: Lock DIEM for service tier upgrades
- **Governance**: DIEM holders vote on treasury allocation
- **Discounts**: Staked DIEM reduces transaction fees
- **Rewards**: Stakers earn a portion of protocol revenue

Token Economics:
- Total Supply: 1,000,000,000 DIEM
- Staking Rewards: 5% APY (dynamic)
- Governance Rewards: 2% of treasury per quarter

### USDC on Base

USDC is the stable payment option:
- **Currency Peg**: 1 USDC = $1 USD
- **Network**: Base L2 (Coinbase's rollup)
- **Instant Settlement**: Sub-second finality within Base
- **Low Fees**: <$0.01 per transaction

### Tier-Based Pricing

| Tier | Price | Features |
|------|-------|----------|
| Free | $0 | 100 queries/day, basic features |
| Basic | $10/mo | 10,000 queries/day, priority support |
| Pro | $50/mo | Unlimited queries, advanced analytics |
| Enterprise | Custom | Dedicated nodes, SLA, custom integrations |

## Usage Examples

```yaml
payment:
  x402:
    enabled: true
    supported_tokens:
      - ETH
      - USDC
      - DIEM
    fallback_enabled: true
    max_retries: 3
    
  diem:
    staking_enabled: true
    min_stake: 1000 DIEM
    reward_apy: 0.05
    lock_period: 30d
    
  usdc:
    enabled: true
    network: base
    settlement_speed: instant
    
  pricing:
    default_tier: free
    tiers:
      free:
        queries_per_day: 100
        features:
          - basic_responses
      basic:
        price_usdc: 10
        queries_per_day: 10000
        features:
          - priority_support
          - advanced_analytics
      pro:
        price_usdc: 50
        queries_per_month: unlimited
        features:
          - unlimited_queries
          - custom_prompts
          - api_access
```

## Configuration

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `x402.enabled` | boolean | `true` | Enable x402 payments |
| `supported_tokens` | array | `[ETH, USDC, DIEM]` | Accepted tokens |
| `usdc.network` | string | `base` | USDC network |
| `staking.enabled` | boolean | `true` | Enable DIEM staking |

## Troubleshooting

**Payment not processing:**
- Verify x402 header is being sent correctly
- Check token balance is sufficient
- Confirm RPC endpoint is accessible

**USDC settlement slow:**
- Verify Base network is not congested
- Check USDC contract address is correct
- Confirm gas price is adequate

**Staking rewards not accruing:**
- Verify stake transaction confirmed on-chain
- Check lock period has elapsed
- Confirm reward distribution schedule

**Tier downgrade not applying:**
- Verify payment completed successfully
- Check subscription renewal date
- Confirm tier features are properly gated