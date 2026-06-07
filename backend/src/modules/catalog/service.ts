import { getSupabaseAdmin } from '../../lib/supabase.js';
import { mapCategory } from '../categories/mapper.js';
import { mapProduct, mapPublicProduct } from '../products/mapper.js';
import { productSelect } from '../products/select.js';
import { applyPublicCatalogProductVisibility } from './publicQueryGuard.js';
import { buildProductRelevanceMap } from './relevance.js';
import type { OrderRelevanceSource, ProductRelevanceSource } from './relevance.js';
import { selectActiveCampaignForProduct } from '../marketing/campaignRules.js';
import { loadCandidateCampaigns } from '../marketing/campaignRepository.js';

const PUBLIC_CATALOG_CACHE_TTL_MS = 5 * 60_000;
const PUBLIC_CATALOG_STALE_TTL_MS = 30 * 60_000;
const RELEVANCE_ORDER_LIMIT = 500;

type PublicCatalogSnapshot = {
  categories: ReturnType<typeof mapCategory>[];
  products: ReturnType<typeof mapPublicProduct>[];
};

let publicCatalogCache:
  | {
      expiresAt: number;
      staleUntil: number;
      snapshot: PublicCatalogSnapshot;
    }
  | null = null;

let pendingPublicCatalogRefresh: Promise<PublicCatalogSnapshot> | null = null;

async function refreshPublicCatalogSnapshot(): Promise<PublicCatalogSnapshot> {
  const supabase = getSupabaseAdmin();
  const publicProductsQuery = applyPublicCatalogProductVisibility(
    supabase.from('products').select(productSelect()) as any
  );

  const [categoriesResult, productsResult, ordersResult, campaignRows] = await Promise.all([
    supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('parent_id', { ascending: true, nullsFirst: true })
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true }),
    publicProductsQuery.order('created_at', { ascending: false }),
    supabase
      .from('orders')
      .select('status, created_at, order_items(product_id, quantity)')
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false })
      .limit(RELEVANCE_ORDER_LIMIT),
    loadCandidateCampaigns(supabase),
  ]);

  const failed = [categoriesResult, productsResult, ordersResult].find((result) => result.error);
  if (failed?.error) {
    throw failed.error;
  }

  const productRows = ((productsResult.data ?? []) as unknown) as ProductRelevanceSource[];
  const orderRows = ((ordersResult.data ?? []) as unknown) as OrderRelevanceSource[];
  const now = new Date();

  const relevanceByProductId = buildProductRelevanceMap(productRows, orderRows);
  const mappedProducts = productRows.map((row) => {
    const mappedProduct = mapProduct(row);
    const relevance = relevanceByProductId[mappedProduct.id] ?? {
      score: 0,
      unitsSold: 0,
      orderCount: 0,
    };

    const activeCampaign = selectActiveCampaignForProduct(mappedProduct.id, mappedProduct.price, campaignRows, now);

    return mapPublicProduct({
      ...mappedProduct,
      campaign: activeCampaign,
      relevanceScore: relevance.score,
    });
  });

  const visibleCategoryIds = new Set<string>();
  const categoryRows = (categoriesResult.data ?? []) as any[];
  const parentIdByCategoryId = new Map(categoryRows.map((row) => [row.id, row.parent_id ?? null] as const));

  for (const product of mappedProducts) {
    visibleCategoryIds.add(product.categoryId);
    if (product.subcategoryId) {
      visibleCategoryIds.add(product.subcategoryId);
    }
  }

  for (const categoryId of Array.from(visibleCategoryIds)) {
    let parentId = parentIdByCategoryId.get(categoryId) ?? null;
    while (parentId) {
      visibleCategoryIds.add(parentId);
      parentId = parentIdByCategoryId.get(parentId) ?? null;
    }
  }

  const snapshot = {
    categories: categoryRows
      .filter((row) => visibleCategoryIds.has(row.id))
      .map(mapCategory),
    products: mappedProducts,
  };

  publicCatalogCache = {
    expiresAt: Date.now() + PUBLIC_CATALOG_CACHE_TTL_MS,
    staleUntil: Date.now() + PUBLIC_CATALOG_STALE_TTL_MS,
    snapshot,
  };

  return snapshot;
}

function startPublicCatalogRefresh() {
  if (!pendingPublicCatalogRefresh) {
    pendingPublicCatalogRefresh = refreshPublicCatalogSnapshot().finally(() => {
      pendingPublicCatalogRefresh = null;
    });
  }

  return pendingPublicCatalogRefresh;
}

export async function loadPublicCatalogSnapshot(forceRefresh = false): Promise<PublicCatalogSnapshot> {
  const now = Date.now();

  if (!forceRefresh && publicCatalogCache && publicCatalogCache.expiresAt > now) {
    return publicCatalogCache.snapshot;
  }

  if (!forceRefresh && publicCatalogCache && publicCatalogCache.staleUntil > now) {
    void startPublicCatalogRefresh().catch(() => undefined);
    return publicCatalogCache.snapshot;
  }

  return startPublicCatalogRefresh();
}

export function invalidatePublicCatalogCache() {
  if (publicCatalogCache) {
    publicCatalogCache.expiresAt = 0;
    return;
  }

  publicCatalogCache = null;
}
