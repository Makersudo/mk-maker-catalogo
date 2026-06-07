import { AlertCircle, BarChart3, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import type { DashboardAnalytics } from '../../../services/dashboardService';
import { useAnimationPreference } from '../../../providers/AnimationPreferenceProvider';
import { dashboardAnimation } from '../dashboardAnimation';
import { MetricTrendCard } from './MetricTrendCard';
import { PeriodSelector } from './PeriodSelector';
import type { useDashboardAnalytics } from '../hooks/useDashboardAnalytics';

type AnalyticsState = ReturnType<typeof useDashboardAnalytics>;

function sum(points: Array<{ value: number }>) {
  return points.reduce((total, point) => total + point.value, 0);
}

function last(points: Array<{ value: number }>) {
  return points.at(-1)?.value ?? 0;
}

function currency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

function cards(data: DashboardAnalytics) {
  const totalRevenue = sum(data.series.revenue);
  const totalOrders = sum(data.series.orders);
  return [
    { label: 'Receita', value: totalRevenue, points: data.series.revenue, comparison: data.comparison.revenuePercent, format: currency },
    { label: 'Pedidos', value: totalOrders, points: data.series.orders, comparison: data.comparison.ordersPercent },
    { label: 'Unidades vendidas', value: sum(data.series.unitsSold), points: data.series.unitsSold, comparison: data.comparison.unitsSoldPercent },
    { label: 'Ticket medio', value: totalOrders ? totalRevenue / totalOrders : 0, points: data.series.averageTicket, comparison: data.comparison.averageTicketPercent, format: currency },
    { label: 'Lucro realizado', value: sum(data.series.realizedGrossProfit), points: data.series.realizedGrossProfit, comparison: data.comparison.realizedGrossProfitPercent, format: currency },
    { label: 'Produtos cadastrados', value: sum(data.series.productsCreated), points: data.series.productsCreated, comparison: data.comparison.productsCreatedPercent },
    { label: 'Valor em mercadoria', value: last(data.series.inventoryPurchaseValue), points: data.series.inventoryPurchaseValue, comparison: data.comparison.inventoryPurchaseValuePercent, format: currency },
    { label: 'Potencial de venda', value: last(data.series.inventorySaleValue), points: data.series.inventorySaleValue, comparison: data.comparison.inventorySaleValuePercent, format: currency },
    { label: 'Estoque atual', value: last(data.series.stockUnits), points: data.series.stockUnits, comparison: data.comparison.stockUnitsPercent },
    { label: 'Saude da vitrine', value: last(data.series.completionScore), points: data.series.completionScore, comparison: data.comparison.completionScorePercent, format: (value: number) => `${Math.round(value)}%` },
  ];
}

export function HistoricalAnalyticsPanel({
  analytics,
  categories,
}: {
  analytics: AnalyticsState;
  categories: Array<{ categoryId: string; name: string }>;
}) {
  const { shouldReduceDashboardMotion: reducedMotion } = useAnimationPreference();

  return (
    <section className="rounded-xl md:rounded-2xl border border-neutral-200 bg-[#FBF8F7] p-4 md:p-6 shadow-sm">
      <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#8D514B] border border-[#E7C9C4]">
            <BarChart3 className="h-3.5 w-3.5" />
            Historico da loja
          </span>
          <h2 className="mt-3 text-lg md:text-2xl font-black uppercase tracking-tight text-neutral-900">Desempenho por periodo</h2>
          <p className="mt-1 text-xs md:text-sm text-neutral-500">Compare vendas, estoque e valor da operacao com o periodo anterior.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <label className="sr-only" htmlFor="analytics-category">Categoria da analise</label>
          <select
            id="analytics-category"
            value={analytics.categoryId ?? ''}
            onChange={(event) => analytics.setCategoryId(event.target.value || null)}
            className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-bold text-neutral-700"
          >
            <option value="">Todas as categorias</option>
            {categories.map((category) => (
              <option key={category.categoryId} value={category.categoryId}>{category.name}</option>
            ))}
          </select>
          <PeriodSelector value={analytics.period} onChange={analytics.setPeriod} />
        </div>
      </div>

      {analytics.error && !analytics.data ? (
        <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div>
              <strong className="block text-sm">Historico ainda indisponivel</strong>
              <p className="text-xs mt-1">{analytics.error}</p>
            </div>
          </div>
          <button type="button" onClick={analytics.retry} className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-black uppercase border border-amber-200">
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </button>
        </div>
      ) : analytics.loading && !analytics.data ? (
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {Array.from({ length: 10 }, (_, index) => (
            <div key={index} className="h-36 rounded-xl border border-neutral-200 bg-white animate-pulse" />
          ))}
        </div>
      ) : analytics.data ? (
        <motion.div
          key={`${analytics.period}:${analytics.categoryId ?? 'all'}`}
          className="mt-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3"
          initial={reducedMotion ? false : 'hidden'}
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: dashboardAnimation.cardStagger } } }}
        >
          {cards(analytics.data).map((card) => (
            <motion.div
              key={card.label}
              variants={{
                hidden: { opacity: 0, y: 8 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: dashboardAnimation.cardDuration, ease: dashboardAnimation.easeOut },
                },
              }}
            >
              <MetricTrendCard {...card} />
            </motion.div>
          ))}
        </motion.div>
      ) : null}
    </section>
  );
}
