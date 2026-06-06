# Dashboard Historical Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add reliable daily, weekly, monthly, and yearly analytics to the MK Maker admin dashboard using order events and idempotent daily catalog snapshots.

**Architecture:** Orders and order items remain the source of truth for historical sales. Mutable catalog and inventory state is captured once per day in global and category snapshots. A separate authenticated analytics endpoint aggregates bounded periods and feeds reusable dashboard trend components while the current `/api/dashboard/stats` summary remains compatible.

**Tech Stack:** Express, TypeScript, Supabase/PostgreSQL, React, Vite, motion/react, node:test.

---

### Task 1: Database Snapshot Contract

**Files:**
- Create: `supabase/migrations/20260606010000_dashboard_historical_analytics.sql`
- Modify: `database/schema.sql`

- [ ] Extend `order_items` with immutable purchase cost, cost subtotal, category, and subcategory sale-time fields.
- [ ] Backfill legacy order items from current product data and document that legacy values are approximate.
- [ ] Create `analytics_daily_snapshots` with a unique `snapshot_date`.
- [ ] Create `analytics_category_daily_snapshots` with a unique `(snapshot_date, category_id)` pair.
- [ ] Add non-negative checks to count and monetary fields.
- [ ] Add indexes for snapshot dates and category/date lookups.
- [ ] Enable RLS without public policies so only the backend service role can access snapshots.
- [ ] Add the same canonical table definitions to `database/schema.sql`.

### Task 2: Preserve Immutable Sale-Time Facts

**Files:**
- Modify: `backend/src/modules/orders/routes.ts`
- Modify: `backend/src/modules/orders/createOrder.test.ts`
- Modify: `frontend/src/services/adminOrderService.ts`

- [ ] Expand the product lookup used during checkout to load purchase cost, category, and subcategory.
- [ ] Copy `unit_purchase_cost`, `cost_subtotal`, category, and subcategory fields into every normalized order item.
- [ ] Keep campaign-adjusted sale price separate from immutable purchase cost.
- [ ] Add an order-creation regression test proving later product edits cannot affect the stored sale-time facts.
- [ ] Expose the new fields only in authenticated admin order responses.

### Task 3: Historical Analytics Domain Types And Period Rules

**Files:**
- Create: `backend/src/modules/dashboard/analyticsTypes.ts`
- Create: `backend/src/modules/dashboard/analyticsPeriod.ts`
- Create: `backend/src/modules/dashboard/analyticsPeriod.test.ts`
- Modify: `backend/package.json`

- [ ] Define `AnalyticsPeriod`, `TrendPoint`, response series, comparison, and snapshot payload types.
- [ ] Support an optional validated `categoryId` filter.
- [ ] Implement strict period parsing for `daily`, `weekly`, `monthly`, and `yearly`.
- [ ] Implement default ranges: 30 days, 12 weeks, 12 months, and 5 years.
- [ ] Validate `from`/`to`, reject inverted ranges, and enforce maximum bucket counts.
- [ ] Add tests for defaults, explicit dates, invalid periods, leap dates, and range limits.
- [ ] Register the new test file in the backend test script.

### Task 4: Idempotent Snapshot Calculation

**Files:**
- Create: `backend/src/modules/dashboard/snapshot.ts`
- Create: `backend/src/modules/dashboard/snapshot.test.ts`
- Modify: `backend/src/modules/dashboard/catalogMetrics.ts`
- Modify: `backend/src/modules/dashboard/catalogMetrics.test.ts`
- Modify: `backend/package.json`

- [ ] Extract reusable current-state calculations from `buildCatalogMetrics` without changing its public output.
- [ ] Implement `buildDailySnapshot` for global catalog and inventory values.
- [ ] Implement category snapshot calculation using root catalog categories.
- [ ] Implement `captureDailySnapshot` with UPSERTs for global and category rows.
- [ ] Ensure retries replace the same date instead of creating duplicates.
- [ ] Test purchase values, variant stock, image coverage, low/zero stock, completion score, category totals, and repeated capture.

### Task 5: PostgreSQL Historical Aggregation

**Files:**
- Modify: `supabase/migrations/20260606010000_dashboard_historical_analytics.sql`
- Create: `backend/src/modules/dashboard/analyticsRepository.ts`
- Create: `backend/src/modules/dashboard/analyticsRepository.test.ts`
- Modify: `backend/package.json`

- [ ] Add a PostgreSQL function that aggregates valid orders and order items by requested bucket in `America/Sao_Paulo`.
- [ ] Aggregate realized gross profit from immutable order-item purchase costs.
- [ ] Support optional category filtering using immutable order-item category fields.
- [ ] Exclude cancelled orders from revenue, order count, units sold, and average ticket.
- [ ] Add a PostgreSQL function that aggregates snapshot values by requested bucket.
- [ ] Use the last snapshot in each bucket for point-in-time stock and health metrics.
- [ ] Use bounded parameters and return empty buckets so chart spacing remains stable.
- [ ] Add repository adapters that call the functions and normalize numeric values.
- [ ] Add a product-creation series query grouped by the same requested buckets.
- [ ] Test cancelled orders, category filters, realized profit, empty periods, bucket boundaries, and numeric normalization.

### Task 6: Historical Analytics Service And Comparison

**Files:**
- Create: `backend/src/modules/dashboard/analyticsService.ts`
- Create: `backend/src/modules/dashboard/analyticsService.test.ts`
- Modify: `backend/package.json`

- [ ] Merge sales, product creation, and snapshot series by bucket.
- [ ] Calculate the immediately preceding equivalent date range.
- [ ] Calculate comparison percentages and return `null` when the previous value is zero.
- [ ] Preserve empty buckets instead of dropping dates.
- [ ] Add a short-lived bounded cache keyed by period/from/to.
- [ ] Test merged series, comparisons, empty history, and cache isolation.

### Task 7: Dashboard Analytics And Snapshot Routes

**Files:**
- Modify: `backend/src/modules/dashboard/routes.ts`
- Create: `backend/src/modules/dashboard/routes.test.ts`
- Modify: `backend/package.json`

- [ ] Add authenticated `GET /api/dashboard/analytics`.
- [ ] Validate query parameters before calling the analytics service.
- [ ] Accept an optional category filter without exposing inactive/private data publicly.
- [ ] Return consistent API errors for invalid periods and date ranges.
- [ ] Add protected `POST /api/dashboard/analytics/snapshots` for controlled manual capture.
- [ ] Keep `/api/dashboard/stats` compatible and remove historical assumptions from its latest-500-order data.
- [ ] Test authentication, validation, successful responses, and snapshot capture errors.

### Task 8: Scheduled Snapshot Runner

**Files:**
- Create: `backend/src/scripts/captureAnalyticsSnapshot.ts`
- Modify: `backend/package.json`
- Modify: `render.yaml`
- Modify: `.env.example`

- [ ] Add a CLI script that accepts an optional `--date=YYYY-MM-DD`.
- [ ] Run the same snapshot service used by the protected route.
- [ ] Exit non-zero and log actionable errors on failed capture.
- [ ] Add `analytics:snapshot` to the backend package scripts.
- [ ] Add a Render Cron service scheduled for `02:55 UTC`, equivalent to `23:55 America/Sao_Paulo`.
- [ ] Document required Supabase service-role environment variables for the cron service.

### Task 9: Frontend Analytics Contract And State

**Files:**
- Modify: `frontend/src/services/dashboardService.ts`
- Create: `frontend/src/modules/dashboard/hooks/useDashboardAnalytics.ts`
- Create: `frontend/src/modules/dashboard/hooks/useDashboardAnalytics.test.ts`

- [ ] Add frontend types matching the analytics response contract.
- [ ] Add `getDashboardAnalytics(period, range?)`.
- [ ] Support optional category selection for category-level historical analysis.
- [ ] Implement period state, loading, retry, stale-request protection, and response caching.
- [ ] Default to the daily period without delaying the current dashboard summary.
- [ ] Test period changes, retries, stale responses, and error recovery.

### Task 10: Reusable Historical Visualization Components

**Files:**
- Create: `frontend/src/modules/dashboard/components/AnimatedCounter.tsx`
- Create: `frontend/src/modules/dashboard/components/MiniSparkChart.tsx`
- Create: `frontend/src/modules/dashboard/components/MetricTrendCard.tsx`
- Create: `frontend/src/modules/dashboard/components/PeriodSelector.tsx`
- Create: `frontend/src/modules/dashboard/components/HistoricalAnalyticsPanel.tsx`
- Create: `frontend/src/modules/dashboard/components/HistoricalAnalyticsPanel.test.tsx`

- [ ] Implement counters that animate only when their target changes.
- [ ] Implement accessible SVG spark charts using normalized real series.
- [ ] Draw chart paths with motion while respecting reduced-motion preferences.
- [ ] Implement previous-period delta states: positive, negative, neutral, and unavailable.
- [ ] Implement the period segmented control for daily, weekly, monthly, and yearly views.
- [ ] Implement loading skeleton, retryable error, and insufficient-history states.
- [ ] Test chart rendering, period controls, deltas, and reduced motion.

### Task 11: Dashboard Integration And Motion

**Files:**
- Modify: `frontend/src/modules/dashboard/views/DashboardView.tsx`
- Modify: `frontend/src/modules/dashboard/components/CatalogMetricsModule.tsx`
- Modify: `frontend/src/modules/dashboard/components/HistoricalAnalyticsPanel.tsx`

- [ ] Place the period selector and historical panel before the detailed catalog metrics module.
- [ ] Connect revenue, orders, units sold, average ticket, inventory values, stock, profit, and completion score.
- [ ] Distinguish estimated inventory gross profit from realized sales gross profit.
- [ ] Apply stagger reveal only on first section entry and period changes.
- [ ] Keep existing current-state tabs and cards operational.
- [ ] Avoid animating every re-render.
- [ ] Verify desktop, tablet, and mobile layouts without horizontal overflow.

### Task 12: Production Data Initialization And Validation

**Files:**
- Create: `docs/dashboard-historical-analytics-operations.md`

- [ ] Apply the migration to the target Supabase project.
- [ ] Capture the first global and category snapshot.
- [ ] Verify order history aggregation against direct SQL totals.
- [ ] Verify cancelled orders are excluded.
- [ ] Verify daily, weekly, monthly, and yearly API responses.
- [ ] Verify the Render Cron environment and first scheduled execution.
- [ ] Document the limitation that pre-installation stock/catalog health cannot be reconstructed.
- [ ] Run backend tests, backend build, frontend tests, frontend build, and production route verification.

## Required Validation Commands

```powershell
npm run test --workspace backend
npm run lint --workspace backend
npm run build --workspace backend
npm run test --workspace frontend
npm run lint --workspace frontend
npm run build --workspace frontend
```

After deployment:

```powershell
curl.exe -fsS https://mk-maker-backend.onrender.com/api/health
```

The authenticated analytics routes must then be verified from the deployed admin dashboard for all four periods and for at least one category filter.
