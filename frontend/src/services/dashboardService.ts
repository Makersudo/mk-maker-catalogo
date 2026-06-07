import { apiRequest } from './apiClient';

export interface CatalogMetrics {
  summary: {
    totalProducts: number;
    activeProducts: number;
    inactiveProducts: number;
    liveProducts: number;
    completionScore: number;
    averagePrice: number;
    priceMin: number;
    priceMax: number;
    featuredProducts: number;
    promoProducts: number;
    newProducts: number;
  };
  inventoryValue: {
    purchaseValue: number;
    saleValue: number;
    estimatedGrossProfit: number;
    estimatedGrossMarginPercent: number;
    productsWithPurchaseCost: number;
  };
  statusFunnel: {
    draft: number;
    ready: number;
    live: number;
  };
  imageCoverage: {
    total: number;
    withImage: number;
    withoutImage: number;
    percent: number;
  };
  stockHealth: {
    totalUnits: number;
    ok: number;
    low: number;
    zero: number;
    variantManaged: number;
    lowStockThreshold: number;
  };
  sales: {
    totalOrders: number;
    validOrders: number;
    cancelledOrders: number;
    totalRevenue: number;
    averageTicket: number;
    unitsSold: number;
  };
  catalogLines: Array<{
    key: string;
    label: string;
    total: number;
    active: number;
    inactive: number;
    live: number;
    ready: number;
    draft: number;
    withImage: number;
    withoutImage: number;
    withoutPrice: number;
    stockUnits: number;
    unitsSold: number;
    revenue: number;
  }>;
  quality: {
    withoutImage: MetricIssueList;
    withoutPrice: MetricIssueList;
    withoutCategory: MetricIssueList;
    withoutSubcategory: MetricIssueList;
    zeroStock: MetricIssueList;
    lowStock: MetricIssueList;
    emptyCategories: {
      count: number;
      categories: Array<{ id: string; name: string }>;
    };
  };
  topProductsByRevenue: Array<ProductRanking>;
  topProductsByUnits: Array<ProductRanking>;
  categoryPerformance: Array<{
    categoryId: string;
    name: string;
    slug: string;
    active: boolean;
    totalProducts: number;
    activeProducts: number;
    liveProducts: number;
    withoutImage: number;
    unitsSold: number;
    revenue: number;
  }>;
  activity: {
    productsCreatedLast7Days: number;
    productsCreatedLast30Days: number;
    ordersLast7Days: number;
    ordersLast30Days: number;
    revenueLast7Days: number;
    revenueLast30Days: number;
  };
  alerts: Array<{
    severity: 'critical' | 'warning' | 'info';
    label: string;
    count: number;
    action: string;
  }>;
}

interface MetricIssueList {
  count: number;
  products: Array<{ id: string; title: string }>;
}

interface ProductRanking {
  id: string;
  title: string;
  lineKey: string;
  lineLabel: string;
  unitsSold: number;
  revenue: number;
}

export interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  categories: number;
  featuredProducts: number;
  promoProducts: number;
  orders: number;
  recentProducts: Array<{
    id: string;
    title: string;
    price: number;
    product_images?: Array<{ url: string; sort_order: number }>;
  }>;
  catalogMetrics?: CatalogMetrics;
}

export type AnalyticsPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface TrendPoint {
  bucket: string;
  label: string;
  value: number;
}

export interface DashboardAnalytics {
  period: AnalyticsPeriod;
  timezone: string;
  range: { from: string; to: string };
  categoryId: string | null;
  series: {
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
  };
  comparison: {
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
  };
}

export interface DashboardOverview {
  generatedAt: string;
  current: DashboardStats;
  analytics: DashboardAnalytics;
}

export async function getDashboardStats() {
  return apiRequest<DashboardStats>('/api/dashboard/stats', { auth: true });
}

export async function getDashboardAnalytics(period: AnalyticsPeriod, categoryId?: string | null) {
  const query = new URLSearchParams({ period });
  if (categoryId) query.set('categoryId', categoryId);
  return apiRequest<DashboardAnalytics>(`/api/dashboard/analytics?${query.toString()}`, { auth: true });
}

export async function getDashboardOverview(period: AnalyticsPeriod, categoryId?: string | null) {
  const query = new URLSearchParams({ period });
  if (categoryId) query.set('categoryId', categoryId);
  return apiRequest<DashboardOverview>(`/api/dashboard/overview?${query.toString()}`, { auth: true });
}

