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

export async function getDashboardStats() {
  return apiRequest<DashboardStats>('/api/dashboard/stats', { auth: true });
}

