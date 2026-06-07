import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildDashboardAnalytics,
  clearDashboardAnalyticsCache,
  getCachedDashboardAnalytics,
} from './analyticsService.js';

describe('buildDashboardAnalytics', () => {
  it('merges historical rows and compares with the equivalent previous period', async () => {
    const calls: string[] = [];
    const repository = {
      async loadSales(range: { from: string }) {
        calls.push(`sales:${range.from}`);
        return range.from === '2026-06-01'
          ? [
              { bucket_start: '2026-06-01', revenue: 100, orders: 2, units_sold: 3, average_ticket: 50, realized_gross_profit: 40 },
              { bucket_start: '2026-06-02', revenue: 50, orders: 1, units_sold: 1, average_ticket: 50, realized_gross_profit: 20 },
            ]
          : [{ bucket_start: '2026-05-26', revenue: 100, orders: 2, units_sold: 2, average_ticket: 50, realized_gross_profit: 30 }];
      },
      async loadSnapshots(range: { from: string }) {
        calls.push(`snapshots:${range.from}`);
        return range.from === '2026-06-01'
          ? [{ bucket_start: '2026-06-02', stock_units: 10, inventory_purchase_value: 200, inventory_sale_value: 500, estimated_gross_profit: 300, completion_score: 90 }]
          : [{ bucket_start: '2026-05-31', stock_units: 8, inventory_purchase_value: 180, inventory_sale_value: 400, estimated_gross_profit: 220, completion_score: 80 }];
      },
      async loadProductsCreated(range: { from: string }) {
        return range.from === '2026-06-01'
          ? [{ bucket_start: '2026-06-01', products_created: 2 }]
          : [{ bucket_start: '2026-05-26', products_created: 1 }];
      },
    };

    const result = await buildDashboardAnalytics({
      period: 'daily',
      from: '2026-06-01',
      to: '2026-06-06',
      categoryId: null,
    }, repository);

    assert.equal(result.series.revenue.length, 6);
    assert.equal(result.series.revenue[0].value, 100);
    assert.equal(result.series.revenue[2].value, 0);
    assert.equal(result.previousSeries.revenue.length, 6);
    assert.equal(result.previousSeries.revenue[0].value, 100);
    assert.equal(result.previousSeries.stockUnits.at(-1)?.value, 8);
    assert.equal(result.series.stockUnits.at(-1)?.value, 10);
    assert.equal(result.comparison.revenuePercent, 50);
    assert.equal(result.comparison.ordersPercent, 50);
    assert.equal(result.comparison.stockUnitsPercent, 25);
    assert.equal(result.comparison.realizedGrossProfitPercent, 100);
    assert.equal(result.comparison.productsCreatedPercent, 100);
    assert.equal(result.comparison.inventoryPurchaseValuePercent, 11.1);
    assert.equal(result.comparison.inventorySaleValuePercent, 25);
    assert.equal(result.comparison.completionScorePercent, 12.5);
    assert.ok(calls.includes('sales:2026-05-26'));
  });

  it('returns unavailable comparison when the previous value is zero', async () => {
    const repository = {
      async loadSales() { return []; },
      async loadSnapshots() { return []; },
      async loadProductsCreated() { return []; },
    };

    const result = await buildDashboardAnalytics({
      period: 'monthly',
      from: '2026-01-01',
      to: '2026-06-30',
      categoryId: null,
    }, repository);

    assert.equal(result.comparison.revenuePercent, null);
    assert.equal(result.series.revenue.length, 6);
  });

  it('caches equal ranges and allows explicit invalidation', async () => {
    clearDashboardAnalyticsCache();
    let calls = 0;
    const repository = {
      async loadSales() { calls += 1; return []; },
      async loadSnapshots() { calls += 1; return []; },
      async loadProductsCreated() { calls += 1; return []; },
    };
    const range = { period: 'daily' as const, from: '2026-06-01', to: '2026-06-02', categoryId: null };

    await getCachedDashboardAnalytics(range, repository);
    await getCachedDashboardAnalytics(range, repository);
    assert.equal(calls, 6);

    clearDashboardAnalyticsCache();
    await getCachedDashboardAnalytics(range, repository);
    assert.equal(calls, 12);
  });
});
