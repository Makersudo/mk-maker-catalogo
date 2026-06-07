import type { CatalogMetricsCategory, CatalogMetricsProduct } from './catalogMetrics.js';
import { buildCatalogMetrics } from './catalogMetrics.js';
import type { CategoryDailySnapshotRow, DailySnapshotRow } from './analyticsTypes.js';

const TIMEZONE = 'America/Sao_Paulo' as const;
const LOW_STOCK_THRESHOLD = 5;

interface SnapshotInput {
  snapshotDate: string;
  products: CatalogMetricsProduct[];
  categories: CatalogMetricsCategory[];
}

function numberValue(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value: number): number {
  return Math.round(value * 100) / 100;
}

function productStock(product: CatalogMetricsProduct): number {
  if (product.variants_enabled) {
    return (product.product_variants ?? [])
      .filter((variant) => variant.is_active !== false)
      .reduce((sum, variant) => sum + numberValue(variant.stock_quantity), 0);
  }
  return numberValue(product.stock_quantity);
}

function productInventoryValue(product: CatalogMetricsProduct) {
  const purchaseCost = numberValue(product.purchase_cost);
  const baseSalePrice = numberValue(product.price);

  if (product.variants_enabled) {
    return (product.product_variants ?? [])
      .filter((variant) => variant.is_active !== false)
      .reduce((total, variant) => {
        const stock = numberValue(variant.stock_quantity);
        const salePrice = variant.price === null || variant.price === undefined
          ? baseSalePrice
          : numberValue(variant.price);
        return {
          purchaseValue: total.purchaseValue + purchaseCost * stock,
          saleValue: total.saleValue + salePrice * stock,
        };
      }, { purchaseValue: 0, saleValue: 0 });
  }

  const stock = productStock(product);
  return { purchaseValue: purchaseCost * stock, saleValue: baseSalePrice * stock };
}

function rootCategoryId(product: CatalogMetricsProduct, categories: CatalogMetricsCategory[]): string | null {
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  let currentId = product.category_id ?? product.category?.id ?? product.subcategory_id ?? product.subcategory?.id ?? null;
  const visited = new Set<string>();

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    const current = categoryById.get(currentId);
    if (!current?.parent_id) return currentId;
    currentId = current.parent_id;
  }
  return currentId;
}

export function buildSnapshotRows(input: SnapshotInput): {
  global: DailySnapshotRow;
  categories: CategoryDailySnapshotRow[];
} {
  const metrics = buildCatalogMetrics({
    products: input.products,
    categories: input.categories,
    orders: [],
  }, { lowStockThreshold: LOW_STOCK_THRESHOLD });

  const global: DailySnapshotRow = {
    snapshot_date: input.snapshotDate,
    timezone: TIMEZONE,
    total_products: metrics.summary.totalProducts,
    active_products: metrics.summary.activeProducts,
    live_products: metrics.summary.liveProducts,
    products_with_image: metrics.imageCoverage.withImage,
    products_without_image: metrics.imageCoverage.withoutImage,
    products_with_purchase_cost: metrics.inventoryValue.productsWithPurchaseCost,
    stock_total_units: metrics.stockHealth.totalUnits,
    healthy_stock_products: metrics.stockHealth.ok,
    low_stock_products: metrics.stockHealth.low,
    zero_stock_products: metrics.stockHealth.zero,
    inventory_purchase_value: metrics.inventoryValue.purchaseValue,
    inventory_sale_value: metrics.inventoryValue.saleValue,
    estimated_gross_profit: metrics.inventoryValue.estimatedGrossProfit,
    featured_products: metrics.summary.featuredProducts,
    promo_products: metrics.summary.promoProducts,
    new_products: metrics.summary.newProducts,
    completion_score: metrics.summary.completionScore,
    metadata: { lowStockThreshold: LOW_STOCK_THRESHOLD },
  };

  const categories = input.categories
    .filter((category) => !category.parent_id)
    .map((category): CategoryDailySnapshotRow => {
      const scoped = input.products.filter((product) => rootCategoryId(product, input.categories) === category.id);
      const values = scoped.map(productInventoryValue);
      return {
        snapshot_date: input.snapshotDate,
        category_id: category.id,
        category_name: category.name?.trim() || 'Categoria sem nome',
        total_products: scoped.length,
        active_products: scoped.filter((product) => product.is_active === true).length,
        live_products: scoped.filter((product) => product.catalog_status === 'live').length,
        stock_total_units: scoped.reduce((sum, product) => sum + productStock(product), 0),
        inventory_purchase_value: money(values.reduce((sum, value) => sum + value.purchaseValue, 0)),
        inventory_sale_value: money(values.reduce((sum, value) => sum + value.saleValue, 0)),
      };
    });

  return { global, categories };
}

export async function captureDailySnapshot(supabase: any, snapshotDate: string) {
  const [productsResult, categoriesResult] = await Promise.all([
    supabase
      .from('products')
      .select('id,title,price,purchase_cost,audience,catalog_status,is_active,is_featured,is_promo,is_new,stock_quantity,variants_enabled,category_id,subcategory_id,created_at,category:categories!products_category_id_fkey(id,name,slug),subcategory:categories!products_subcategory_id_fkey(id,name,slug),product_images(id,url),product_variants(id,price,stock_quantity,is_active)'),
    supabase.from('categories').select('id,name,slug,parent_id,is_active'),
  ]);

  if (productsResult.error) throw productsResult.error;
  if (categoriesResult.error) throw categoriesResult.error;

  const rows = buildSnapshotRows({
    snapshotDate,
    products: (productsResult.data ?? []) as CatalogMetricsProduct[],
    categories: (categoriesResult.data ?? []) as CatalogMetricsCategory[],
  });

  const globalResult = await supabase
    .from('analytics_daily_snapshots')
    .upsert(rows.global, { onConflict: 'snapshot_date' });
  if (globalResult.error) throw globalResult.error;

  if (rows.categories.length > 0) {
    const categoryResult = await supabase
      .from('analytics_category_daily_snapshots')
      .upsert(rows.categories, { onConflict: 'snapshot_date,category_id' });
    if (categoryResult.error) throw categoryResult.error;
  }

  return rows;
}
