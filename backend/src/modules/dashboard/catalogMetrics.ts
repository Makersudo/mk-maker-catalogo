type CatalogStatus = 'draft' | 'ready' | 'live';
type AlertSeverity = 'critical' | 'warning' | 'info';
type CatalogLineKey = string;

export interface CatalogMetricsProduct {
  id: string;
  title?: string | null;
  price?: number | string | null;
  purchase_cost?: number | string | null;
  audience?: string | null;
  catalog_status?: CatalogStatus | string | null;
  is_active?: boolean | null;
  is_featured?: boolean | null;
  is_promo?: boolean | null;
  is_new?: boolean | null;
  stock_quantity?: number | string | null;
  variants_enabled?: boolean | null;
  category_id?: string | null;
  subcategory_id?: string | null;
  created_at?: string | null;
  category?: { id?: string | null; name?: string | null; slug?: string | null; parent_id?: string | null } | null;
  subcategory?: { id?: string | null; name?: string | null; slug?: string | null; parent_id?: string | null } | null;
  product_images?: Array<{ id?: string | null; url?: string | null }> | null;
  product_variants?: Array<{ id?: string | null; price?: number | string | null; stock_quantity?: number | string | null; is_active?: boolean | null }> | null;
}

export interface CatalogMetricsCategory {
  id: string;
  name?: string | null;
  slug?: string | null;
  parent_id?: string | null;
  is_active?: boolean | null;
}

export interface CatalogMetricsOrder {
  id: string;
  total_amount?: number | string | null;
  status?: string | null;
  created_at?: string | null;
  order_items?: Array<{
    product_id?: string | null;
    quantity?: number | string | null;
    subtotal?: number | string | null;
  }> | null;
}

interface BuildCatalogMetricsInput {
  products: CatalogMetricsProduct[];
  categories: CatalogMetricsCategory[];
  orders: CatalogMetricsOrder[];
}

interface BuildCatalogMetricsOptions {
  now?: Date;
  lowStockThreshold?: number;
}

interface CountWithProducts {
  count: number;
  products: Array<{ id: string; title: string }>;
}

interface CatalogLineInfo {
  key: CatalogLineKey;
  label: string;
  order: number;
}

function numberValue(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function percent(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

function statusKey(value: unknown): CatalogStatus {
  if (value === 'ready' || value === 'live') return value;
  return 'draft';
}

function productTitle(product: CatalogMetricsProduct): string {
  return product.title?.trim() || 'Produto sem titulo';
}

function hasImage(product: CatalogMetricsProduct): boolean {
  return (product.product_images ?? []).some((image) => !!image.url?.trim());
}

function isValidOrder(order: CatalogMetricsOrder): boolean {
  return order.status !== 'cancelled';
}

function recentSince(now: Date, days: number): number {
  return now.getTime() - days * 24 * 60 * 60 * 1000;
}

function productStock(product: CatalogMetricsProduct): number {
  if (product.variants_enabled) {
    return (product.product_variants ?? [])
      .filter((variant) => variant.is_active !== false)
      .reduce((sum, variant) => sum + numberValue(variant.stock_quantity), 0);
  }

  return numberValue(product.stock_quantity);
}

function limitedIssueProducts(products: CatalogMetricsProduct[]): CountWithProducts {
  return {
    count: products.length,
    products: products.slice(0, 6).map((product) => ({ id: product.id, title: productTitle(product) })),
  };
}

function productInventoryValue(product: CatalogMetricsProduct) {
  const purchaseCost = numberValue(product.purchase_cost);
  const baseSalePrice = numberValue(product.price);

  if (product.variants_enabled) {
    return (product.product_variants ?? [])
      .filter((variant) => variant.is_active !== false)
      .reduce((total, variant) => {
        const stock = numberValue(variant.stock_quantity);
        const variantSalePrice = variant.price === null || variant.price === undefined
          ? baseSalePrice
          : numberValue(variant.price);

        return {
          purchaseValue: total.purchaseValue + purchaseCost * stock,
          saleValue: total.saleValue + variantSalePrice * stock,
        };
      }, { purchaseValue: 0, saleValue: 0 });
  }

  const stock = numberValue(product.stock_quantity);
  return {
    purchaseValue: purchaseCost * stock,
    saleValue: baseSalePrice * stock,
  };
}

function categoryKey(category: CatalogMetricsCategory | { id?: string | null; slug?: string | null }): string {
  return category.slug?.trim() || category.id?.trim() || 'sem-categoria';
}

function buildCatalogLineResolver(categories: CatalogMetricsCategory[]) {
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const rootOrder = new Map<string, number>();
  categories
    .filter((category) => !category.parent_id)
    .forEach((category, index) => rootOrder.set(categoryKey(category), index));

  function rootCategory(categoryId?: string | null): CatalogMetricsCategory | null {
    if (!categoryId) return null;

    let current = categoryById.get(categoryId) ?? null;
    const visited = new Set<string>();
    while (current?.parent_id && !visited.has(current.id)) {
      visited.add(current.id);
      current = categoryById.get(current.parent_id) ?? current;
      if (!current.parent_id) break;
    }

    return current;
  }

  return (product: CatalogMetricsProduct): CatalogLineInfo => {
    const productCategoryId = product.category_id ?? product.category?.id ?? product.subcategory_id ?? product.subcategory?.id ?? null;
    const root = rootCategory(productCategoryId);

    if (root) {
      const key = categoryKey(root);
      return {
        key,
        label: root.name?.trim() || product.category?.name?.trim() || 'Categoria sem nome',
        order: rootOrder.get(key) ?? Number.MAX_SAFE_INTEGER - 1,
      };
    }

    const inlineCategory = product.category ?? product.subcategory;
    if (inlineCategory?.id || inlineCategory?.slug || inlineCategory?.name) {
      const key = categoryKey(inlineCategory);
      return {
        key,
        label: inlineCategory.name?.trim() || 'Categoria sem nome',
        order: rootOrder.get(key) ?? Number.MAX_SAFE_INTEGER - 1,
      };
    }

    return { key: 'sem-categoria', label: 'Sem categoria', order: Number.MAX_SAFE_INTEGER };
  };
}

export function buildCatalogMetrics(input: BuildCatalogMetricsInput, options: BuildCatalogMetricsOptions = {}) {
  const now = options.now ?? new Date();
  const lowStockThreshold = options.lowStockThreshold ?? 5;
  const products = input.products ?? [];
  const categories = input.categories ?? [];
  const validOrders = (input.orders ?? []).filter(isValidOrder);
  const totalProducts = products.length;
  const activeProducts = products.filter((product) => product.is_active === true).length;
  const prices = products.map((product) => numberValue(product.price));
  const totalPrice = prices.reduce((sum, price) => sum + price, 0);
  const withImageProducts = products.filter(hasImage);
  const withoutImageProducts = products.filter((product) => !hasImage(product));
  const withoutPriceProducts = products.filter((product) => numberValue(product.price) <= 0);
  const withoutCategoryProducts = products.filter((product) => !product.category_id && !product.category?.id);
  const withoutSubcategoryProducts = products.filter((product) => !product.subcategory_id && !product.subcategory?.id);
  const liveProducts = products.filter((product) => statusKey(product.catalog_status) === 'live').length;
  const resolveCatalogLine = buildCatalogLineResolver(categories);

  const unitsByProduct = new Map<string, { units: number; revenue: number }>();
  let totalRevenue = 0;
  let unitsSold = 0;
  for (const order of validOrders) {
    totalRevenue += numberValue(order.total_amount);
    for (const item of order.order_items ?? []) {
      const productId = item.product_id;
      if (!productId) continue;
      const current = unitsByProduct.get(productId) ?? { units: 0, revenue: 0 };
      current.units += numberValue(item.quantity);
      current.revenue += numberValue(item.subtotal);
      unitsSold += numberValue(item.quantity);
      unitsByProduct.set(productId, current);
    }
  }

  const statusFunnel: Record<CatalogStatus, number> = { draft: 0, ready: 0, live: 0 };
  for (const product of products) {
    statusFunnel[statusKey(product.catalog_status)] += 1;
  }

  const stockRows = products.map((product) => ({ product, stock: productStock(product) }));
  const inventoryRows = products.map((product) => ({ product, ...productInventoryValue(product) }));
  const purchaseValue = roundMoney(inventoryRows.reduce((sum, row) => sum + row.purchaseValue, 0));
  const saleValue = roundMoney(inventoryRows.reduce((sum, row) => sum + row.saleValue, 0));
  const estimatedGrossProfit = roundMoney(saleValue - purchaseValue);
  const zeroStockProducts = stockRows.filter((row) => row.stock <= 0).map((row) => row.product);
  const lowStockProducts = stockRows
    .filter((row) => row.stock > 0 && row.stock <= lowStockThreshold)
    .map((row) => row.product);

  const productsByCategory = new Map<string, CatalogMetricsProduct[]>();
  for (const product of products) {
    const categoryIds = new Set([
      product.category_id ?? product.category?.id ?? null,
      product.subcategory_id ?? product.subcategory?.id ?? null,
    ].filter((categoryId): categoryId is string => typeof categoryId === 'string' && categoryId.trim().length > 0));

    for (const categoryId of categoryIds) {
      productsByCategory.set(categoryId, [...(productsByCategory.get(categoryId) ?? []), product]);
    }
  }

  const emptyCategories = categories.filter((category) => category.is_active !== false && !(productsByCategory.get(category.id)?.length));
  const productSales = products.map((product) => {
    const sales = unitsByProduct.get(product.id) ?? { units: 0, revenue: 0 };
    const catalogLine = resolveCatalogLine(product);
    return {
      id: product.id,
      title: productTitle(product),
      lineKey: catalogLine.key,
      lineLabel: catalogLine.label,
      unitsSold: sales.units,
      revenue: roundMoney(sales.revenue),
    };
  });

  const lineByKey = new Map<string, CatalogLineInfo>();
  for (const product of products) {
    const line = resolveCatalogLine(product);
    lineByKey.set(line.key, line);
  }

  const catalogLines = Array.from(lineByKey.values()).map((line) => {
    const scoped = products.filter((product) => resolveCatalogLine(product).key === line.key);
    const scopedIds = new Set(scoped.map((product) => product.id));
    const scopedSales = productSales.filter((item) => scopedIds.has(item.id));
    return {
      key: line.key,
      label: line.label,
      total: scoped.length,
      active: scoped.filter((product) => product.is_active === true).length,
      inactive: scoped.filter((product) => product.is_active !== true).length,
      live: scoped.filter((product) => statusKey(product.catalog_status) === 'live').length,
      ready: scoped.filter((product) => statusKey(product.catalog_status) === 'ready').length,
      draft: scoped.filter((product) => statusKey(product.catalog_status) === 'draft').length,
      withImage: scoped.filter(hasImage).length,
      withoutImage: scoped.filter((product) => !hasImage(product)).length,
      withoutPrice: scoped.filter((product) => numberValue(product.price) <= 0).length,
      stockUnits: scoped.reduce((sum, product) => sum + productStock(product), 0),
      unitsSold: scopedSales.reduce((sum, item) => sum + item.unitsSold, 0),
      revenue: roundMoney(scopedSales.reduce((sum, item) => sum + item.revenue, 0)),
    };
  }).sort((a, b) => {
    const aOrder = lineByKey.get(a.key)?.order ?? Number.MAX_SAFE_INTEGER;
    const bOrder = lineByKey.get(b.key)?.order ?? Number.MAX_SAFE_INTEGER;
    return aOrder - bOrder || a.label.localeCompare(b.label);
  });

  const categoryPerformance = categories.map((category) => {
    const scoped = productsByCategory.get(category.id) ?? [];
    const scopedIds = new Set(scoped.map((product) => product.id));
    const scopedSales = productSales.filter((item) => scopedIds.has(item.id));
    return {
      categoryId: category.id,
      name: category.name ?? 'Categoria sem nome',
      slug: category.slug ?? '',
      active: category.is_active !== false,
      totalProducts: scoped.length,
      activeProducts: scoped.filter((product) => product.is_active === true).length,
      liveProducts: scoped.filter((product) => statusKey(product.catalog_status) === 'live').length,
      withoutImage: scoped.filter((product) => !hasImage(product)).length,
      unitsSold: scopedSales.reduce((sum, item) => sum + item.unitsSold, 0),
      revenue: roundMoney(scopedSales.reduce((sum, item) => sum + item.revenue, 0)),
    };
  }).sort((a, b) => b.revenue - a.revenue || b.totalProducts - a.totalProducts || a.name.localeCompare(b.name));

  const nonLiveProducts = products.filter((product) => statusKey(product.catalog_status) !== 'live');
  const criticalIssueCount = withoutImageProducts.length
    + withoutPriceProducts.length
    + zeroStockProducts.length
    + withoutCategoryProducts.length
    + nonLiveProducts.length;
  const completionScore = totalProducts === 0
    ? 0
    : Math.max(0, Math.min(100, percent(
      totalProducts * 4 - criticalIssueCount,
      totalProducts * 4
    )));

  const sevenDaysAgo = recentSince(now, 7);
  const thirtyDaysAgo = recentSince(now, 30);
  const validOrdersLast7 = validOrders.filter((order) => order.created_at && new Date(order.created_at).getTime() >= sevenDaysAgo);
  const validOrdersLast30 = validOrders.filter((order) => order.created_at && new Date(order.created_at).getTime() >= thirtyDaysAgo);

  const alerts = [
    { severity: 'critical' as AlertSeverity, label: 'Produtos sem imagem', count: withoutImageProducts.length, action: 'Adicionar imagem antes de publicar.' },
    { severity: 'critical' as AlertSeverity, label: 'Produtos sem preco', count: withoutPriceProducts.length, action: 'Definir preco valido.' },
    { severity: 'warning' as AlertSeverity, label: 'Produtos sem estoque', count: zeroStockProducts.length, action: 'Repor estoque ou desativar produto.' },
    { severity: 'warning' as AlertSeverity, label: 'Produtos sem subcategoria', count: withoutSubcategoryProducts.length, action: 'Organizar navegacao do catalogo.' },
    { severity: 'info' as AlertSeverity, label: 'Categorias vazias', count: emptyCategories.length, action: 'Preencher ou ocultar categorias vazias.' },
  ].filter((alert) => alert.count > 0).sort((a, b) => {
    const order: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity] || b.count - a.count;
  });

  return {
    summary: {
      totalProducts,
      activeProducts,
      inactiveProducts: totalProducts - activeProducts,
      liveProducts,
      completionScore,
      averagePrice: roundMoney(totalProducts ? totalPrice / totalProducts : 0),
      priceMin: roundMoney(prices.length ? Math.min(...prices) : 0),
      priceMax: roundMoney(prices.length ? Math.max(...prices) : 0),
      featuredProducts: products.filter((product) => product.is_featured === true).length,
      promoProducts: products.filter((product) => product.is_promo === true).length,
      newProducts: products.filter((product) => product.is_new === true).length,
    },
    statusFunnel,
    imageCoverage: {
      total: totalProducts,
      withImage: withImageProducts.length,
      withoutImage: withoutImageProducts.length,
      percent: percent(withImageProducts.length, totalProducts),
    },
    stockHealth: {
      totalUnits: stockRows.reduce((sum, row) => sum + row.stock, 0),
      ok: stockRows.filter((row) => row.stock > lowStockThreshold).length,
      low: lowStockProducts.length,
      zero: zeroStockProducts.length,
      variantManaged: products.filter((product) => product.variants_enabled === true).length,
      lowStockThreshold,
    },
    inventoryValue: {
      purchaseValue,
      saleValue,
      estimatedGrossProfit,
      estimatedGrossMarginPercent: percent(estimatedGrossProfit, saleValue),
      productsWithPurchaseCost: products.filter((product) => numberValue(product.purchase_cost) > 0).length,
    },
    sales: {
      totalOrders: input.orders.length,
      validOrders: validOrders.length,
      cancelledOrders: input.orders.length - validOrders.length,
      totalRevenue: roundMoney(totalRevenue),
      averageTicket: roundMoney(validOrders.length ? totalRevenue / validOrders.length : 0),
      unitsSold,
    },
    catalogLines,
    quality: {
      withoutImage: limitedIssueProducts(withoutImageProducts),
      withoutPrice: limitedIssueProducts(withoutPriceProducts),
      withoutCategory: limitedIssueProducts(withoutCategoryProducts),
      withoutSubcategory: limitedIssueProducts(withoutSubcategoryProducts),
      zeroStock: limitedIssueProducts(zeroStockProducts),
      lowStock: limitedIssueProducts(lowStockProducts),
      emptyCategories: {
        count: emptyCategories.length,
        categories: emptyCategories.slice(0, 6).map((category) => ({ id: category.id, name: category.name ?? 'Categoria sem nome' })),
      },
    },
    topProductsByRevenue: productSales
      .filter((item) => item.revenue > 0 || item.unitsSold > 0)
      .sort((a, b) => b.revenue - a.revenue || b.unitsSold - a.unitsSold)
      .slice(0, 5),
    topProductsByUnits: productSales
      .filter((item) => item.revenue > 0 || item.unitsSold > 0)
      .sort((a, b) => b.unitsSold - a.unitsSold || b.revenue - a.revenue)
      .slice(0, 5),
    categoryPerformance: categoryPerformance.slice(0, 8),
    activity: {
      productsCreatedLast7Days: products.filter((product) => product.created_at && new Date(product.created_at).getTime() >= sevenDaysAgo).length,
      productsCreatedLast30Days: products.filter((product) => product.created_at && new Date(product.created_at).getTime() >= thirtyDaysAgo).length,
      ordersLast7Days: validOrdersLast7.length,
      ordersLast30Days: validOrdersLast30.length,
      revenueLast7Days: roundMoney(validOrdersLast7.reduce((sum, order) => sum + numberValue(order.total_amount), 0)),
      revenueLast30Days: roundMoney(validOrdersLast30.reduce((sum, order) => sum + numberValue(order.total_amount), 0)),
    },
    alerts,
  };
}
