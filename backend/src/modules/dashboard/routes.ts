import { Router } from 'express';
import { getSupabaseAdmin } from '../../lib/supabase.js';
import { ApiError, handleError, ok } from '../../lib/http.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { buildCatalogMetrics } from './catalogMetrics.js';
import { parseAnalyticsRange } from './analyticsPeriod.js';
import { createAnalyticsRepository } from './analyticsRepository.js';
import { clearDashboardAnalyticsCache, getCachedDashboardAnalytics } from './analyticsService.js';
import { captureDailySnapshot } from './snapshot.js';

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
    const supabase = getSupabaseAdmin();
    const [
      products,
      activeProducts,
      categories,
      featuredProducts,
      promoProducts,
      recentProducts,
      orders,
      catalogProducts,
      catalogCategories,
      catalogOrders,
    ] = await Promise.all([
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('categories').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_featured', true),
      supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_promo', true),
      supabase.from('products').select('id,title,price,product_images(url,sort_order)').order('created_at', { ascending: false }).limit(4),
      supabase.from('orders').select('id,total_amount,status,created_at', { count: 'exact' }).order('created_at', { ascending: false }).limit(10),
      supabase
        .from('products')
        .select('id,title,price,purchase_cost,audience,catalog_status,is_active,is_featured,is_promo,is_new,stock_quantity,variants_enabled,category_id,subcategory_id,created_at,category:categories!products_category_id_fkey(id,name,slug),subcategory:categories!products_subcategory_id_fkey(id,name,slug),product_images(id,url),product_variants(id,price,stock_quantity,is_active)'),
      supabase
        .from('categories')
        .select('id,name,slug,parent_id,is_active'),
      supabase
        .from('orders')
        .select('id,total_amount,status,created_at,order_items(product_id,quantity,subtotal)')
        .order('created_at', { ascending: false })
        .limit(500),
    ]);

    const failed = [
      products,
      activeProducts,
      categories,
      featuredProducts,
      promoProducts,
      recentProducts,
      orders,
      catalogProducts,
      catalogCategories,
      catalogOrders,
    ].find((result) => result.error);
    if (failed?.error) throw failed.error;

    const catalogMetrics = buildCatalogMetrics({
      products: (catalogProducts.data ?? []) as any[],
      categories: (catalogCategories.data ?? []) as any[],
      orders: (catalogOrders.data ?? []) as any[],
    });

    return ok(res, {
      totalProducts: products.count ?? 0,
      activeProducts: activeProducts.count ?? 0,
      inactiveProducts: Math.max((products.count ?? 0) - (activeProducts.count ?? 0), 0),
      categories: categories.count ?? 0,
      featuredProducts: featuredProducts.count ?? 0,
      promoProducts: promoProducts.count ?? 0,
      orders: orders.count ?? 0,
      recentProducts: recentProducts.data ?? [],
      recentOrders: orders.data ?? [],
      catalogMetrics,
    });
  } catch (error) {
    return handleError(res, error);
  }
});

