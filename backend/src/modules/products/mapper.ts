export interface ProductPayload {
  slug?: string;
  title: string;
  description: string;
  price: number;
  purchaseCost: number;
  categoryId: string;
  subcategoryId?: string | null;
  audience?: string | null;
  brandLabel?: string;
  productType?: string;
  variation?: string | null;
  features?: string[];
  imagePrompt?: string;
  catalogStatus?: 'draft' | 'ready' | 'live';
  images: string[];
  isActive: boolean;
  isFeatured: boolean;
  isPromo: boolean;
  isNew: boolean;
  stockQuantity?: number;
  variantsEnabled?: boolean;
  variants?: Array<{
    id?: string;
    label?: string;
    sku?: string;
    options: Array<{ name: string; value: string }>;
    price?: number | null;
    stockQuantity: number;
    isActive: boolean;
  }>;
}

export function mapProduct(row: any) {
  const images = Array.isArray(row.product_images)
    ? row.product_images
      .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((image: any) => image.url)
    : [];
  const variants = Array.isArray(row.product_variants)
    ? row.product_variants.map((variant: any) => ({
      id: variant.id,
      label: variant.label,
      sku: variant.sku ?? '',
      options: Array.isArray(variant.options) ? variant.options : [],
      price: variant.price === null || variant.price === undefined ? null : Number(variant.price),
      stockQuantity: Number(variant.stock_quantity ?? 0),
      isActive: Boolean(variant.is_active),
    }))
    : [];

  return {
    id: row.id,
    slug: row.slug ?? null,
    title: row.title,
    description: row.description ?? '',
    price: Number(row.price ?? 0),
    purchaseCost: Number(row.purchase_cost ?? 0),
    categoryId: row.category_id,
    subcategoryId: row.subcategory_id ?? null,
    audience: row.audience ?? null,
    brandLabel: row.brand_label ?? '',
    productType: row.product_type ?? '',
    variation: row.variation ?? null,
    features: Array.isArray(row.features) ? row.features : [],
    imagePrompt: row.image_prompt ?? '',
    catalogStatus: row.catalog_status ?? 'draft',
    categoryName: row.categories?.name ?? row.category?.name ?? null,
    subcategoryName: row.subcategory?.name ?? null,
    images,
    isActive: Boolean(row.is_active),
    isFeatured: Boolean(row.is_featured),
    isPromo: Boolean(row.is_promo),
    isNew: Boolean(row.is_new),
    stockQuantity: Number(row.stock_quantity ?? 0),
    variantsEnabled: Boolean(row.variants_enabled),
    variants,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function mapPublicProduct(product: any) {
  return {
    id: product.id,
    slug: product.slug ?? null,
    title: product.title,
    description: product.description ?? '',
    price: Number(product.price ?? 0),
    categoryId: product.categoryId,
    subcategoryId: product.subcategoryId ?? null,
    categoryName: product.categoryName ?? null,
    subcategoryName: product.subcategoryName ?? null,
    brandLabel: product.brandLabel ?? '',
    features: Array.isArray(product.features) ? product.features : [],
    images: Array.isArray(product.images) ? product.images : [],
    isFeatured: Boolean(product.isFeatured),
    isPromo: Boolean(product.isPromo),
    isNew: Boolean(product.isNew),
    stockQuantity: Number(product.stockQuantity ?? 0),
    variantsEnabled: Boolean(product.variantsEnabled),
    variants: Array.isArray(product.variants)
      ? product.variants
        .filter((variant: any) => variant.isActive !== false)
        .map((variant: any) => ({
          id: variant.id,
          label: variant.label,
          options: Array.isArray(variant.options) ? variant.options : [],
          price: variant.price === null || variant.price === undefined ? null : Number(variant.price),
          stockQuantity: Number(variant.stockQuantity ?? 0),
          isActive: true,
        }))
      : [],
    campaign: product.campaign ?? null,
    relevanceScore: Number(product.relevanceScore ?? 0),
    created_at: product.created_at,
  };
}
