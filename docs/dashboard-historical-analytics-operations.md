# Dashboard Historical Analytics Operations

## Purpose

The historical dashboard combines immutable order events with daily snapshots of mutable catalog state.

- Sales, orders, units, and realized profit are reconstructed from `orders` and `order_items`.
- Stock, inventory values, publication state, and catalog quality begin on the first daily snapshot.
- Legacy order-item costs and categories are backfilled from the current product state and are therefore approximate.
- Category snapshots retain their historical id and name even if the category is later removed from the live catalog.
- Missing snapshot days reuse the last known snapshot in historical charts instead of resetting stock and inventory values to zero.

## Deployment Order

1. Apply `supabase/migrations/20260606010000_dashboard_historical_analytics.sql`.
2. Deploy the backend.
3. Capture the first snapshot.
4. Verify all four analytics periods through the authenticated admin dashboard.
5. Deploy the frontend.
6. Configure and monitor the GitHub Actions snapshot workflow.

## First Snapshot

Run from the backend workspace with production Supabase variables configured:

```powershell
npm run analytics:snapshot
```

To recapture a specific calendar date:

```powershell
npm run analytics:snapshot -- --date=2026-06-06
```

Snapshot writes are idempotent. Re-running the same date replaces that date's global and category rows.

## Schedule

`.github/workflows/analytics-snapshot.yml` runs at `02:55 UTC`, equivalent to `23:55 America/Sao_Paulo`, and also supports manual execution.

The repository Actions secrets must contain:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Verification

Backend:

```powershell
npm test --workspace backend
npm run lint --workspace backend
npm run build --workspace backend
```

Frontend:

```powershell
npm run lint --workspace frontend
npm run build --workspace frontend
```

Production checks:

1. Confirm `/api/health` returns HTTP 200.
2. Log into the admin dashboard.
3. Verify Diario, Semanal, Mensal, and Anual.
4. Verify at least one category filter.
5. Compare revenue and order totals against direct Supabase SQL.
6. Confirm cancelled orders are excluded.
7. Confirm a newly created order preserves `unit_purchase_cost`, `cost_subtotal`, category, and subcategory.

Direct SQL reconciliation for a selected date range:

```sql
select
  count(*) filter (where status <> 'cancelled') as valid_orders,
  coalesce(sum(total_amount) filter (where status <> 'cancelled'), 0) as valid_revenue
from public.orders
where (created_at at time zone 'America/Sao_Paulo')::date between date '2026-06-01' and date '2026-06-30';
```

Compare those values with `dashboard_sales_analytics('monthly', '2026-06-01', '2026-06-30', null)`.

## Rollback

1. Disable the `Capture analytics snapshot` GitHub Actions workflow before rolling back application code.
2. Roll back frontend and backend deployments together so the dashboard does not call unavailable RPCs.
3. Keep snapshot tables and sale-time order-item fields during rollback; dropping historical data is not required and is intentionally avoided.
4. Remove analytics tables, RPCs, or columns only through a separately reviewed destructive migration after confirming no deployed version consumes them.

## Operational Limits

- Historical sales are available as far back as stored orders.
- Historical inventory and catalog health are only reliable from the first snapshot onward.
- If the daily cron fails, rerun the missing date manually.
- Snapshot and analytics RPC access is restricted to the backend service role.
