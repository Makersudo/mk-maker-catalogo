import { buildCatalogMetrics } from './catalogMetrics.js';

export async function buildDashboardOverview<TCurrent, TAnalytics>(input: {
  loadCurrent: () => Promise<TCurrent>;
  loadAnalytics: () => Promise<TAnalytics>;
  now?: () => Date;
}) {
  const [current, analytics] = await Promise.all([
    input.loadCurrent(),
    input.loadAnalytics(),
  ]);

  return {
    generatedAt: (input.now ?? (() => new Date()))().toISOString(),
    current,
    analytics,
  };
}

export async function loadDashboardCurrent(supabase: any, categoryId: string | null = null) {
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
    supabase.from('categories').select('id,name,slug,parent_id,is_active'),
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

  const allCatalogProducts = (catalogProducts.data ?? []) as any[];
  const scopedProducts = categoryId
    ? allCatalogProducts.filter((product) => product.category_id === categoryId || product.subcategory_id === categoryId)
    : allCatalogProducts;
  const scopedProductIds = new Set(scopedProducts.map((product) => product.id));
  const allCatalogOrders = (catalogOrders.data ?? []) as any[];
  const scopedOrders = categoryId
    ? allCatalogOrders
      .map((order) => {
        const orderItems = (order.order_items ?? []).filter((item: any) => scopedProductIds.has(item.product_id));
        return {
          ...order,
          total_amount: orderItems.reduce((total: number, item: any) => total + Number(item.subtotal ?? 0), 0),
          order_items: orderItems,
        };
      })
      .filter((order) => order.order_items.length > 0)
    : allCatalogOrders;
  const scopedRecentProducts = categoryId
    ? (recentProducts.data ?? []).filter((product: any) => scopedProductIds.has(product.id))
    : recentProducts.data ?? [];

  const catalogMetrics = buildCatalogMetrics({
    products: scopedProducts,
    categories: (catalogCategories.data ?? []) as any[],
    orders: scopedOrders,
  });

  return {
    totalProducts: categoryId ? scopedProducts.length : products.count ?? 0,
    activeProducts: categoryId ? scopedProducts.filter((product) => product.is_active === true).length : activeProducts.count ?? 0,
    inactiveProducts: categoryId
      ? scopedProducts.filter((product) => product.is_active !== true).length
      : Math.max((products.count ?? 0) - (activeProducts.count ?? 0), 0),
    categories: categories.count ?? 0,
    featuredProducts: categoryId ? scopedProducts.filter((product) => product.is_featured === true).length : featuredProducts.count ?? 0,
    promoProducts: categoryId ? scopedProducts.filter((product) => product.is_promo === true).length : promoProducts.count ?? 0,
    orders: categoryId ? scopedOrders.length : orders.count ?? 0,
    recentProducts: scopedRecentProducts,
    recentOrders: categoryId ? scopedOrders.slice(0, 10) : orders.data ?? [],
    catalogMetrics,
  };
}
