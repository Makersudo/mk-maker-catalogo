import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildDashboardOverview, dashboardOrderRange } from './overviewService.js';

describe('dashboard overview', () => {
  it('links current operational metrics and historical analytics in one response', async () => {
    const current = { totalProducts: 228, catalogMetrics: { summary: { completionScore: 100 } } };
    const analytics = { period: 'monthly', range: { from: '2025-07-01', to: '2026-06-30' } };

    const result = await buildDashboardOverview({
      loadCurrent: async () => current,
      loadAnalytics: async () => analytics,
      now: () => new Date('2026-06-07T12:00:00.000Z'),
    });

    assert.equal(result.generatedAt, '2026-06-07T12:00:00.000Z');
    assert.equal(result.current, current);
    assert.equal(result.analytics, analytics);
  });

  it('creates inclusive Sao Paulo order boundaries for the selected analytics range', () => {
    assert.deepEqual(dashboardOrderRange({
      period: 'daily',
      from: '2026-06-01',
      to: '2026-06-07',
      categoryId: null,
    }), {
      from: '2026-06-01T00:00:00.000-03:00',
      toExclusive: '2026-06-08T00:00:00.000-03:00',
    });
  });
});
