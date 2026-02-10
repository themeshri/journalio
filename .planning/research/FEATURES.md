# Feature Research

**Domain:** Crypto Trading Journal (DEX/On-Chain Focus)
**Researched:** February 10, 2026
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Automatic Trade Import | Essential for DEX trades - manual entry impractical | HIGH | API integration with Solana/Base/BSC, OKX Wallet API, parse on-chain transactions |
| Multi-Wallet Support | Users trade across multiple wallets/addresses | MEDIUM | Track and aggregate positions across different wallet addresses |
| Basic P&L Tracking | Fundamental requirement - track profit/loss in USD and crypto | MEDIUM | Real-time price feeds, historical data, fee calculation |
| Trade History View | Users expect to see chronological list of all trades | LOW | Simple table/list view with filtering and sorting |
| CSV Export | Standard feature for tax/accounting purposes | LOW | Export trade data in spreadsheet format |
| Exchange Integration | Support major DEXs (Uniswap, Jupiter, PancakeSwap) | HIGH | Multi-chain DEX protocol integration, AMM vs order book |
| Basic Performance Metrics | Win rate, total P&L, best/worst trades | MEDIUM | Statistical calculations on trade data |
| User Authentication | Secure access to personal trading data | MEDIUM | Social login (X/Google) + email registration |
| Trade Notes/Tags | Ability to annotate trades with strategy/thoughts | LOW | Simple text fields and tagging system |
| Mobile Access | Responsive design for mobile trading | MEDIUM | Progressive web app or native mobile optimization |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Real-time On-Chain Analysis | Live tracking of DEX positions and pending transactions | HIGH | WebSocket connections to blockchain nodes, MEV protection awareness |
| AI-Powered Trade Insights | Pattern recognition and performance improvement suggestions | HIGH | Machine learning models, natural language query interface |
| Cross-Chain Portfolio View | Unified view across Solana, Base, BSC in single dashboard | HIGH | Multi-chain data aggregation, normalized metrics |
| Smart Contract Interaction Tracking | Track complex DeFi positions (LP, yield farming, options) | HIGH | Protocol-specific parsers for major DeFi platforms |
| Screenshot Integration | Visual trade documentation with chart captures | MEDIUM | Image storage, annotation tools, chart integration |
| Social Trading Features | Share strategies, follow other traders, leaderboards | MEDIUM | Privacy controls, performance verification, community features |
| Advanced Risk Metrics | Sharpe ratio, maximum drawdown, risk-adjusted returns | MEDIUM | Statistical analysis, benchmarking against market indices |
| Strategy Backtesting | Test trading strategies against historical data | HIGH | Historical price data, complex calculation engine |
| Tax Optimization Tools | FIFO/LIFO accounting methods, tax loss harvesting insights | HIGH | Tax law compliance, accounting method selection |
| Automated Alerts | Notifications for trade opportunities or risk events | MEDIUM | Real-time monitoring, customizable alert criteria |
| Portfolio Rebalancing Alerts | Suggest optimal position sizing based on strategy | MEDIUM | Portfolio theory algorithms, risk management calculations |
| MEV Protection Tracking | Track and analyze MEV losses/gains from trades | HIGH | MEV bot detection, sandwich attack analysis |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Built-in Trading Execution | "One-stop solution" appeal | Regulatory complexity, security liability, scope creep | Focus on analysis, integrate with existing wallets |
| Real-time Everything | Seems more professional | Expensive infrastructure, battery drain, often unnecessary | Smart polling intervals, priority-based updates |
| Unlimited Historical Data | Completionist mentality | Storage costs, slow queries, diminishing returns | Focus on actionable timeframes (1-2 years max) |
| Advanced Technical Analysis | Trader tool familiarity | Feature bloat, overlaps with TradingView/charts | Integrate with existing charting tools |
| Complex Social Features | Build community appeal | Moderation overhead, privacy concerns, distraction from core value | Simple sharing, focus on educational content |
| Multi-Asset Support (Stocks/Forex) | Market expansion desire | Regulatory complexity, different data needs, unfocused product | Stay crypto-focused, do it exceptionally well |
| Custom Indicator Building | Power user requests | Complex UI, rarely used by most traders | Partner with/integrate existing charting platforms |
| Automated Trading Bots | Natural progression thought | High-risk feature, regulatory issues, support complexity | Focus on analysis that informs manual decisions |

## Feature Dependencies

```
User Authentication
    └──requires──> Basic Security Infrastructure
                       └──requires──> Data Encryption

Automatic Trade Import
    └──requires──> Multi-Wallet Support
    └──requires──> Exchange API Integration
                       └──requires──> Real-time Price Feeds

AI-Powered Insights
    └──requires──> Trade History Data
    └──requires──> Performance Metrics
                       └──requires──> P&L Tracking

Cross-Chain Portfolio View
    └──requires──> Multi-Chain Data Sources
    └──requires──> Normalized Metrics Engine

Screenshot Integration ──enhances──> Trade Notes/Tags

Social Features ──conflicts──> Privacy-First Approach

Advanced Risk Metrics ──enhances──> Basic Performance Metrics
```

### Dependency Notes

- **Automatic Trade Import requires Multi-Wallet Support:** Need to associate transactions with specific wallet addresses before parsing
- **AI Insights requires sufficient data:** Need meaningful trade history before AI can provide valuable insights
- **Cross-Chain View requires standardization:** Must normalize different chain data formats into unified metrics
- **Social Features conflict with Privacy:** Tension between sharing insights and protecting trading strategies
- **Advanced Metrics enhance basics:** Build sophisticated analytics on top of solid fundamental tracking

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [ ] User Authentication (X/Google/Email) — Essential for data security and user onboarding
- [ ] OKX Wallet API Integration — Core differentiator for automatic Solana trade import
- [ ] Basic P&L Tracking — Fundamental value proposition for traders
- [ ] Trade History View — Users need to see their trades immediately
- [ ] Multi-Wallet Support — Critical for Solana users who often use multiple addresses
- [ ] Simple Notes/Tags — Basic journaling capability to differentiate from portfolio trackers
- [ ] Mobile-Responsive UI — Most crypto trading happens on mobile
- [ ] CSV Export — Required for tax/accounting compliance

### Add After Validation (v1.x)

Features to add once core is working and user feedback validates direction.

- [ ] Base Chain Support — Expand to second most requested chain
- [ ] Screenshot Integration — When users request better trade documentation
- [ ] Basic Performance Metrics — Once sufficient trade data exists
- [ ] Advanced Trade Import (BSC) — Third chain based on user demand
- [ ] Simple Alert System — When users want proactive notifications
- [ ] Enhanced Security (2FA) — When enterprise/high-value users join

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] AI-Powered Insights — Requires significant data and ML expertise
- [ ] Cross-Chain Unified Dashboard — Complex engineering, questionable ROI until proven
- [ ] Social/Community Features — Focus distraction until core is solid
- [ ] Advanced DeFi Tracking — Complex protocols, limited initial user base
- [ ] Tax Optimization Tools — Specialized feature for established users

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| OKX Wallet Integration | HIGH | HIGH | P1 |
| Basic P&L Tracking | HIGH | MEDIUM | P1 |
| Multi-Wallet Support | HIGH | MEDIUM | P1 |
| Trade Notes/Tags | MEDIUM | LOW | P1 |
| User Authentication | HIGH | MEDIUM | P1 |
| Trade History View | HIGH | LOW | P1 |
| Mobile Responsive | HIGH | MEDIUM | P1 |
| CSV Export | MEDIUM | LOW | P1 |
| Screenshot Integration | MEDIUM | MEDIUM | P2 |
| Base Chain Support | HIGH | HIGH | P2 |
| Performance Metrics | MEDIUM | MEDIUM | P2 |
| BSC Support | MEDIUM | HIGH | P2 |
| Alert System | MEDIUM | MEDIUM | P2 |
| AI Insights | HIGH | HIGH | P3 |
| Social Features | LOW | HIGH | P3 |
| Advanced DeFi Tracking | LOW | HIGH | P3 |
| Tax Tools | MEDIUM | HIGH | P3 |

**Priority key:**
- P1: Must have for launch - validates core value proposition
- P2: Should have, add when possible - expands market reach
- P3: Nice to have, future consideration - advanced differentiation

## Competitor Feature Analysis

| Feature | TradesViz | Tradezella | Our Approach (ChainJournal) |
|---------|-----------|------------|----------------------------|
| Trade Import | 100+ exchanges, API sync | Limited exchanges, mostly manual | OKX Wallet API focus, automatic on-chain parsing |
| Analytics | 600+ statistics, comprehensive | Basic metrics, AI Q&A | Start simple, build toward AI insights |
| Multi-Asset | Stocks, crypto, forex, futures | Similar broad support | Crypto-only focus, deeper DEX integration |
| Pricing | Free tier (3K trades), $18/month | $12-24/month, no free tier | 7-day trial, competitive SaaS pricing |
| Mobile Access | Web responsive | Native apps | Progressive web app approach |
| Social Features | Community via Discord | Strategy playbooks, sharing | Defer social features for focus |
| On-Chain Specific | Basic crypto support | Limited DeFi awareness | Built for DEX trading from ground up |
| Cross-Chain | Limited multi-chain view | Minimal cross-chain support | Native multi-chain design (Solana/Base/BSC) |

## Sources

- TradesViz feature analysis and pricing research
- Tradezella comprehensive feature review
- StockBrokers.com 2026 trading journal comparison
- OKX Wallet API documentation and capabilities
- DEX market trends and on-chain trading analysis
- Crypto trading journal user experience research
- Trading community feedback on existing platforms

---
*Feature research for: Crypto Trading Journal (DEX/On-Chain Focus)*
*Researched: February 10, 2026*