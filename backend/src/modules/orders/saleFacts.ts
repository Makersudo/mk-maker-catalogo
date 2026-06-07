interface ProductSaleFactsSource {
  purchase_cost?: number | string | null;
  category_id?: string | null;
  category?: { name?: string | null } | null;
  subcategory_id?: string | null;
  subcategory?: { name?: string | null } | null;
}

const PUBLIC_ORDER_ITEM_FIELDS = [
  'id',
  'order_id',
  'product_id',
  'product_variant_id',
  'product_name',
  'variant_label',
  'variant_options',
  'unit_price',
  'quantity',
  'subtotal',
  'created_at',
] as const;

function nullableText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized || null;
}

function nonNegativeNumber(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value ?? 0);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function money(value: number): number {
  return Math.round(value * 100) / 100;
}

export function buildOrderItemSaleFacts(input: {
  product: ProductSaleFactsSource;
  quantity: number;
}) {
  const unitPurchaseCost = money(nonNegativeNumber(input.product.purchase_cost));
  const quantity = Math.max(1, Math.floor(nonNegativeNumber(input.quantity) || 1));

  return {
    unit_purchase_cost: unitPurchaseCost,
    cost_subtotal: money(unitPurchaseCost * quantity),
    category_id: nullableText(input.product.category_id),
    category_name: nullableText(input.product.category?.name),
    subcategory_id: nullableText(input.product.subcategory_id),
    subcategory_name: nullableText(input.product.subcategory?.name),
  };
}

export function publicOrderItem(item: Record<string, unknown>) {
  return Object.fromEntries(
    PUBLIC_ORDER_ITEM_FIELDS
      .filter((field) => field in item)
      .map((field) => [field, item[field]])
  );
}
