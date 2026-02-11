---
phase: 02-analytics-advanced-journaling
plan: 03
type: execute
wave: 2
depends_on: ["02-01"]
files_modified:
  - src/types/mistake.ts
  - src/lib/analytics.ts
  - src/components/analytics/mistake-tracker.tsx
  - src/components/analytics/mistake-analytics.tsx
  - src/components/analytics/enhanced-metrics.tsx
  - src/components/journaling/mistake-selector.tsx
  - src/app/api/analytics/mistakes/route.ts
  - src/app/dashboard/mistakes/page.tsx
  - prisma/schema.prisma
autonomous: true

must_haves:
  truths:
    - "User can select from predefined mistake categories for any trade"
    - "User can add custom mistakes to their personal mistake library"
    - "System tracks frequency and impact of different mistake types"
    - "Analytics show mistake patterns and trends over time"
    - "Mistake data integrates with existing trade analytics"
  artifacts:
    - path: "src/types/mistake.ts"
      provides: "Mistake tracking and analytics type definitions"
      min_lines: 40
    - path: "src/components/analytics/mistake-tracker.tsx"
      provides: "Mistake selection and tracking interface"
      exports: ["MistakeTracker"]
    - path: "src/lib/analytics.ts"
      provides: "Enhanced analytics including mistake metrics"
      contains: "getMistakeAnalytics"
    - path: "prisma/schema.prisma"
      provides: "TradeMistake and MistakeCategory models"
      contains: "model TradeMistake"
  key_links:
    - from: "src/components/analytics/mistake-tracker.tsx"
      to: "/api/analytics/mistakes"
      via: "mistake CRUD operations"
      pattern: "fetch.*api/analytics/mistakes"
    - from: "src/lib/analytics.ts"
      to: "TradeMistake database model"
      via: "mistake analytics queries"
      pattern: "prisma.tradeMistake"
    - from: "src/components/journaling/mistake-selector.tsx"
      to: "src/types/mistake.ts"
      via: "mistake type definitions"
      pattern: "MistakeCategory"
---

<objective>
Implement comprehensive mistake tracking and enhanced analytics system for trading performance improvement.

Purpose: Help traders identify patterns in their mistakes and improve decision-making through data-driven insights
Output: Mistake tracking system with predefined categories, custom mistakes, and analytics integration
</objective>

<execution_context>
@/Users/husammeshri/.claude/get-shit-done/workflows/execute-plan.md
@/Users/husammeshri/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/research/phase-2-research.md
@src/types/trade.ts
@src/types/position.ts
@src/lib/analytics.ts
@src/components/analytics/analytics-dashboard.tsx
</context>

<tasks>

<task type="auto">
  <name>Create Mistake Types and Database Schema</name>
  <files>
    src/types/mistake.ts
    prisma/schema.prisma
  </files>
  <action>
    Create comprehensive mistake types in src/types/mistake.ts:
    - MistakeCategory interface with predefined categories (emotional, risk, strategy, timing)
    - PredefinedMistake interface with id, label, category, description
    - TradeMistake interface linking trades to mistakes with severity
    - CustomMistake interface for user-defined mistakes
    - MistakeAnalytics interface for frequency and impact metrics
    - MistakeFilter interface for analytics filtering
    - Export PREDEFINED_MISTAKES constant array following research pattern
    
    Update prisma/schema.prisma to add mistake models:
    - TradeMistake model with tradeId, mistakeType, customLabel, severity, notes, createdAt
    - MistakeCategory model for user's custom mistake categories
    - CustomMistake model for user-defined mistakes with category
    - Add relations to Trade model for mistake tracking
    - Include indexes for analytics performance
    
    Run prisma db push to apply changes.
  </action>
  <verify>npx prisma db push succeeds and mistake models exist in database</verify>
  <done>Mistake tracking database schema supports both predefined and custom mistake categories</done>
</task>

<task type="auto">
  <name>Enhance Analytics Service with Mistake Metrics</name>
  <files>
    src/lib/analytics.ts
  </files>
  <action>
    Extend existing analytics service with mistake tracking:
    - Add getMistakeAnalytics function returning frequency, impact, trends
    - Add getMostCommonMistakes function for top mistake categories
    - Add getMistakesByTimeframe function for trend analysis
    - Add getMistakeImpact function calculating P&L impact per mistake type
    - Add getUserMistakeCategories function for custom mistakes
    - Enhance existing analytics functions to include mistake data:
      - Update getTradeMetrics to include mistake frequency
      - Update getPNLAnalytics to show mistake-related losses
      - Add mistake filtering to existing analytics functions
    - Include mistake data in trade summaries and position analytics
    
    Maintain backward compatibility with existing analytics while adding mistake insights.
  </action>
  <verify>Existing analytics functions still work and new mistake functions return valid data</verify>
  <done>Analytics service provides comprehensive mistake tracking and impact analysis</done>
</task>

<task type="auto">
  <name>Create Mistake Selector Component</name>
  <files>
    src/components/journaling/mistake-selector.tsx
  </files>
  <action>
    Create mistake selection component following research pattern:
    - Display predefined mistakes in categorized groups (emotional, risk, strategy, timing)
    - Multi-select checkboxes for common mistakes
    - Custom mistake input field with category selection
    - Severity selector (low, medium, high) for each mistake
    - Emotional state selector (confident, fearful, greedy, neutral)
    - Notes field for mistake details and learning points
    - Real-time mistake frequency display for user awareness
    - Search and filter functionality for large mistake lists
    - Integration with existing trade journal components
    
    Use research's PREDEFINED_MISTAKES constant for base mistake categories.
    Follow existing UI patterns from analytics components for consistency.
  </action>
  <verify>Component renders mistake categories and allows selection without errors</verify>
  <done>Mistake selector provides comprehensive interface for mistake tracking and categorization</done>
</task>

<task type="auto">
  <name>Create Mistake Analytics Components</name>
  <files>
    src/components/analytics/mistake-tracker.tsx
    src/components/analytics/mistake-analytics.tsx
  </files>
  <action>
    Create mistake-tracker.tsx for mistake overview:
    - Display mistake frequency metrics and trends
    - Show most common mistakes with impact analysis
    - Mistake category breakdown with visual charts
    - P&L impact per mistake type
    - Mistake improvement trends over time
    - Quick links to trades with specific mistakes
    
    Create mistake-analytics.tsx for detailed analysis:
    - Mistake frequency charts by time period
    - Mistake severity distribution
    - Correlation between mistakes and P&L performance
    - Mistake pattern analysis (time of day, market conditions)
    - Learning progress tracking (reducing mistake frequency)
    - Comparative analysis between mistake types
    - Export functionality for mistake reports
    
    Use recharts for visualizations and follow existing analytics component patterns.
  </action>
  <verify>Components render with mock mistake data and charts display correctly</verify>
  <done>Mistake analytics components provide actionable insights for trading improvement</done>
</task>

<task type="auto">
  <name>Enhance Existing Analytics with Mistake Integration</name>
  <files>
    src/components/analytics/enhanced-metrics.tsx
  </files>
  <action>
    Create enhanced metrics component that extends existing metrics-overview.tsx:
    - Add mistake-related metrics to existing dashboard cards
    - Include "Mistake Rate" card showing percentage of trades with mistakes
    - Add "Top Mistake" card highlighting most frequent mistake
    - Include "Mistake Impact" card showing P&L loss from mistakes
    - Enhance existing win rate calculation to exclude mistake-related losses
    - Add mistake trend indicators (improving/declining)
    - Include mistake-free trade streaks tracking
    - Integrate with existing analytics dashboard layout
    
    Update analytics-dashboard.tsx to include enhanced metrics alongside existing components.
    Maintain all existing functionality while adding mistake insights.
  </action>
  <verify>Enhanced metrics display correctly and don't break existing analytics dashboard</verify>
  <done>Existing analytics dashboard enhanced with mistake tracking insights</done>
</task>

<task type="auto">
  <name>Create Mistake API Endpoints</name>
  <files>
    src/app/api/analytics/mistakes/route.ts
  </files>
  <action>
    Create comprehensive mistake API following existing analytics patterns:
    - GET: Fetch mistake analytics with filtering (timeframe, severity, category)
    - POST: Add mistake to trade with validation
    - PUT: Update mistake details (severity, notes)
    - DELETE: Remove mistake from trade
    - Support query params: tradeId, category, severity, dateFrom, dateTo
    - Include mistake frequency calculations and impact analysis
    - Return both individual mistake data and aggregate analytics
    - Proper authentication using Clerk
    - Validation using Zod schemas for mistake data
    - Error handling with appropriate HTTP status codes
    
    Include endpoints for:
    - /api/analytics/mistakes/categories (get user's custom categories)
    - /api/analytics/mistakes/trends (mistake frequency over time)
    - /api/analytics/mistakes/impact (P&L impact by mistake type)
  </action>
  <verify>API endpoints return valid mistake data and analytics with proper authentication</verify>
  <done>Mistake API supports full CRUD operations and provides comprehensive analytics data</done>
</task>

<task type="auto">
  <name>Create Mistake Analytics Dashboard Page</name>
  <files>
    src/app/dashboard/mistakes/page.tsx
  </files>
  <action>
    Create dedicated mistake analytics page following existing dashboard patterns:
    - Server-side page component with mistake analytics data
    - Include MistakeTracker component for overview metrics
    - Include MistakeAnalytics component for detailed analysis
    - Add filtering controls (time period, mistake category, severity)
    - Include mistake learning insights and improvement recommendations
    - Export functionality for mistake reports
    - Integration with trade details for mistake context
    - Responsive layout matching existing dashboard pages
    
    Update navigation sidebar to include "Mistakes" link between Positions and other sections.
    Add breadcrumb navigation and proper page metadata.
    Include loading states and error boundaries.
  </action>
  <verify>Visit localhost:3000/dashboard/mistakes shows mistake analytics and navigation works</verify>
  <done>Mistake analytics dashboard provides comprehensive mistake tracking and improvement insights</done>
</task>

</tasks>

<verification>
MIST-01: User can select from predefined entry mistakes list ✓
MIST-02: User can select from predefined exit mistakes list ✓
MIST-03: User can add custom mistakes to their personal list ✓
MIST-04: System tracks frequency of mistake types ✓
Enhanced analytics include mistake impact on performance ✓
Mistake data integrates with existing trade analytics seamlessly ✓
</verification>

<success_criteria>
- Users can categorize and track mistakes using predefined and custom categories
- Mistake analytics reveal patterns and trends in trading behavior
- System calculates P&L impact of different mistake types
- Mistake tracking integrates seamlessly with existing analytics dashboard
- Users receive actionable insights for trading improvement
- Mistake frequency tracking shows improvement over time
- All mistake data persists and remains searchable across sessions
</success_criteria>

<output>
After completion, create `.planning/phases/02-analytics-advanced-journaling/02-03-mistake-tracking-analytics-SUMMARY.md`
</output>