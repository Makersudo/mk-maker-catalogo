import { useMemo, useState } from 'react';
import { Boxes, CircleDollarSign, PackageCheck, ShieldCheck, Tags } from 'lucide-react';
import type { CatalogMetrics, DashboardAnalytics, TrendPoint } from '../../../services/dashboardService';
import { AnimatedCounter } from './AnimatedCounter';
import { RoundedBarChart } from './RoundedBarChart';

type InsightTab = 'sales' | 'stock' | 'products' | 'categories' | 'quality';
type InsightMetric = { label: string; value: number; format?: (value: number) => string };
type RankingItem = { label: string; value: number; format?: (value: number) => string };

const tabs: Array<{ id: InsightTab; label: string; icon: typeof Boxes }> = [
  { id: 'sales', label: 'Vendas', icon: CircleDollarSign },
  { id: 'stock', label: 'Estoque', icon: Boxes },
  { id: 'products', label: 'Produtos', icon: PackageCheck },
  { id: 'categories', label: 'Categorias', icon: Tags },
  { id: 'quality', label: 'Qualidade', icon: ShieldCheck },
];

function currency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

function percent(value: number) {
  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(value || 0)}%`;
}

function points(items: Array<{ label: string; value: number }>): TrendPoint[] {
  return items.map((item, index) => ({ bucket: String(index), label: item.label, value: item.value }));
}

function duration(value: number) {
  if (!value) return 'Sem dados';
  if (value < 60) return `${value} min`;
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return minutes ? `${hours}h ${minutes}min` : `${hours}h`;
}

export function DashboardInsightsPanel({
  metrics,
  analytics,
}: {
  metrics: CatalogMetrics;
  analytics: DashboardAnalytics;
}) {
  const [activeTab, setActiveTab] = useState<InsightTab>('sales');

  return (
    <section className="mt-5 rounded-2xl border border-neutral-200 bg-white p-4 shadow-[0_14px_38px_rgba(27,31,36,0.06)] md:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#9B5F58]">Analise detalhada</span>
          <h2 className="mt-1 text-xl font-black text-neutral-950">Leituras operacionais</h2>
          <p className="mt-1 text-xs text-neutral-500">Detalhes conectados aos mesmos dados do resumo principal.</p>
        </div>
        <div className="flex gap-1 overflow-x-auto rounded-xl border border-neutral-200 bg-neutral-50 p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-[10px] font-black uppercase transition-colors ${
                  activeTab === tab.id ? 'bg-neutral-950 text-white shadow-sm' : 'text-neutral-500 hover:bg-white hover:text-neutral-900'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5">
        {activeTab === 'sales' && <SalesInsight metrics={metrics} analytics={analytics} />}
        {activeTab === 'stock' && <StockInsight metrics={metrics} analytics={analytics} />}
        {activeTab === 'products' && <ProductsInsight metrics={metrics} analytics={analytics} />}
        {activeTab === 'categories' && <CategoriesInsight metrics={metrics} />}
        {activeTab === 'quality' && <QualityInsight metrics={metrics} />}
      </div>
    </section>
  );
}

function SalesInsight({ metrics, analytics }: { metrics: CatalogMetrics; analytics: DashboardAnalytics }) {
  return (
    <InsightLayout
      title="Pedidos por periodo"
      chart={<RoundedBarChart points={analytics.series.orders} comparisonPoints={analytics.previousSeries.orders} label="Pedidos por periodo" />}
      metrics={[
        { label: 'Receita valida', value: metrics.sales.totalRevenue, format: currency },
        { label: 'Lucro realizado', value: metrics.sales.realizedGrossProfit, format: currency },
        { label: 'Taxa de conclusao', value: metrics.orderOperations.fulfillmentRate, format: percent },
        { label: 'Taxa de cancelamento', value: metrics.orderOperations.cancellationRate, format: percent },
        { label: 'Pedidos abertos', value: metrics.orderOperations.openOrders },
        { label: 'Tempo ate confirmar', value: metrics.orderOperations.averageMinutesToConfirmation, format: duration },
        { label: 'Tempo ate retirada', value: metrics.orderOperations.averageMinutesToReady, format: duration },
        { label: 'Tempo ate finalizar', value: metrics.orderOperations.averageMinutesToCompletion, format: duration },
      ]}
      side={<Ranking title="Maior lucro realizado" items={metrics.topProductsByProfit.map((item) => ({ label: item.title, value: item.realizedGrossProfit, format: currency }))} />}
    />
  );
}

function StockInsight({ metrics, analytics }: { metrics: CatalogMetrics; analytics: DashboardAnalytics }) {
  return (
    <InsightLayout
      title="Evolucao do estoque"
      chart={<RoundedBarChart points={analytics.series.stockUnits} comparisonPoints={analytics.previousSeries.stockUnits} label="Estoque por periodo" />}
      metrics={[
        { label: 'Unidades atuais', value: metrics.stockHealth.totalUnits },
        { label: 'Estoque saudavel', value: metrics.stockHealth.ok },
        { label: 'Estoque baixo', value: metrics.stockHealth.low },
        { label: 'Estoque zerado', value: metrics.stockHealth.zero },
      ]}
      side={<Ranking title="Valores de estoque" items={[
        { label: 'Valor em mercadoria', value: metrics.inventoryValue.purchaseValue, format: currency },
        { label: 'Potencial de venda', value: metrics.inventoryValue.saleValue, format: currency },
        { label: 'Lucro bruto estimado', value: metrics.inventoryValue.estimatedGrossProfit, format: currency },
        { label: 'Margem estimada', value: metrics.inventoryValue.estimatedGrossMarginPercent, format: percent },
      ]} />}
    />
  );
}

function ProductsInsight({ metrics, analytics }: { metrics: CatalogMetrics; analytics: DashboardAnalytics }) {
  return (
    <InsightLayout
      title="Produtos cadastrados"
      chart={<RoundedBarChart points={analytics.series.productsCreated} comparisonPoints={analytics.previousSeries.productsCreated} label="Produtos cadastrados por periodo" />}
      metrics={[
        { label: 'Produtos totais', value: metrics.summary.totalProducts },
        { label: 'Produtos live', value: metrics.summary.liveProducts },
        { label: 'Com imagem', value: metrics.imageCoverage.withImage },
        { label: 'Com custo', value: metrics.inventoryValue.productsWithPurchaseCost },
      ]}
      side={<Ranking title="Funil de publicacao" items={[
        { label: 'Rascunho', value: metrics.statusFunnel.draft },
        { label: 'Pronto', value: metrics.statusFunnel.ready },
        { label: 'Publicado', value: metrics.statusFunnel.live },
        { label: 'Inativos', value: metrics.summary.inactiveProducts },
      ]} />}
    />
  );
}

function CategoriesInsight({ metrics }: { metrics: CatalogMetrics }) {
  const categoryPoints = useMemo(() => points(
    [...metrics.categoryPerformance]
      .sort((a, b) => b.realizedGrossProfit - a.realizedGrossProfit)
      .slice(0, 10)
      .map((category) => ({ label: category.name, value: category.realizedGrossProfit }))
  ), [metrics.categoryPerformance]);
  const ranking = [...metrics.categoryPerformance]
    .sort((a, b) => b.realizedGrossProfit - a.realizedGrossProfit)
    .slice(0, 8)
    .map((category) => ({ label: category.name, value: category.realizedGrossProfit, format: currency }));

  return (
    <InsightLayout
      title="Lucro realizado por categoria"
      chart={<RoundedBarChart points={categoryPoints} label="Lucro realizado por categoria" formatValue={currency} />}
      metrics={[
        { label: 'Categorias analisadas', value: metrics.categoryPerformance.length },
        { label: 'Com vendas', value: metrics.categoryPerformance.filter((item) => item.revenue > 0).length },
        { label: 'Receita valida', value: metrics.sales.totalRevenue, format: currency },
        { label: 'Lucro realizado', value: metrics.sales.realizedGrossProfit, format: currency },
      ]}
      side={<Ranking title="Categorias por lucro" items={ranking} />}
    />
  );
}

function QualityInsight({ metrics }: { metrics: CatalogMetrics }) {
  const qualityPoints = points([
    { label: 'Sem imagem', value: metrics.quality.withoutImage.count },
    { label: 'Sem preco', value: metrics.quality.withoutPrice.count },
    { label: 'Sem categoria', value: metrics.quality.withoutCategory.count },
    { label: 'Sem subcategoria', value: metrics.quality.withoutSubcategory.count },
    { label: 'Estoque baixo', value: metrics.quality.lowStock.count },
    { label: 'Estoque zerado', value: metrics.quality.zeroStock.count },
  ]);

  return (
    <InsightLayout
      title="Pendencias da vitrine"
      chart={<RoundedBarChart points={qualityPoints} label="Pendencias da vitrine" />}
      metrics={[
        { label: 'Saude da vitrine', value: metrics.summary.completionScore, format: percent },
        { label: 'Com imagem', value: metrics.imageCoverage.percent, format: percent },
        { label: 'Alertas', value: metrics.alerts.length },
        { label: 'Categorias vazias', value: metrics.quality.emptyCategories.count },
      ]}
      side={<Ranking title="Acoes prioritarias" items={metrics.alerts.slice(0, 8).map((alert) => ({ label: alert.label, value: alert.count }))} />}
    />
  );
}

function InsightLayout({
  title,
  chart,
  metrics,
  side,
}: {
  title: string;
  chart: React.ReactNode;
  metrics: InsightMetric[];
  side: React.ReactNode;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="rounded-2xl border border-neutral-100 bg-[#FBFCFB] p-4">
        <h3 className="text-sm font-black text-neutral-900">{title}</h3>
        <div className="mt-3">{chart}</div>
        <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
          {metrics.map((metric) => <Metric key={metric.label} {...metric} />)}
        </div>
      </div>
      {side}
    </div>
  );
}

function Metric({ label, value, format }: InsightMetric) {
  return (
    <div className="rounded-xl border border-neutral-100 bg-white p-3">
      <span className="text-[9px] font-black uppercase tracking-wider text-neutral-400">{label}</span>
      <strong className="mt-1 block text-lg font-black text-neutral-950">
        <AnimatedCounter value={value} format={format} />
      </strong>
    </div>
  );
}

function Ranking({ title, items }: { title: string; items: RankingItem[] }) {
  return (
    <aside className="rounded-2xl border border-neutral-100 bg-neutral-950 p-4 text-white">
      <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-300">{title}</h3>
      <div className="mt-4 space-y-2">
        {items.length === 0 && <p className="text-xs text-neutral-400">Sem dados registrados.</p>}
        {items.map(({ label, value, format }, index) => (
          <div key={`${label}-${index}`} className="flex items-center justify-between gap-3 rounded-xl bg-white/7 px-3 py-2">
            <span className="min-w-0 truncate text-xs font-bold text-neutral-200">{label}</span>
            <strong className="shrink-0 text-xs">
              <AnimatedCounter value={value} format={format} />
            </strong>
          </div>
        ))}
      </div>
    </aside>
  );
}
