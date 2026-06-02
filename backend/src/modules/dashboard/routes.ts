import { Router } from 'express';
import { getSupabaseAdmin } from '../../lib/supabase.js';
import { handleError, ok } from '../../lib/http.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { buildCatalogMetrics } from './catalogMetrics.js';

export const dashboardRouter = Router();

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

