import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createAnalyticsRepository } from './analyticsRepository.js';

describe('createAnalyticsRepository', () => {
  it('sends the bounded range to each RPC and normalizes numeric database values', async () => {
    const calls: Array<{ functionName: string; parameters: Record<string, unknown> }> = [];
    const supabase = {
      async rpc(functionName: string, parameters: Record<string, unknown>) {
        calls.push({ functionName, parameters });
        if (functionName === 'dashboard_sales_analytics') {
          return {
            data: [{
              bucket_start: '2026-06-01',
              revenue: '149.90',
              orders: '2',
              units_sold: '3',
              average_ticket: '74.95',
              realized_gross_profit: '60.00',
            }],
            error: null,
          };
        }
        if (functionName === 'dashboard_snapshot_analytics') {
          return {
            data: [{
              bucket_start: '2026-06-01',
              stock_units: '2280',
              inventory_purchase_value: '1000.00',
              inventory_sale_value: '2000.00',
              estimated_gross_profit: '1000.00',
              completion_score: '100',
            }],
            error: null,
          };
        }
        return {
          data: [{ bucket_start: '2026-06-01', products_created: '4' }],
          error: null,
        };
      },
    };
    const range = {
      period: 'daily' as const,
      from: '2026-06-01',
      to: '2026-06-06',
      categoryId: '1f5c9485-d7bb-4e62-8d30-458cfd91ce6c',
    };
    const repository = createAnalyticsRepository(supabase);

    const [sales, snapshots, products] = await Promise.all([
      repository.loadSales(range),
      repository.loadSnapshots(range),
      repository.loadProductsCreated(range),
    ]);

    assert.equal(sales[0].revenue, 149.9);
    assert.equal(sales[0].orders, 2);
    assert.equal(snapshots[0].stock_units, 2280);
    assert.equal(products[0].products_created, 4);
    assert.equal(calls.length, 3);
    assert.deepEqual(calls[0].parameters, {
      p_period: 'daily',
      p_from: '2026-06-01',
      p_to: '2026-06-06',
      p_category_id: '1f5c9485-d7bb-4e62-8d30-458cfd91ce6c',
    });
  });

  it('propagates RPC errors instead of returning incomplete analytics', async () => {
    const expected = new Error('rpc unavailable');
    const repository = createAnalyticsRepository({
      async rpc() {
        return { data: null, error: expected };
      },
    });

    await assert.rejects(
      repository.loadSales({
        period: 'daily',
        from: '2026-06-01',
        to: '2026-06-01',
        categoryId: null,
      }),
      expected
    );
  });
});
