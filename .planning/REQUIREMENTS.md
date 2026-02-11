# Requirements: ChainJournal

**Defined:** 2026-02-10
**Core Value:** Accurate automatic trade import from all supported chains that gives traders the analytics and journaling tools they need to improve their performance

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication
- [ ] **AUTH-01**: User can sign up with X/Twitter account
- [ ] **AUTH-02**: User can sign up with Google account
- [ ] **AUTH-03**: User can sign up with email/password
- [ ] **AUTH-04**: User session persists across browser refresh
- [ ] **AUTH-05**: User can log out from any page
- [ ] **AUTH-06**: User data syncs across multiple devices

### Wallet Management
- [ ] **WALL-01**: User can add Solana wallet address (paste address, read-only)
- [ ] **WALL-02**: User can add multiple wallet addresses to same account
- [ ] **WALL-03**: User can view separate dashboard per wallet
- [ ] **WALL-04**: User can view combined dashboard across all wallets
- [ ] **WALL-05**: User can remove wallet address from account

### Trade Import
- [ ] **TRAD-01**: System automatically imports historical trades from wallet addresses via OKX API
- [ ] **TRAD-02**: System fetches new trades periodically (daily auto-sync)
- [ ] **TRAD-03**: User can manually trigger trade fetch/sync at any time
- [ ] **TRAD-04**: System correctly parses DEX swaps and calculates P&L
- [ ] **TRAD-05**: System handles failed/reverted transactions properly
- [ ] **TRAD-06**: User can manually add missing trades
- [ ] **TRAD-07**: User can edit trade details (price, quantity, notes)
- [ ] **TRAD-08**: User can delete incorrect trades

### Basic Analytics
- [ ] **ANAL-01**: User can view total P&L across all trades
- [ ] **ANAL-02**: User can view win/loss ratio statistics
- [ ] **ANAL-03**: User can view daily/weekly/monthly P&L breakdown
- [ ] **ANAL-04**: User can filter trades by token, date range, profit/loss
- [ ] **ANAL-05**: User can view list of all trades with basic details

### Trade Grouping & Journaling
- [ ] **TGRP-01**: System groups related buy/sell trades for same token (entry/exit positions)
- [ ] **TGRP-02**: User can view grouped trades as single position with combined journaling
- [ ] **TGRP-03**: User can manually adjust trade groupings when needed

### Position Journaling
- [ ] **JOUR-01**: User can add text notes to entry trades (buy positions)
- [ ] **JOUR-02**: User can add text notes to exit trades (sell positions)
- [ ] **JOUR-03**: User can record voice notes for entry and exit trades
- [ ] **JOUR-04**: User can upload screenshots for trades
- [ ] **JOUR-05**: User can add tags to categorize trades
- [ ] **JOUR-06**: User can search through notes and tags
- [ ] **JOUR-07**: User can rate trades (1-5 stars)

### Mistake Tracking
- [ ] **MIST-01**: User can select from predefined entry mistakes list
- [ ] **MIST-02**: User can select from predefined exit mistakes list
- [ ] **MIST-03**: User can add custom mistakes to their personal list
- [ ] **MIST-04**: System tracks frequency of mistake types

### Missed Trades Journal
- [ ] **MISS-01**: User can manually add trades they didn't execute
- [ ] **MISS-02**: User can journal why they missed the trade opportunity
- [ ] **MISS-03**: User can categorize missed trade types
- [ ] **MISS-04**: User can view missed trades analytics

### Daily Journal
- [ ] **DAYJ-01**: User can add daily emotional state and expectations
- [ ] **DAYJ-02**: User can journal market outlook and strategies for the day
- [ ] **DAYJ-03**: System displays daily market metrics (SOL/BTC/ETH/SPX open/close)
- [ ] **DAYJ-04**: System displays onchain volume and Fear & Greed index
- [ ] **DAYJ-05**: User can view historical daily journal entries with metrics

### Strategy Management
- [ ] **STRA-01**: User can create detailed trading strategies
- [ ] **STRA-02**: User can manage multiple strategies
- [ ] **STRA-03**: User can link trades to specific strategies
- [ ] **STRA-04**: User can view strategy performance analytics

### Subscription Management
- [ ] **SUBS-01**: New users get 7-day free trial with full features
- [ ] **SUBS-02**: After trial, free users can only add notes (no analytics)
- [ ] **SUBS-03**: Users can upgrade to paid subscription
- [ ] **SUBS-04**: Users can view subscription status and billing
- [ ] **SUBS-05**: System enforces feature restrictions based on subscription

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Multi-Chain Support
- **CHAI-01**: Support Base chain wallet imports
- **CHAI-02**: Support BSC chain wallet imports
- **CHAI-03**: Unified cross-chain portfolio view

### Advanced Analytics
- **ANAL-06**: Advanced P&L charts and visualizations
- **ANAL-07**: Risk/reward analysis per trade
- **ANAL-08**: Maximum drawdown tracking
- **ANAL-09**: Best/worst performing tokens analysis
- **ANAL-10**: Trading calendar with daily performance

### Enhanced Journaling
- **JOUR-06**: Emotional state tracking per trade
- **JOUR-07**: Strategy performance analysis
- **JOUR-08**: Trade plan templates
- **JOUR-09**: Mistake tracking and learning notes

### Data Export
- **EXPO-01**: Export trades to CSV for tax purposes
- **EXPO-02**: Generate PDF trading reports
- **EXPO-03**: API access for third-party integrations

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Built-in trading execution | Focus on journaling, not becoming another DEX |
| Real-time price alerts | Not core to journaling, many tools exist |
| Social features/community | Private journaling focus for v1 |
| Mobile native app | Web-first approach for faster development |
| Automated tax calculations | Complex regulations, defer to tax tools |
| Portfolio optimization recommendations | Focus on reflection, not advice |
| Backtesting engine | Complex feature, not core value prop |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 1 | Pending |
| AUTH-05 | Phase 1 | Pending |
| AUTH-06 | Phase 1 | Pending |
| WALL-01 | Phase 1 | Pending |
| WALL-02 | Phase 1 | Pending |
| WALL-03 | Phase 1 | Pending |
| WALL-04 | Phase 1 | Pending |
| WALL-05 | Phase 1 | Pending |
| TRAD-01 | Phase 1 | Pending |
| TRAD-02 | Phase 1 | Pending |
| TRAD-03 | Phase 1 | Pending |
| TRAD-04 | Phase 1 | Pending |
| TRAD-03 | Phase 1 | Pending |
| TRAD-04 | Phase 1 | Pending |
| TRAD-05 | Phase 1 | Pending |
| TRAD-06 | Phase 2 | Pending |
| TRAD-07 | Phase 2 | Pending |
| TRAD-08 | Phase 2 | Pending |
| ANAL-01 | Phase 2 | Pending |
| ANAL-02 | Phase 2 | Pending |
| ANAL-03 | Phase 2 | Pending |
| ANAL-04 | Phase 2 | Pending |
| ANAL-05 | Phase 2 | Pending |
| TGRP-01 | Phase 2 | Pending |
| TGRP-02 | Phase 2 | Pending |
| TGRP-03 | Phase 2 | Pending |
| JOUR-01 | Phase 2 | Pending |
| JOUR-02 | Phase 2 | Pending |
| JOUR-03 | Phase 2 | Pending |
| JOUR-04 | Phase 2 | Pending |
| JOUR-05 | Phase 2 | Pending |
| JOUR-06 | Phase 2 | Pending |
| JOUR-07 | Phase 2 | Pending |
| MIST-01 | Phase 2 | Pending |
| MIST-02 | Phase 2 | Pending |
| MIST-03 | Phase 2 | Pending |
| MIST-04 | Phase 2 | Pending |
| MISS-01 | Phase 3 | Pending |
| MISS-02 | Phase 3 | Pending |
| MISS-03 | Phase 3 | Pending |
| MISS-04 | Phase 3 | Pending |
| DAYJ-01 | Phase 3 | Pending |
| DAYJ-02 | Phase 3 | Pending |
| DAYJ-03 | Phase 3 | Pending |
| DAYJ-04 | Phase 3 | Pending |
| DAYJ-05 | Phase 3 | Pending |
| STRA-01 | Phase 3 | Pending |
| STRA-02 | Phase 3 | Pending |
| STRA-03 | Phase 3 | Pending |
| STRA-04 | Phase 3 | Pending |
| SUBS-01 | Phase 3 | Pending |
| SUBS-02 | Phase 3 | Pending |
| SUBS-03 | Phase 3 | Pending |
| SUBS-04 | Phase 3 | Pending |
| SUBS-05 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 48 total
- Mapped to phases: 48
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-10*
*Last updated: 2026-02-10 after roadmap creation*