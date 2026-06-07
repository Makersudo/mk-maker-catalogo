import { useMemo, useState } from 'react';
import { Boxes, CircleDollarSign, PackageCheck, ShieldCheck, Tags } from 'lucide-react';
import type { CatalogMetrics, DashboardAnalytics, TrendPoint } from '../../../services/dashboardService';
import { RoundedBarChart } from './RoundedBarChart';

type InsightTab = 'sales' | 'stock' | 'products' | 'categories' | 'quality';

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
        ['Receita valida', currency(metrics.sales.totalRevenue)],
        ['Lucro realizado', currency(metrics.sales.realizedGrossProfit)],
        ['Taxa de conclusao', `${metrics.orderOperations.fulfillmentRate}%`],
        ['Taxa de cancelamento', `${metrics.orderOperations.cancellationRate}%`],
        ['Pedidos abertos', metrics.orderOperations.openOrders],
        ['Tempo ate confirmar', duration(metrics.orderOperations.averageMinutesToConfirmation)],
        ['Tempo ate retirada', duration(metrics.orderOperations.averageMinutesToReady)],
        ['Tempo ate finalizar', duration(metrics.orderOperations.averageMinutesToCompletion)],
      ]}
      side={<Ranking title="Maior lucro realizado" items={metrics.topProductsByProfit.map((item) => [item.title, currency(item.realizedGrossProfit)])} />}
    />
  );
}

function StockInsight({ metrics, analytics }: { metrics: CatalogMetrics; analytics: DashboardAnalytics }) {
  return (
    <InsightLayout
      title="Evolucao do estoque"
      chart={<RoundedBarChart points={analytics.series.stockUnits} comparisonPoints={analytics.previousSeries.stockUnits} label="Estoque por periodo" />}
      metrics={[
        ['Unidades atuais', metrics.stockHealth.totalUnits],
        ['Estoque saudavel', metrics.stockHealth.ok],
        ['Estoque baixo', metrics.stockHealth.low],
        ['Estoque zerado', metrics.stockHealth.zero],
      ]}
      side={<Ranking title="Valores de estoque" items={[
        ['Valor em mercadoria', currency(metrics.inventoryValue.purchaseValue)],
        ['Potencial de venda', currency(metrics.inventoryValue.saleValue)],
        ['Lucro bruto estimado', currency(metrics.inventoryValue.estimatedGrossProfit)],
        ['Margem estimada', `${metrics.inventoryValue.estimatedGrossMarginPercent}%`],
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
        ['Produtos totais', metrics.summary.totalProducts],
        ['Produtos live', metrics.summary.liveProducts],
        ['Com imagem', metrics.imageCoverage.withImage],
        ['Com custo', metrics.inventoryValue.productsWithPurchaseCost],
      ]}
      side={<Ranking title="Funil de publicacao" items={[
        ['Rascunho', metrics.statusFunnel.draft],
        ['Pronto', metrics.statusFunnel.ready],
        ['Publicado', metrics.statusFunnel.live],
        ['Inativos', metrics.summary.inactiveProducts],
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
    .map((category) => [category.name, currency(category.realizedGrossProfit)] as [string, string]);

  return (
    <InsightLayout
      title="Lucro realizado por categoria"
      chart={<RoundedBarChart points={categoryPoints} label="Lucro realizado por categoria" formatValue={currency} />}
      metrics={[
        ['Categorias analisadas', metrics.categoryPerformance.length],
        ['Com vendas', metrics.categoryPerformance.filter((item) => item.revenue > 0).length],
        ['Receita valida', currency(metrics.sales.totalRevenue)],
        ['Lucro realizado', currency(metrics.sales.realizedGrossProfit)],
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
        ['Saude da vitrine', `${metrics.summary.completionScore}%`],
        ['Com imagem', `${metrics.imageCoverage.percent}%`],
        ['Alertas', metrics.alerts.length],
        ['Categorias vazias', metrics.quality.emptyCategories.count],
      ]}
      side={<Ranking title="Acoes prioritarias" items={metrics.alerts.slice(0, 8).map((alert) => [alert.label, alert.count])} />}
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
  metrics: Array<[string, string | number]>;
  side: React.ReactNode;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="rounded-2xl border border-neutral-100 bg-[#FBFCFB] p-4">
        <h3 className="text-sm font-black text-neutral-900">{title}</h3>
        <div className="mt-3">{chart}</div>
        <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
          {metrics.map(([label, value]) => <Metric key={label} label={label} value={value} />)}
        </div>
      </div>
      {side}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-neutral-100 bg-white p-3">
      <span className="text-[9px] font-black uppercase tracking-wider text-neutral-400">{label}</span>
      <strong className="mt-1 block text-lg font-black text-neutral-950">{value}</strong>
    </div>
  );
}

function Ranking({ title, items }: { title: string; items: Array<[string, string | number]> }) {
  return (
    <aside className="rounded-2xl border border-neutral-100 bg-neutral-950 p-4 text-white">
      <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-300">{title}</h3>
      <div className="mt-4 space-y-2">
        {items.length === 0 && <p className="text-xs text-neutral-400">Sem dados registrados.</p>}
        {items.map(([label, value], index) => (
          <div key={`${label}-${index}`} className="flex items-center justify-between gap-3 rounded-xl bg-white/7 px-3 py-2">
            <span className="min-w-0 truncate text-xs font-bold text-neutral-200">{label}</span>
            <strong className="shrink-0 text-xs">{value}</strong>
          </div>
        ))}
      </div>
    </aside>
  );
}
