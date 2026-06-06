# Dashboard Historical Analytics Design

## Objective

Add reliable historical analytics to the MK Maker admin dashboard so the catalog owner can inspect daily, weekly, monthly, and yearly performance. The feature must support real trend charts, previous-period comparisons, inventory history, catalog health history, and category-level analysis without weakening the existing dashboard summary.

## Current State

The current `GET /api/dashboard/stats` route calculates the catalog summary from the current products and categories plus the latest 500 orders. This is sufficient for an operational snapshot, but it is not reliable for annual sales analysis and cannot reconstruct past inventory or catalog-health values.

Orders and order items are immutable business events that can reconstruct sales history. Inventory, purchase value, sale potential, image coverage, publication status, and completion score are mutable state and therefore require daily snapshots.

The current order item does not preserve purchase cost or category labels at the moment of sale. These fields must be copied into the order item during checkout; otherwise later product edits would retroactively change historical profit and category reports.

## Architecture Decision

Use a hybrid model:

1. Derive sales and product-creation history from source tables.
2. Capture mutable catalog and inventory state in daily snapshots.
3. Aggregate daily data into weekly, monthly, and yearly buckets at query time.
4. Keep the existing dashboard summary route for the current operational view.
5. Add a separate authenticated historical analytics route for trend data.

Weekly, monthly, and yearly snapshots will not be stored. Daily rows remain the canonical history and prevent duplicated or inconsistent aggregates.

## Database Contract

### Global Daily Snapshots

Create `public.analytics_daily_snapshots` with one row per calendar date:

- `id uuid primary key`
- `snapshot_date date not null unique`
- `timezone text not null default 'America/Sao_Paulo'`
- `total_products integer`
- `active_products integer`
- `live_products integer`
- `products_with_image integer`
- `products_without_image integer`
- `products_with_purchase_cost integer`
- `stock_total_units integer`
- `healthy_stock_products integer`
- `low_stock_products integer`
- `zero_stock_products integer`
- `inventory_purchase_value numeric(14,2)`
- `inventory_sale_value numeric(14,2)`
- `estimated_gross_profit numeric(14,2)`
- `featured_products integer`
- `promo_products integer`
- `new_products integer`
- `completion_score integer`
- `metadata jsonb not null default '{}'`
- `created_at timestamptz`
- `updated_at timestamptz`

The snapshot date is unique and writes use UPSERT, making retries idempotent.

### Category Daily Snapshots

Create `public.analytics_category_daily_snapshots`:

- `id uuid primary key`
- `snapshot_date date not null`
- `category_id uuid references categories(id) on delete cascade`
- `category_name text not null`
- `total_products integer`
- `active_products integer`
- `live_products integer`
- `stock_total_units integer`
- `inventory_purchase_value numeric(14,2)`
- `inventory_sale_value numeric(14,2)`
- `created_at timestamptz`
- unique constraint on `(snapshot_date, category_id)`

Category sales and units sold continue to be derived from orders because they are historical events.

### Immutable Sale Dimensions

Extend `public.order_items` with:

- `unit_purchase_cost numeric(12,2) not null default 0`
- `cost_subtotal numeric(12,2) not null default 0`
- `category_id uuid null`
- `category_name text null`
- `subcategory_id uuid null`
- `subcategory_name text null`

New orders copy these values from the product at checkout. Existing order items can be backfilled from the current product state, but their historical cost/category accuracy must be marked as approximate.

## Snapshot Capture

Add a focused analytics snapshot service in the backend. It loads products, variants, images, and categories, reuses the existing catalog-metric rules where possible, and writes the global and category daily snapshots inside an idempotent process.

The service accepts an optional `snapshotDate`, enabling retries and controlled backfills. A CLI script will invoke the service for Render Cron. The scheduled execution should run at `02:55 UTC`, corresponding to `23:55 America/Sao_Paulo`, while all snapshot-date and bucket calculations explicitly use `America/Sao_Paulo`.

Past sales can be reconstructed immediately from orders. Past stock and catalog-health data cannot be reconstructed accurately and will begin on the first snapshot date.

## Historical Analytics API

Add:

`GET /api/dashboard/analytics?period=daily|weekly|monthly|yearly&from=YYYY-MM-DD&to=YYYY-MM-DD&categoryId=UUID`

The route is admin-authenticated and validates period and date range. Defaults:

- daily: last 30 days
- weekly: last 12 weeks
- monthly: last 12 months
- yearly: last 5 years

Response:

```ts
interface DashboardAnalyticsResponse {
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  timezone: 'America/Sao_Paulo';
  range: { from: string; to: string };
  series: {
    revenue: TrendPoint[];
    orders: TrendPoint[];
    unitsSold: TrendPoint[];
    averageTicket: TrendPoint[];
    productsCreated: TrendPoint[];
    stockUnits: TrendPoint[];
    inventoryPurchaseValue: TrendPoint[];
    inventorySaleValue: TrendPoint[];
    estimatedGrossProfit: TrendPoint[];
    realizedGrossProfit: TrendPoint[];
    completionScore: TrendPoint[];
  };
  comparison: {
    revenuePercent: number | null;
    ordersPercent: number | null;
    unitsSoldPercent: number | null;
    averageTicketPercent: number | null;
    stockUnitsPercent: number | null;
    estimatedGrossProfitPercent: number | null;
    realizedGrossProfitPercent: number | null;
  };
}
```

Sales aggregation must execute in PostgreSQL rather than loading all orders into Node.js. Cancelled orders do not count as valid revenue. Calendar boundaries use `America/Sao_Paulo`. When `categoryId` is supplied, sales use the immutable category fields stored in order items.

## Dashboard Experience

Add a period segmented control: `Diario`, `Semanal`, `Mensal`, `Anual`.

The dashboard will request one historical payload per selected period and use it for:

- revenue
- orders
- units sold
- average ticket
- stock units
- purchase inventory value
- sale inventory value
- estimated gross profit
- realized gross profit from completed order items
- catalog completion score

Mini Spark Charts use real series only. Animated counters run when data or period changes. SVG path drawing is limited to chart paths and score indicators. Stagger reveal is used for section and card entry. All motion respects reduced-motion preferences.

The interface must include loading skeletons, retryable errors, and an explicit state explaining when mutable historical data has not yet accumulated.

## Security And Reliability

- Analytics routes require the existing admin authentication.
- Snapshot tables use RLS and are not publicly readable.
- Cron execution uses backend service-role access.
- Snapshot capture is idempotent and records the target date.
- Queries have bounded date ranges.
- Relevant date and category indexes are created.
- API responses can use short-lived in-memory caching, but correctness cannot depend on cache.

## Validation

Backend tests cover:

- period/date-range validation
- daily, weekly, monthly, and yearly bucket boundaries
- `America/Sao_Paulo` timezone behavior
- cancelled order exclusion
- immutable sale cost and category preservation
- zero previous-period comparison
- days without sales
- idempotent snapshot retries
- global and category snapshot values

Frontend tests cover:

- period switching
- loading, error, and empty-history states
- real series rendered in charts
- reduced-motion behavior
- responsive dashboard layout

## Rollout

1. Apply snapshot tables and SQL aggregation functions.
2. Deploy snapshot service and capture the first snapshot.
3. Backfill reconstructable order history.
4. Deploy historical analytics API.
5. Connect the dashboard period control and trend components.
6. Enable the daily Render Cron after production verification.
