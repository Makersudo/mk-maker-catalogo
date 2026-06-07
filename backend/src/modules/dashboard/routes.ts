import { Router } from 'express';
import { getSupabaseAdmin } from '../../lib/supabase.js';
import { ApiError, handleError, ok } from '../../lib/http.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { parseAnalyticsRange } from './analyticsPeriod.js';
import { createAnalyticsRepository } from './analyticsRepository.js';
import { clearDashboardAnalyticsCache, getCachedDashboardAnalytics } from './analyticsService.js';
import { captureDailySnapshot } from './snapshot.js';
import { buildDashboardOverview, loadDashboardCurrent } from './overviewService.js';

export const dashboardRouter = Router();

function analyticsRange(input: Record<string, unknown>) {
  try {
    return parseAnalyticsRange(input);
  } catch (error) {
    throw new ApiError(400, error instanceof Error ? error.message : 'Parametros de analise invalidos.');
  }
}

dashboardRouter.get('/analytics', requireAuth, async (req, res) => {
  try {
    const range = analyticsRange({
      period: req.query.period,
      from: req.query.from,
      to: req.query.to,
      categoryId: req.query.categoryId,
    });
    const supabase = getSupabaseAdmin();
    const data = await getCachedDashboardAnalytics(range, createAnalyticsRepository(supabase));
    return ok(res, data);
  } catch (error) {
    return handleError(res, error);
  }
});

dashboardRouter.get('/overview', requireAuth, async (req, res) => {
  try {
    const range = analyticsRange({
      period: req.query.period,
      from: req.query.from,
      to: req.query.to,
      categoryId: req.query.categoryId,
    });
    const supabase = getSupabaseAdmin();
    const data = await buildDashboardOverview({
      loadCurrent: () => loadDashboardCurrent(supabase, range),
      loadAnalytics: () => getCachedDashboardAnalytics(range, createAnalyticsRepository(supabase)),
    });
    return ok(res, data);
  } catch (error) {
    return handleError(res, error);
  }
});

dashboardRouter.post('/analytics/snapshots', requireAuth, async (req, res) => {
  try {
    const requestedDate = typeof req.body?.snapshotDate === 'string' ? req.body.snapshotDate : undefined;
    const snapshotDate = requestedDate
      ? analyticsRange({ period: 'daily', from: requestedDate, to: requestedDate }).from
      : analyticsRange({ period: 'daily' }).to;
    const data = await captureDailySnapshot(getSupabaseAdmin(), snapshotDate);
    clearDashboardAnalyticsCache();
    return ok(res, data, 201);
  } catch (error) {
    return handleError(res, error);
  }
});

dashboardRouter.get('/stats', requireAuth, async (_req, res) => {
  try {
    return ok(res, await loadDashboardCurrent(getSupabaseAdmin()));
  } catch (error) {
    return handleError(res, error);
  }
});

