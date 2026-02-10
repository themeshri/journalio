# ChainJournal

## What This Is

A comprehensive trading journal for on-chain DEX trading that automatically imports trades from Solana (expanding to Base and BSC), enriches them with detailed journaling capabilities, and provides professional analytics similar to TradesViz/Tradezella. Built as a SaaS with social login, multi-wallet tracking, and subscription-based monetization.

## Core Value

Accurate automatic trade import from all supported chains that gives traders the analytics and journaling tools they need to improve their performance.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Automatic trade import from Solana DEX activity via OKX API
- [ ] Multi-wallet management with separate account tracking
- [ ] Rich journaling with notes, screenshots, tags, emotional state tracking
- [ ] Professional analytics dashboard with P&L metrics
- [ ] Social login (X/Google/email) with cross-device sync
- [ ] 7-day free trial with subscription paywall
- [ ] Manual trade add/edit capabilities for missing data

### Out of Scope

- Real-time trade monitoring — historical import only
- CEX integration — DEX only for v1
- Mobile app — web-first approach
- Advanced backtesting — focus on journaling and analytics
- Social features — private journals only initially

## Context

Building a TradesViz/Tradezella equivalent for crypto traders who need professional-grade journaling and analytics for their on-chain trading. The OKX Wallet API provides comprehensive transaction history across multiple chains. After 7-day trial, free tier only allows basic journaling without analytics. Target launch in 4-6 weeks focusing on Solana first, then expanding to other chains.

## Constraints

- **Tech Stack**: Modern web stack optimized for fast development
- **Timeline**: 4-6 week launch window for MVP
- **API Dependency**: OKX API for all chain data initially
- **Initial Chain**: Solana only for v1, expand later

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Start with Solana only | Fastest path to market, most active DEX ecosystem | — Pending |
| OKX API exclusive | Comprehensive data across chains, single integration | — Pending |
| 7-day trial model | Balance between user evaluation and conversion | — Pending |
| Social login only | Better UX, easier account recovery, cross-device sync | — Pending |

---
*Last updated: 2026-02-10 after initialization*