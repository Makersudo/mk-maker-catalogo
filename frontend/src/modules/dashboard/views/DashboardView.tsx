import { useEffect, useState } from 'react';
import { AlertCircle, Package, ShoppingBag, Tag, TrendingUp } from 'lucide-react';
import { type CatalogMetrics, type DashboardStats, getDashboardStats } from '../../../services/dashboardService';
import { CatalogMetricsModule } from '../components/CatalogMetricsModule';
import { HistoricalAnalyticsPanel } from '../components/HistoricalAnalyticsPanel';
import { useDashboardAnalytics } from '../hooks/useDashboardAnalytics';

const emptyCatalogMetrics: CatalogMetrics = {
  summary: {
    totalProducts: 0,
    activeProducts: 0,
    inactiveProducts: 0,
    liveProducts: 0,
    completionScore: 0,
    averagePrice: 0,
    priceMin: 0,
    priceMax: 0,
    featuredProducts: 0,
    promoProducts: 0,
    newProducts: 0,
  },
  inventoryValue: {
    purchaseValue: 0,
    saleValue: 0,
    estimatedGrossProfit: 0,
    estimatedGrossMarginPercent: 0,
    productsWithPurchaseCost: 0,
  },
  statusFunnel: { draft: 0, ready: 0, live: 0 },
  imageCoverage: { total: 0, withImage: 0, withoutImage: 0, percent: 0 },
  stockHealth: { totalUnits: 0, ok: 0, low: 0, zero: 0, variantManaged: 0, lowStockThreshold: 5 },
  sales: { totalOrders: 0, validOrders: 0, cancelledOrders: 0, totalRevenue: 0, averageTicket: 0, unitsSold: 0 },
  catalogLines: [],
  quality: {
    withoutImage: { count: 0, products: [] },
    withoutPrice: { count: 0, products: [] },
    withoutCategory: { count: 0, products: [] },
    withoutSubcategory: { count: 0, products: [] },
    zeroStock: { count: 0, products: [] },
    lowStock: { count: 0, products: [] },
    emptyCategories: { count: 0, categories: [] },
  },
  topProductsByRevenue: [],
  topProductsByUnits: [],
  categoryPerformance: [],
  activity: {
    productsCreatedLast7Days: 0,
    productsCreatedLast30Days: 0,
    ordersLast7Days: 0,
    ordersLast30Days: 0,
    revenueLast7Days: 0,
    revenueLast30Days: 0,
  },
  alerts: [],
};

const emptyDashboard: DashboardStats = {
  totalProducts: 0,
  activeProducts: 0,
  inactiveProducts: 0,
  categories: 0,
  featuredProducts: 0,
  promoProducts: 0,
  orders: 0,
  recentProducts: [],
  catalogMetrics: emptyCatalogMetrics,
};

function currency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

export function DashboardView() {
  const [dashboard, setDashboard] = useState<DashboardStats>(emptyDashboard);
  const analytics = useDashboardAnalytics();

  useEffect(() => {
    getDashboardStats().then((stats) => {
      setDashboard({ ...stats, catalogMetrics: stats.catalogMetrics ?? emptyCatalogMetrics });
    }).catch(() => undefined);
  }, []);

  const metrics = dashboard.catalogMetrics ?? emptyCatalogMetrics;
  const recentProducts = dashboard.recentProducts.slice(0, 4);
  const stats = [
    { label: 'Total de Produtos', value: dashboard.totalProducts.toString(), icon: Package, color: 'text-[#8D514B]', bg: 'bg-[#F8EEEC]' },
    { label: 'Produtos Ativos', value: dashboard.activeProducts.toString(), icon: ShoppingBag, color: 'text-neutral-900', bg: 'bg-neutral-100' },
    { label: 'Categorias Ativas', value: dashboard.categories.toString(), icon: Tag, color: 'text-[#C98F86]', bg: 'bg-[#FBF5F3]' },
    { label: 'Destaques/Promocoes', value: (dashboard.featuredProducts + dashboard.promoProducts).toString(), icon: TrendingUp, color: 'text-[#7A4944]', bg: 'bg-[#F3E3DF]' },
  ];

  return (
    <div className="flex flex-col gap-4 md:gap-8 max-w-7xl mx-auto pb-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-tight text-neutral-900">Dashboard</h1>
        <p className="text-xs md:text-sm text-neutral-500 mt-1">Visao geral do sistema de catalogo MK MAKER.</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-3 md:p-6 rounded-xl md:rounded-2xl border border-neutral-200 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4">
            <div className={`w-10 h-10 md:w-14 md:h-14 rounded-lg md:rounded-xl flex items-center justify-center shrink-0 ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-5 h-5 md:w-7 md:h-7" />
            </div>
            <div>
              <p className="text-[10px] md:text-xs font-bold text-neutral-500 uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-lg md:text-2xl font-bold text-neutral-900 mt-0.5 md:mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}

        <div className="col-span-2 lg:col-span-4 bg-amber-50 border border-amber-200 rounded-xl md:rounded-2xl p-3 md:p-4 flex items-start md:items-center gap-3 md:gap-4">
          <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-amber-600 shrink-0 mt-0.5 md:mt-0" />
          <p className="text-xs md:text-sm text-amber-800 font-medium">Voce possui <strong>{dashboard.inactiveProducts} produtos inativos</strong> no momento. Eles nao estao visiveis no catalogo principal.</p>
        </div>
      </div>

      <HistoricalAnalyticsPanel
        analytics={analytics}
        categories={metrics.categoryPerformance.map((category) => ({
          categoryId: category.categoryId,
          name: category.name,
        }))}
      />

      <CatalogMetricsModule metrics={metrics} />

      <div className="bg-white border border-neutral-200 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-sm">
        <h2 className="text-base md:text-lg font-bold text-neutral-900 mb-4 md:mb-6">Ultimos Adicionados</h2>

        {recentProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[200px] md:h-[250px] text-neutral-400 border-2 border-dashed border-neutral-100 rounded-xl">
            <Package className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">Nenhum produto cadastrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {recentProducts.map((p) => {
              const image = p.product_images?.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0]?.url;
              return (
                <div key={p.id} className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                  <div className="w-10 h-10 bg-neutral-200 rounded-lg shrink-0 overflow-hidden">
                    {image ? (
                      <img src={image} alt={p.title} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-5 h-5 m-auto text-neutral-400 mt-2.5" />
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h4 className="text-sm font-bold text-neutral-900 truncate">{p.title}</h4>
                    <p className="text-xs text-neutral-500">{currency(Number(p.price))}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
