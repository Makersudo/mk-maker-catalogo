import type { AnalyticsRange } from './analyticsTypes.js';

export interface SalesAnalyticsRow {
  bucket_start: string;
  revenue: number;
  orders: number;
  units_sold: number;
  average_ticket: number;
  realized_gross_profit: number;
}

export interface SnapshotAnalyticsRow {
  bucket_start: string;
  stock_units: number;
  inventory_purchase_value: number;
  inventory_sale_value: number;
  estimated_gross_profit: number;
  completion_score: number;
}

export interface ProductCreationAnalyticsRow {
  bucket_start: string;
  products_created: number;
}

export interface AnalyticsRepository {
  loadSales(range: AnalyticsRange): Promise<SalesAnalyticsRow[]>;
  loadSnapshots(range: AnalyticsRange): Promise<SnapshotAnalyticsRow[]>;
  loadProductsCreated(range: AnalyticsRange): Promise<ProductCreationAnalyticsRow[]>;
}

function numericRows<T extends object>(rows: T[], numericFields: string[]): T[] {
  return rows.map((row) => {
    const source = row as Record<string, unknown>;
    const normalized = { ...source };
    for (const field of numericFields) {
      normalized[field] = Number(source[field] ?? 0);
    }
    return normalized as T;
  });
}

async function rpcRows<T extends object>(
  supabase: any,
  functionName: string,
  range: AnalyticsRange,
  numericFields: string[]
): Promise<T[]> {
  const { data, error } = await supabase.rpc(functionName, {
    p_period: range.period,
    p_from: range.from,
    p_to: range.to,
    p_category_id: range.categoryId,
  });
  if (error) throw error;
  return numericRows((data ?? []) as T[], numericFields);
}

export function createAnalyticsRepository(supabase: any): AnalyticsRepository {
  return {
    loadSales(range) {
      return rpcRows<SalesAnalyticsRow>(supabase, 'dashboard_sales_analytics', range, [
        'revenue', 'orders', 'units_sold', 'average_ticket', 'realized_gross_profit',
      ]);
    },
    loadSnapshots(range) {
      return rpcRows<SnapshotAnalyticsRow>(supabase, 'dashboard_snapshot_analytics', range, [
        'stock_units', 'inventory_purchase_value', 'inventory_sale_value',
        'estimated_gross_profit', 'completion_score',
      ]);
    },
    loadProductsCreated(range) {
      return rpcRows<ProductCreationAnalyticsRow>(supabase, 'dashboard_product_creation_analytics', range, [
        'products_created',
      ]);
    },
  };
}
