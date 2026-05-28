export type MobilePlanCode = 'basic' | 'medium' | 'master';

export interface MobilePlan {
  code: MobilePlanCode;
  label: string;
  monthlyPrice: number;
  productsLimit: number | null;
  ordersMonthlyLimit: number | null;
  stockItemsLimit: number | null;
  customization: boolean;
}

export interface MobileStoreUsage {
  products: number;
  ordersThisMonth: number;
  stockItems: number;
}

export const MOBILE_PLANS: Record<MobilePlanCode, MobilePlan> = {
  basic: {
    code: 'basic',
    label: 'Basico',
    monthlyPrice: 149.9,
    productsLimit: 50,
    ordersMonthlyLimit: 250,
    stockItemsLimit: 50,
    customization: false,
  },
  medium: {
    code: 'medium',
    label: 'Medio',
    monthlyPrice: 399.9,
    productsLimit: 250,
    ordersMonthlyLimit: 350,
    stockItemsLimit: 250,
    customization: true,
  },
  master: {
    code: 'master',
    label: 'Master',
    monthlyPrice: 749.9,
    productsLimit: 450,
    ordersMonthlyLimit: null,
    stockItemsLimit: null,
    customization: true,
  },
};

export function normalizeStoreSlug(value: unknown) {
  if (typeof value !== 'string') return '';
  return value
    .trim()
    .toLowerCase()
    .replace(/^.*\/loja\//, '')
    .split(/[?#]/)[0]
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export function resolveMobilePlan(value: unknown): MobilePlan {
  const code = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (code === 'basic' || code === 'medium' || code === 'master') {
    return MOBILE_PLANS[code];
  }
  return MOBILE_PLANS.medium;
}

export function buildStoreUsage(input: {
  productsCount?: number | null;
  ordersThisMonthCount?: number | null;
  products?: Array<{ stockQuantity?: number; variants?: Array<{ stockQuantity?: number }> }>;
}): MobileStoreUsage {
  const products = input.products ?? [];
  const stockItems = products.reduce((sum, product) => {
    const variantStock = (product.variants ?? []).reduce(
      (variantSum, variant) => variantSum + Math.max(0, Number(variant.stockQuantity ?? 0)),
      0,
    );
    return sum + Math.max(0, Number(product.stockQuantity ?? 0)) + variantStock;
  }, 0);

  return {
    products: Math.max(0, Number(input.productsCount ?? products.length)),
    ordersThisMonth: Math.max(0, Number(input.ordersThisMonthCount ?? 0)),
    stockItems,
  };
}

export function mapMobileProduct(row: any) {
  const images = Array.isArray(row.images) ? row.images : [];
  const variants = Array.isArray(row.variants)
    ? row.variants
      .filter((variant: any) => variant.isActive !== false)
      .map((variant: any) => ({
        id: String(variant.id),
        label: String(variant.label || 'Padrao'),
        stockQuantity: Number(variant.stockQuantity ?? 0),
        price: variant.price === null || variant.price === undefined ? undefined : Number(variant.price),
      }))
    : [];

  return {
    id: String(row.id),
    storeId: 'store-default',
    name: String(row.title || row.name || ''),
    description: String(row.description || ''),
    price: Number(row.price ?? 0),
    category: String(row.categoryName || row.category || 'Catalogo'),
    imageUrl: String(images[0] || row.imageUrl || ''),
    stockQuantity: Number(row.stockQuantity ?? 0),
    isActive: row.isActive !== false,
    isFeatured: Boolean(row.isFeatured),
    variants,
  };
}
