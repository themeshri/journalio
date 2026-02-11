---
phase: 02-analytics-advanced-journaling
plan: 04
type: execute
wave: 1
depends_on: []
files_modified:
  - src/types/trade.ts
  - src/components/trades/manual-trade-form.tsx
  - src/components/trades/trade-editor.tsx
  - src/components/trades/trade-actions.tsx
  - src/components/analytics/enhanced-trade-filters.tsx
  - src/app/api/trades/manual/route.ts
  - src/app/api/trades/[tradeId]/route.ts
  - src/app/dashboard/trades/add/page.tsx
  - src/app/dashboard/trades/edit/[tradeId]/page.tsx
  - prisma/schema.prisma
autonomous: true

must_haves:
  truths:
    - "User can manually add missing trades with all necessary details"
    - "User can edit existing trade details like price, quantity, and metadata"
    - "User can delete incorrect or duplicate trades safely"
    - "Manual trades integrate seamlessly with imported trades in analytics"
    - "Advanced filtering works across all trade data with improved performance"
  artifacts:
    - path: "src/components/trades/manual-trade-form.tsx"
      provides: "Comprehensive manual trade creation form"
      min_lines: 120
    - path: "src/components/trades/trade-editor.tsx"
      provides: "Trade editing interface with validation"
      exports: ["TradeEditor"]
    - path: "src/app/api/trades/manual/route.ts"
      provides: "Manual trade CRUD API endpoints"
      exports: ["GET", "POST", "PUT", "DELETE"]
    - path: "prisma/schema.prisma"
      provides: "Enhanced Trade model with manual trade support"
      contains: "source enum"
  key_links:
    - from: "src/components/trades/manual-trade-form.tsx"
      to: "/api/trades/manual"
      via: "trade creation API"
      pattern: "fetch.*api/trades/manual"
    - from: "src/components/analytics/enhanced-trade-filters.tsx"
      to: "/api/analytics/trades"
      via: "enhanced filtering API"
      pattern: "fetch.*api/analytics/trades"
    - from: "src/components/trades/trade-editor.tsx"
      to: "/api/trades/[tradeId]"
      via: "trade update API"
      pattern: "fetch.*api/trades/"
---

<objective>
Implement comprehensive manual trade management system with creation, editing, and deletion capabilities.

Purpose: Allow users to add missing trades and correct inaccurate data for complete trading records
Output: Full trade management interface with enhanced filtering and seamless integration with existing analytics
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
@src/components/analytics/trades-table.tsx
@src/components/analytics/trade-filters.tsx
@src/lib/analytics.ts
</context>

<tasks>

<task type="auto">
  <name>Enhance Trade Types and Database Schema</name>
  <files>
    src/types/trade.ts
    prisma/schema.prisma
  </files>
  <action>
    Extend trade types in src/types/trade.ts:
    - Add ManualTradeInput interface for manual trade creation
    - Add TradeSource enum ('imported', 'manual') to distinguish trade origins
    - Add TradeEditInput interface for trade modification
    - Add TradeValidation interface for form validation
    - Extend ParsedTrade interface with editableFields array
    - Add TradeFormData interface with all required fields for manual entry
    - Add TradeActionType enum for audit logging
    
    Update prisma/schema.prisma Trade model:
    - Add 'source' field with enum ('IMPORTED', 'MANUAL')
    - Add 'isEditable' boolean field (imported trades may have restrictions)
    - Add 'originalData' JSON field to preserve import data before edits
    - Add 'lastModified' timestamp for tracking changes
    - Add 'modifiedBy' user reference for audit trail
    - Add TradeAuditLog model for tracking all trade changes
    - Update indexes for improved filtering performance
    
    Run prisma db push to apply schema changes.
  </action>
  <verify>npx prisma db push succeeds and enhanced Trade model includes manual trade support</verify>
  <done>Trade schema supports manual creation, editing, and audit tracking</done>
</task>

<task type="auto">
  <name>Create Manual Trade Form Component</name>
  <files>
    src/components/trades/manual-trade-form.tsx
  </files>
  <action>
    Create comprehensive manual trade form with React Hook Form:
    - Trade type selection (buy, sell, swap) with conditional fields
    - Token input/output with search and validation using existing token data
    - Price inputs with real-time USD conversion estimates
    - Quantity inputs with decimal precision handling
    - Date and time selection with timezone handling
    - DEX/exchange selection with popular options
    - Fee input fields (gas fees, trading fees)
    - Transaction signature field (optional) for linking to blockchain
    - Notes field for additional context
    - Validation using Zod schemas with comprehensive error messages
    - Auto-calculation of P&L based on inputs
    - Form persistence (save draft) for partially completed trades
    - Import from CSV/spreadsheet functionality for bulk entry
    
    Use shadcn/ui form components and follow existing UI patterns.
    Include proper TypeScript typing for all form fields.
  </action>
  <verify>Form renders correctly and validation works for all trade types</verify>
  <done>Manual trade form provides comprehensive interface for trade entry with validation</done>
</task>

<task type="auto">
  <name>Create Trade Editor Component</name>
  <files>
    src/components/trades/trade-editor.tsx
  </files>
  <action>
    Create trade editing component for modifying existing trades:
    - Pre-populate form with existing trade data
    - Show original vs. modified values with visual diff
    - Restrict editing of certain fields for imported trades (preserve data integrity)
    - Add confirmation dialog for significant changes (price, quantity)
    - Include audit trail display showing previous modifications
    - Support batch editing for multiple selected trades
    - Add "Revert to Original" option for imported trades
    - Include change summary before saving modifications
    - Validation to ensure edited trades remain internally consistent
    - Auto-recalculate dependent values (P&L, fees) when base values change
    
    Build on manual-trade-form.tsx with additional editing-specific features.
    Include proper permissions (only trade owner can edit).
  </action>
  <verify>Editor pre-populates with trade data and saves changes correctly</verify>
  <done>Trade editor allows safe modification of existing trades with audit trail</done>
</task>

<task type="auto">
  <name>Create Trade Actions Component</name>
  <files>
    src/components/trades/trade-actions.tsx
  </files>
  <action>
    Create trade action component for bulk operations:
    - Multi-select checkboxes for trade table rows
    - Bulk delete with confirmation dialog and impact analysis
    - Bulk edit for common fields (tags, notes, DEX)
    - Export selected trades to CSV format
    - Duplicate trade functionality for similar trades
    - Move trades between wallets (for organization)
    - Archive/unarchive trades (soft delete functionality)
    - Bulk mistake assignment for similar error patterns
    - Integration with existing trades-table.tsx component
    - Keyboard shortcuts for common actions (delete, edit, select all)
    
    Include proper confirmation dialogs for destructive actions.
    Show impact analysis (P&L changes) before bulk operations.
  </action>
  <verify>Component integrates with trades table and bulk actions work correctly</verify>
  <done>Trade actions component provides efficient bulk trade management capabilities</done>
</task>

<task type="auto">
  <name>Create Enhanced Trade Filters</name>
  <files>
    src/components/analytics/enhanced-trade-filters.tsx
  </files>
  <action>
    Enhance existing trade filters with advanced capabilities:
    - Trade source filter (imported vs manual)
    - Date range picker with preset ranges (7d, 30d, 90d, YTD, custom)
    - Token/symbol filter with autocomplete from user's trading history
    - Price range filter (min/max price per token)
    - Volume range filter (USD value of trades)
    - P&L range filter (profit/loss amount)
    - DEX/exchange multi-select filter
    - Trade type filter (buy/sell/swap)
    - Mistake filter (trades with/without mistakes, specific mistake types)
    - Journal filter (trades with/without notes, voice recordings, files)
    - Advanced search with query syntax (token:SOL, profit:>100, date:2024)
    - Filter presets (save and load common filter combinations)
    - URL state preservation for shareable filtered views
    
    Extend existing trade-filters.tsx component with these advanced features.
    Maintain backward compatibility with existing filter functionality.
  </action>
  <verify>Enhanced filters work with existing trades table and preserve state correctly</verify>
  <done>Advanced filtering provides powerful trade discovery and analysis capabilities</done>
</task>

<task type="auto">
  <name>Create Manual Trade API Endpoints</name>
  <files>
    src/app/api/trades/manual/route.ts
    src/app/api/trades/[tradeId]/route.ts
  </files>
  <action>
    Create manual trade API (manual/route.ts):
    - POST: Create new manual trade with comprehensive validation
    - GET: Fetch manual trades with same filtering as imported trades
    - Include duplicate detection to prevent accidental double-entry
    - Validation using Zod schemas with detailed error messages
    - Integration with existing analytics calculations
    - Proper audit logging for manual trade creation
    
    Create trade modification API ([tradeId]/route.ts):
    - GET: Fetch individual trade details with edit permissions
    - PUT: Update existing trade with change tracking
    - DELETE: Safe trade deletion with dependency checking
    - Preserve original imported data when editing imported trades
    - Recalculate position and analytics data after modifications
    - Include change impact analysis (P&L effects, position changes)
    - Authentication and authorization checks (user owns trade)
    - Rate limiting to prevent abuse
    
    Follow existing API patterns from analytics endpoints.
  </action>
  <verify>API endpoints handle trade CRUD operations correctly with proper validation</verify>
  <done>Trade APIs support manual trade management with safety checks and audit trails</done>
</task>

<task type="auto">
  <name>Create Trade Management Pages</name>
  <files>
    src/app/dashboard/trades/add/page.tsx
    src/app/dashboard/trades/edit/[tradeId]/page.tsx
  </files>
  <action>
    Create add trade page (add/page.tsx):
    - Server-side page component with form for manual trade entry
    - Include ManualTradeForm component with proper error handling
    - Breadcrumb navigation (Dashboard > Trades > Add Trade)
    - Success/error feedback with redirect to trade details
    - Form state persistence for partially completed entries
    - Integration with existing wallet selection
    - Quick action shortcuts (duplicate similar trade, import from template)
    
    Create edit trade page (edit/[tradeId]/page.tsx):
    - Server-side page with trade data loading by ID
    - Include TradeEditor component with existing trade data
    - Permission checks (user owns trade, trade is editable)
    - Change preview and confirmation flow
    - Audit history display for previously modified trades
    - Revert options and backup preservation
    - Integration with analytics impact calculation
    
    Update navigation sidebar to include "Add Trade" link in trades section.
    Follow existing dashboard page patterns for consistency.
  </action>
  <verify>Trade management pages render correctly and integrate with existing navigation</verify>
  <done>Trade management pages provide complete manual trade creation and editing workflows</done>
</task>

</tasks>

<verification>
TRAD-06: User can manually add missing trades ✓
TRAD-07: User can edit trade details (price, quantity, notes) ✓
TRAD-08: User can delete incorrect trades ✓
Manual trades integrate seamlessly with imported trades ✓
Enhanced filtering improves trade discovery and analysis ✓
Audit trail preserves trade modification history ✓
</verification>

<success_criteria>
- Users can create manual trades with the same detail level as imported trades
- Trade editing preserves data integrity while allowing necessary corrections
- Trade deletion includes safety checks and impact analysis
- Advanced filtering enables precise trade discovery and analysis
- Manual and imported trades are indistinguishable in analytics and reporting
- All trade modifications maintain audit trails for accountability
- Bulk operations improve efficiency for managing large trade datasets
</success_criteria>

<output>
After completion, create `.planning/phases/02-analytics-advanced-journaling/02-04-manual-trade-management-SUMMARY.md`
</output>