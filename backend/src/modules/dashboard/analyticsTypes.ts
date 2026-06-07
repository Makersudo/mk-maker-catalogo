export type AnalyticsPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface AnalyticsRange {
  period: AnalyticsPeriod;
  from: string;
  to: string;
  categoryId: string | null;
}

export interface TrendPoint {
  bucket: string;
  label: string;
  value: number;
}

export interface DashboardAnalyticsSeries {
  revenue: TrendPoint[];
  orders: TrendPoint[];
  unitsSold: TrendPoint[];
  averageTicket: TrendPoint[];
  productsCreated: TrendPoint[];
  stockUnits: TrendPoint[];
  inventoryPurchaseValue: TrendPoint[];
  inventorySaleValue: TrendPoint[];
  estimatedGrossProfit: TrendPoint[];
  realizedGrossProfit: TrendPoint[];
  completionScore: TrendPoint[];
}

export interface DashboardAnalyticsComparison {
  revenuePercent: number | null;
  ordersPercent: number | null;
  unitsSoldPercent: number | null;
  averageTicketPercent: number | null;
  productsCreatedPercent: number | null;
  stockUnitsPercent: number | null;
  inventoryPurchaseValuePercent: number | null;
  inventorySaleValuePercent: number | null;
  estimatedGrossProfitPercent: number | null;
  realizedGrossProfitPercent: number | null;
  completionScorePercent: number | null;
}

export interface DashboardAnalyticsResponse {
  period: AnalyticsPeriod;
  timezone: 'America/Sao_Paulo';
  range: { from: string; to: string };
  categoryId: string | null;
  series: DashboardAnalyticsSeries;
  previousSeries: DashboardAnalyticsSeries;
  comparison: DashboardAnalyticsComparison;
}

export interface DailySnapshotRow {
  snapshot_date: string;
  timezone: 'America/Sao_Paulo';
  total_products: number;
  active_products: number;
  live_products: number;
  products_with_image: number;
  products_without_image: number;
  products_with_purchase_cost: number;
  stock_total_units: number;
  healthy_stock_products: number;
  low_stock_products: number;
  zero_stock_products: number;
  inventory_purchase_value: number;
  inventory_sale_value: number;
  estimated_gross_profit: number;
  featured_products: number;
  promo_products: number;
  new_products: number;
  completion_score: number;
  metadata: Record<string, unknown>;
}

export interface CategoryDailySnapshotRow {
  snapshot_date: string;
  category_id: string;
  category_name: string;
  total_products: number;
  active_products: number;
  live_products: number;
  stock_total_units: number;
  inventory_purchase_value: number;
  inventory_sale_value: number;
}
