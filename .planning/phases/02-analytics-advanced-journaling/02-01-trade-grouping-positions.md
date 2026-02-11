---
phase: 02-analytics-advanced-journaling
plan: 01
type: execute
wave: 1
depends_on: []
files_modified: 
  - src/types/position.ts
  - src/lib/algorithms/position-tracker.ts
  - src/lib/analytics.ts
  - src/components/analytics/position-overview.tsx
  - src/components/analytics/positions-table.tsx
  - src/app/api/analytics/positions/route.ts
  - src/app/dashboard/positions/page.tsx
  - prisma/schema.prisma
autonomous: true

must_haves:
  truths:
    - "User can view trades grouped into buy/sell positions"
    - "System automatically calculates FIFO-based cost basis and P&L"
    - "User can manually adjust position groupings when needed"
    - "Position data persists across sessions and reflects in analytics"
  artifacts:
    - path: "src/types/position.ts"
      provides: "Position and trade grouping type definitions"
      min_lines: 50
    - path: "src/lib/algorithms/position-tracker.ts"
      provides: "FIFO algorithm for position calculations"
      exports: ["calculateFIFOPositions", "groupTradesIntoPositions"]
    - path: "src/components/analytics/position-overview.tsx"
      provides: "Position metrics display component"
      min_lines: 100
    - path: "prisma/schema.prisma"
      provides: "Position and PositionTrade database models"
      contains: "model Position"
  key_links:
    - from: "src/components/analytics/position-overview.tsx"
      to: "/api/analytics/positions"
      via: "fetch in useEffect"
      pattern: "fetch.*api/analytics/positions"
    - from: "src/app/api/analytics/positions/route.ts"
      to: "src/lib/algorithms/position-tracker.ts"
      via: "FIFO calculation import"
      pattern: "import.*position-tracker"
    - from: "src/lib/analytics.ts"
      to: "src/lib/algorithms/position-tracker.ts"
      via: "position grouping function"
      pattern: "calculateFIFOPositions"
---

<objective>
Implement trade grouping and position management system using FIFO algorithm for IRS 2025 compliance.

Purpose: Transform individual trades into meaningful positions for better analytics and journaling
Output: Working position tracking system with database schema, algorithms, and UI components
</objective>

<execution_context>
@/Users/husammeshri/.claude/get-shit-done/workflows/execute-plan.md
@/Users/husammeshri/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/research/phase-2-research.md
@src/types/trade.ts
@src/lib/analytics.ts
@src/components/analytics/analytics-dashboard.tsx
</context>

<tasks>

<task type="auto">
  <name>Create Position Types and Database Schema</name>
  <files>
    src/types/position.ts
    prisma/schema.prisma
  </files>
  <action>
    Create comprehensive position types in src/types/position.ts:
    - Position interface with id, symbol, walletAddress, openDate, closeDate, status
    - PositionTrade interface linking trades to positions
    - PositionMetrics interface for calculated P&L, fees, duration
    - PositionGrouping interface for manual adjustments
    - TradeGroupingRule interface for algorithm configuration
    
    Update prisma/schema.prisma to add Position and PositionTrade models:
    - Position model with id, symbol, walletAddress, openDate, closeDate, status, totalQuantity, avgEntryPrice, avgExitPrice, realizedPnL, unrealizedPnL, fees
    - PositionTrade model relating trades to positions with id, positionId, tradeId, role (entry/exit), quantity
    - Add proper relations and indexes for performance
    
    Run prisma db push to apply schema changes.
  </action>
  <verify>npx prisma db push succeeds and npx prisma generate completes</verify>
  <done>Position and PositionTrade models exist in database with proper TypeScript types generated</done>
</task>

<task type="auto">
  <name>Implement FIFO Position Tracking Algorithm</name>
  <files>
    src/lib/algorithms/position-tracker.ts
  </files>
  <action>
    Create FIFO position tracking algorithm following research recommendations:
    - calculateFIFOPositions function that processes trades chronologically
    - groupTradesIntoPositions function that creates Position records
    - Per-wallet FIFO queues for IRS 2025 compliance 
    - Handle buy trades (add to holdings queue), sell trades (remove FIFO from queue)
    - Calculate realized P&L for closed positions and unrealized P&L for open positions
    - Support partial position closes and fee allocation
    - Export validatePositionGrouping function for manual adjustments
    - Include comprehensive error handling for edge cases (same timestamp trades, zero quantities)
    
    Follow the research pattern for FIFO implementation with proper TypeScript types.
  </action>
  <verify>npm run type-check passes and algorithm handles basic buy/sell sequences correctly</verify>
  <done>FIFO algorithm correctly processes trades into positions with accurate P&L calculations</done>
</task>

<task type="auto">
  <name>Enhance Analytics Service with Position Data</name>
  <files>
    src/lib/analytics.ts
  </files>
  <action>
    Extend existing analytics service to include position-based calculations:
    - Add getPositionMetrics function for position-specific analytics
    - Integrate position data into existing P&L calculations
    - Add getOpenPositions and getClosedPositions functions
    - Add position-based win rate calculations (closed positions only)
    - Add average position duration metrics
    - Add largest win/loss by position rather than individual trade
    - Ensure backward compatibility with existing trade-based analytics
    - Add getPositionsBySymbol function for token-specific analysis
    
    Import from position-tracker.ts and use FIFO calculations in analytics.
  </action>
  <verify>Existing analytics dashboard still works and new position functions return valid data</verify>
  <done>Analytics service provides both trade-level and position-level metrics</done>
</task>

<task type="auto">
  <name>Create Position Overview UI Components</name>
  <files>
    src/components/analytics/position-overview.tsx
    src/components/analytics/positions-table.tsx
  </files>
  <action>
    Create position-overview.tsx following existing metrics-overview.tsx pattern:
    - Display key position metrics: total positions, open positions, average duration, position win rate
    - Show largest winning/losing positions
    - Include unrealized P&L for open positions
    - Use same Card and Badge components as existing metrics
    
    Create positions-table.tsx following existing trades-table.tsx pattern:
    - Display position data: symbol, entry/exit dates, quantity, avg prices, P&L, duration, status
    - Include sortable columns and pagination
    - Add filter by status (open/closed), symbol, date range
    - Link to individual trades within each position
    - Use same Table components and styling as existing trades table
    - Add "View Trades" action to expand position details
  </action>
  <verify>Components render without errors and display mock position data correctly</verify>
  <done>Position overview and table components match existing analytics UI patterns</done>
</task>

<task type="auto">
  <name>Create Positions API Endpoint</name>
  <files>
    src/app/api/analytics/positions/route.ts
  </files>
  <action>
    Create positions API endpoint following existing analytics API pattern:
    - GET endpoint that fetches positions for authenticated user
    - Support query params: walletAddress, symbol, status (open/closed), dateFrom, dateTo
    - Use FIFO algorithm to calculate/update positions from trades
    - Return position data with calculated metrics
    - Include proper authentication check using Clerk
    - Add error handling and validation
    - Follow same response format as other analytics endpoints
    - Support both summary view and detailed view with trade breakdown
    
    Integrate with existing database models and use position-tracker algorithm.
  </action>
  <verify>curl -H "Authorization: Bearer ..." localhost:3000/api/analytics/positions returns valid JSON</verify>
  <done>Positions API endpoint returns accurate position data with proper authentication</done>
</task>

<task type="auto">
  <name>Create Positions Dashboard Page</name>
  <files>
    src/app/dashboard/positions/page.tsx
  </files>
  <action>
    Create positions dashboard page following existing analytics page pattern:
    - Server-side page component that fetches position data
    - Include PositionOverview component for key metrics
    - Include PositionsTable component for detailed position listing
    - Add navigation link to sidebar for "Positions" tab
    - Use same layout and styling as existing analytics dashboard
    - Include loading states and error handling
    - Add breadcrumb navigation
    - Support both wallet-specific and combined position views
    
    Update navigation sidebar to include Positions link between Analytics and other sections.
  </action>
  <verify>Visit localhost:3000/dashboard/positions shows position data and navigation works</verify>
  <done>Positions dashboard page is accessible and displays position analytics correctly</done>
</task>

</tasks>

<verification>
TGRP-01: System groups related buy/sell trades for same token into positions ✓
TGRP-02: User can view grouped trades as single position with combined analytics ✓  
TGRP-03: User can manually adjust trade groupings (framework established) ✓
Position data integrates with existing analytics dashboard ✓
FIFO algorithm complies with IRS 2025 requirements ✓
</verification>

<success_criteria>
- Position tracking system processes trades into meaningful grouped positions
- FIFO algorithm accurately calculates cost basis and realized/unrealized P&L  
- Users can view position-based analytics alongside existing trade analytics
- Database schema supports both individual trades and grouped positions
- UI components follow established design patterns and integrate seamlessly
- API endpoints provide authenticated access to position data with proper filtering
</success_criteria>

<output>
After completion, create `.planning/phases/02-analytics-advanced-journaling/02-01-trade-grouping-positions-SUMMARY.md`
</output>