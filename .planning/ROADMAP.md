# Roadmap: ChainJournal

## Overview

ChainJournal's roadmap transforms the vision of accurate automatic trade import into a working SaaS platform. Starting with essential authentication and Solana trade import, we progress through core journaling and analytics features, then add subscription management to complete the MVP. Each phase delivers a coherent capability that users can verify, building toward the goal of giving crypto traders professional-grade analytics and journaling tools.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Import** - Core authentication, wallet management, and automatic trade import
- [ ] **Phase 2: Analytics & Journaling** - Trading analytics, advanced journaling with voice notes, trade grouping, and mistake tracking
- [ ] **Phase 3: Advanced Features** - Daily journaling, missed trades tracking, strategy management, and subscription system

## Phase Details

### Phase 1: Foundation & Import
**Goal**: Users can securely add wallet addresses and automatically import their Solana trading history
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, WALL-01, WALL-02, WALL-03, WALL-04, WALL-05, TRAD-01, TRAD-02, TRAD-03, TRAD-04, TRAD-05, ANAL-01, ANAL-02, ANAL-03, ANAL-04, ANAL-05
**Success Criteria** (what must be TRUE):
  1. User can sign up and log in using X/Twitter, Google, or email/password
  2. User can add multiple Solana wallet addresses to their account (paste addresses)
  3. User can view separate dashboards for each wallet address
  4. System automatically imports and displays historical trades with accurate P&L
  5. User can manually trigger trade sync and stays logged in across devices
**Plans**: 4 plans

Plans:
- [x] 01-01-project-setup-auth.md — Next.js project setup with Clerk authentication and social logins
- [x] 01-02-database-wallet-management.md — PostgreSQL database and multi-wallet management system
- [x] 01-03-okx-api-trade-import.md — Solana trade import via OKX API and RPC with background processing
- [x] 01-04-dashboard-analytics.md — Professional analytics dashboard with P&L charts and trade filtering

### Phase 2: Analytics & Journaling
**Goal**: Users can analyze their trading performance with advanced journaling and trade grouping
**Depends on**: Phase 1
**Requirements**: TRAD-06, TRAD-07, TRAD-08, TGRP-01, TGRP-02, TGRP-03, JOUR-01, JOUR-02, JOUR-03, JOUR-04, JOUR-05, JOUR-06, JOUR-07, MIST-01, MIST-02, MIST-03, MIST-04
**Success Criteria** (what must be TRUE):
  1. User can view comprehensive P&L statistics and filter by multiple criteria
  2. System groups related buy/sell trades into positions for combined analysis
  3. User can add text notes, voice recordings, and screenshots to entry/exit trades
  4. User can select from predefined mistakes or add custom mistakes to trades
  5. User can manually add, edit, and delete trades when needed
**Plans**: 4 plans

Plans:
- [ ] 02-01-trade-grouping-positions.md — FIFO position tracking with database schema and analytics integration
- [ ] 02-02-advanced-journaling-system.md — Voice recording, file uploads, and rich text notes with Supabase storage
- [ ] 02-03-mistake-tracking-analytics.md — Predefined mistake categories, custom mistakes, and analytics enhancement
- [ ] 02-04-manual-trade-management.md — Manual trade creation, editing, deletion, and enhanced filtering

### Phase 3: Advanced Features
**Goal**: Users have comprehensive journaling tools with daily tracking, missed trades, and strategy management
**Depends on**: Phase 2
**Requirements**: MISS-01, MISS-02, MISS-03, MISS-04, DAYJ-01, DAYJ-02, DAYJ-03, DAYJ-04, DAYJ-05, STRA-01, STRA-02, STRA-03, STRA-04, SUBS-01, SUBS-02, SUBS-03, SUBS-04, SUBS-05
**Success Criteria** (what must be TRUE):
  1. User can journal missed trade opportunities with reasons why they weren't taken
  2. User can add daily emotional state, market outlook, and strategies
  3. System displays daily market metrics (SOL/BTC/ETH/SPX, volume, Fear & Greed index)
  4. User can create and manage multiple detailed trading strategies
  5. Subscription system works with 7-day trial and feature restrictions
**Plans**: TBD

Plans:
- [ ] 03-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Import | 4/4 | Complete | 2026-02-11 |
| 2. Analytics & Journaling | 0/4 | Planned | - |
| 3. Subscription Management | 0/1 | Not started | - |