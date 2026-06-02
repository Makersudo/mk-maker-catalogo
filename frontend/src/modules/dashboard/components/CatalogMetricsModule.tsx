import { useState } from 'react';
import {
  Activity,
  AlertCircle,
  BarChart3,
  Boxes,
  CheckCircle2,
  DollarSign,
  Image,
  PackageCheck,
  Palette,
  PieChart,
  TrendingUp,
} from 'lucide-react';
import type { CatalogMetrics } from '../../../services/dashboardService';

type MetricsTab = 'overview' | 'lines' | 'publication' | 'stock' | 'sales' | 'quality';

const tabs: Array<{ id: MetricsTab; label: string; icon: typeof BarChart3 }> = [
  { id: 'overview', label: 'Visao Geral', icon: BarChart3 },
  { id: 'lines', label: 'Linhas', icon: Palette },
  { id: 'publication', label: 'Publicacao', icon: PackageCheck },
  { id: 'stock', label: 'Estoque', icon: Boxes },
  { id: 'sales', label: 'Vendas', icon: DollarSign },
  { id: 'quality', label: 'Qualidade', icon: AlertCircle },
];

export function CatalogMetricsModule({ metrics }: { metrics: CatalogMetrics }) {
  const [activeTab, setActiveTab] = useState<MetricsTab>('overview');

  return (
    <section className="bg-white border border-neutral-200 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-sm">
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4 mb-5">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#F8EEEC] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#8D514B]">
            <PieChart className="w-3.5 h-3.5" />
            Painel da vitrine
          </span>
          <h2 className="text-lg md:text-2xl font-black text-neutral-900 uppercase tracking-tight mt-3">Metricas da Loja</h2>
          <p className="text-xs md:text-sm text-neutral-500 mt-1">Indicadores por categoria, publicacao, estoque, pedidos e qualidade da vitrine.</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-neutral-950 to-[#7A4944] text-white p-4 min-w-[190px]">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#F3E3DF]">Qualidade da vitrine</p>
          <strong className="block text-4xl font-black mt-1">{metrics.summary.completionScore}%</strong>
          <div className="mt-3">{ProgressBar({ value: metrics.summary.completionScore, color: 'bg-[#C98F86]' })}</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const selected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-black uppercase tracking-tight whitespace-nowrap border transition-colors ${
                selected
                  ? 'bg-neutral-950 text-white border-neutral-950'
                  : 'bg-white text-neutral-500 border-neutral-200 hover:border-[#E7C9C4] hover:text-[#8D514B]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'overview' && <OverviewTab metrics={metrics} />}
      {activeTab === 'lines' && <CatalogLinesTab metrics={metrics} />}
      {activeTab === 'publication' && <PublicationTab metrics={metrics} />}
      {activeTab === 'stock' && <StockTab metrics={metrics} />}
      {activeTab === 'sales' && <SalesTab metrics={metrics} />}
      {activeTab === 'quality' && <QualityTab metrics={metrics} />}
    </section>
  );
}

function OverviewTab({ metrics }: { metrics: CatalogMetrics }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="grid grid-cols-2 gap-3">
        <MiniMetric label="Receita valida" value={currency(metrics.sales.totalRevenue)} detail={`${metrics.sales.validOrders} pedidos`} />
        <MiniMetric label="Ticket medio" value={currency(metrics.sales.averageTicket)} detail={`${metrics.sales.unitsSold} itens vendidos`} />
        <MiniMetric label="Valor em mercadoria" value={currency(metrics.inventoryValue.purchaseValue)} detail={`${metrics.inventoryValue.productsWithPurchaseCost} com custo`} />
        <MiniMetric label="Potencial de venda" value={currency(metrics.inventoryValue.saleValue)} detail={`${metrics.stockHealth.totalUnits} unidades`} />
        <MiniMetric label="Lucro bruto est." value={currency(metrics.inventoryValue.estimatedGrossProfit)} detail={`${metrics.inventoryValue.estimatedGrossMarginPercent}% margem`} />
        <MiniMetric label="Preco medio" value={currency(metrics.summary.averagePrice)} detail={`${currency(metrics.summary.priceMin)} - ${currency(metrics.summary.priceMax)}`} />
        <MiniMetric label="Estoque total" value={metrics.stockHealth.totalUnits} detail={`${metrics.stockHealth.variantManaged} com variantes`} />
        <MiniMetric label="Produtos live" value={metrics.summary.liveProducts} detail={`${metrics.summary.totalProducts} no total`} />
        <MiniMetric label="Imagens" value={`${metrics.imageCoverage.percent}%`} detail={`${metrics.imageCoverage.withImage} com imagem`} />
      </div>
      <div className="rounded-2xl border border-neutral-100 bg-gradient-to-br from-neutral-950 to-[#7A4944] p-5 text-white">
        <h3 className="text-xs font-black uppercase tracking-widest text-neutral-300 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Saude geral do catalogo
        </h3>
        <div className="mt-5 space-y-4">
          <GraphLine label="Publicados" value={percentOf(metrics.summary.liveProducts, metrics.summary.totalProducts)} color="bg-[#C98F86]" dark />
          <GraphLine label="Com imagem" value={metrics.imageCoverage.percent} color="bg-[#E7C9C4]" dark />
          <GraphLine label="Estoque saudavel" value={percentOf(metrics.stockHealth.ok, metrics.summary.totalProducts)} color="bg-white" dark />
        </div>
        <div className="grid grid-cols-3 gap-2 mt-5 text-center">
          <DarkMini label="Novos" value={metrics.summary.newProducts} />
          <DarkMini label="Promo" value={metrics.summary.promoProducts} />
          <DarkMini label="Destaques" value={metrics.summary.featuredProducts} />
        </div>
      </div>
    </div>
  );
}

function CatalogLinesTab({ metrics }: { metrics: CatalogMetrics }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {metrics.catalogLines.map((item) => (
        <div key={item.key} className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-lg font-black text-neutral-900">{item.label}</h3>
              <p className="text-xs text-neutral-500">{item.total} produtos cadastrados</p>
            </div>
            <strong className="text-xl font-black text-neutral-900">{currency(item.revenue)}</strong>
          </div>
          <div className="space-y-3">
            <GraphLine label="Publicado" value={percentOf(item.live, item.total)} color={lineColor(item.key, 0)} />
            <GraphLine label="Com imagem" value={percentOf(item.withImage, item.total)} color={lineColor(item.key, 1)} />
            <GraphLine label="Ativo" value={percentOf(item.active, item.total)} color={lineColor(item.key, 2)} />
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            <MiniMetric label="Estoque" value={item.stockUnits} />
            <MiniMetric label="Vendidos" value={item.unitsSold} />
            <MiniMetric label="Sem preco" value={item.withoutPrice} />
          </div>
        </div>
      ))}
    </div>
  );
}

function PublicationTab({ metrics }: { metrics: CatalogMetrics }) {
  const total = metrics.statusFunnel.draft + metrics.statusFunnel.ready + metrics.statusFunnel.live;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <div className="lg:col-span-2 rounded-2xl border border-neutral-100 bg-neutral-950 p-5 text-white">
        <h3 className="text-xs font-black uppercase tracking-widest text-neutral-300 mb-5">Funil de publicacao</h3>
        <div className="space-y-4">
          <GraphLine label="Rascunho" value={percentOf(metrics.statusFunnel.draft, total)} color="bg-neutral-400" dark count={metrics.statusFunnel.draft} />
          <GraphLine label="Pronto" value={percentOf(metrics.statusFunnel.ready, total)} color="bg-amber-400" dark count={metrics.statusFunnel.ready} />
          <GraphLine label="Publicado" value={percentOf(metrics.statusFunnel.live, total)} color="bg-emerald-400" dark count={metrics.statusFunnel.live} />
        </div>
      </div>
      <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatusCard label="Rascunho" value={metrics.statusFunnel.draft} detail="Precisa preparacao" tone="neutral" />
        <StatusCard label="Pronto" value={metrics.statusFunnel.ready} detail="Pode revisar e publicar" tone="amber" />
        <StatusCard label="Publicado" value={metrics.statusFunnel.live} detail="Visivel no catalogo" tone="emerald" />
      </div>
    </div>
  );
}

function StockTab({ metrics }: { metrics: CatalogMetrics }) {
  const total = metrics.stockHealth.ok + metrics.stockHealth.low + metrics.stockHealth.zero;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="rounded-2xl border border-neutral-100 p-4">
        <h3 className="text-xs font-black text-neutral-600 uppercase tracking-widest flex items-center gap-2 mb-4">
          <Boxes className="w-4 h-4" />
          Grafico de estoque
        </h3>
        <div className="space-y-4">
          <GraphLine label="OK" value={percentOf(metrics.stockHealth.ok, total)} color="bg-emerald-600" count={metrics.stockHealth.ok} />
          <GraphLine label="Baixo" value={percentOf(metrics.stockHealth.low, total)} color="bg-amber-500" count={metrics.stockHealth.low} />
          <GraphLine label="Zerado" value={percentOf(metrics.stockHealth.zero, total)} color="bg-red-600" count={metrics.stockHealth.zero} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <MiniMetric label="Unidades totais" value={metrics.stockHealth.totalUnits} />
        <MiniMetric label="Com variantes" value={metrics.stockHealth.variantManaged} />
        <MiniMetric label="Limite baixo" value={`${metrics.stockHealth.lowStockThreshold} un.`} />
        <MiniMetric label="Alertas estoque" value={metrics.quality.zeroStock.count + metrics.quality.lowStock.count} />
      </div>
    </div>
  );
}

function SalesTab({ metrics }: { metrics: CatalogMetrics }) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <div className="grid grid-cols-2 gap-3">
        <MiniMetric label="Receita total" value={currency(metrics.sales.totalRevenue)} />
        <MiniMetric label="Ticket medio" value={currency(metrics.sales.averageTicket)} />
        <MiniMetric label="Pedidos validos" value={metrics.sales.validOrders} />
        <MiniMetric label="Cancelados" value={metrics.sales.cancelledOrders} />
        <MiniMetric label="Receita 7 dias" value={currency(metrics.activity.revenueLast7Days)} detail={`${metrics.activity.ordersLast7Days} pedidos`} />
        <MiniMetric label="Receita 30 dias" value={currency(metrics.activity.revenueLast30Days)} detail={`${metrics.activity.ordersLast30Days} pedidos`} />
      </div>
      <div className="grid grid-cols-1 gap-4">
        <RankingList title="Top produtos por receita" items={metrics.topProductsByRevenue} valueType="revenue" />
        <RankingList title="Top produtos por unidades" items={metrics.topProductsByUnits} valueType="units" />
      </div>
    </div>
  );
}

function QualityTab({ metrics }: { metrics: CatalogMetrics }) {
  const issues = [
    { label: 'Sem imagem', count: metrics.quality.withoutImage.count, tone: 'red' },
    { label: 'Sem preco', count: metrics.quality.withoutPrice.count, tone: 'red' },
    { label: 'Sem categoria', count: metrics.quality.withoutCategory.count, tone: 'amber' },
    { label: 'Sem subcategoria', count: metrics.quality.withoutSubcategory.count, tone: 'amber' },
    { label: 'Estoque zerado', count: metrics.quality.zeroStock.count, tone: 'red' },
    { label: 'Categorias vazias', count: metrics.quality.emptyCategories.count, tone: 'neutral' },
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <div className="xl:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-3">
        {issues.map((issue) => (
          <IssueCard key={issue.label} label={issue.label} count={issue.count} tone={issue.tone} />
        ))}
      </div>
      <div className="rounded-2xl border border-neutral-100 p-4">
        <h3 className="text-xs font-black text-neutral-600 uppercase tracking-widest mb-3">Acoes prioritarias</h3>
        {metrics.alerts.length === 0 ? (
          <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-emerald-700 text-sm font-bold">
            <CheckCircle2 className="w-5 h-5 mb-2" />
            Nenhum alerta critico encontrado.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {metrics.alerts.slice(0, 6).map((alert) => (
              <div key={alert.label} className={`rounded-xl border p-3 ${alert.severity === 'critical' ? 'bg-red-50 border-red-100 text-red-700' : alert.severity === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-800' : 'bg-[#F8EEEC] border-[#E7C9C4] text-[#8D514B]'}`}>
                <div className="flex items-center justify-between gap-3">
                  <strong className="text-sm">{alert.label}</strong>
                  <span className="text-lg font-black">{alert.count}</span>
                </div>
                <p className="text-xs mt-1 opacity-80">{alert.action}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MiniMetric({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return (
    <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-3">
      <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{label}</p>
      <strong className="block mt-1 text-lg font-black text-neutral-900">{value}</strong>
      {detail && <span className="text-[11px] text-neutral-500">{detail}</span>}
    </div>
  );
}

function DarkMini({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-white/10 p-3">
      <p className="text-[10px] uppercase tracking-widest text-neutral-400 font-black">{label}</p>
      <strong className="text-lg font-black">{value}</strong>
    </div>
  );
}

function RankingList({ title, items, valueType }: {
  title: string;
  items: CatalogMetrics['topProductsByRevenue'];
  valueType: 'revenue' | 'units';
}) {
  return (
    <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4">
      <h3 className="text-xs font-black text-neutral-600 uppercase tracking-widest mb-3">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-neutral-400">Sem vendas registradas.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item, index) => (
            <div key={`${title}-${item.id}`} className="flex items-center justify-between gap-3 text-sm">
              <div className="min-w-0">
                <p className="font-bold text-neutral-800 truncate">{index + 1}. {item.title}</p>
                <span className="text-[11px] uppercase tracking-widest text-neutral-400">{item.lineLabel}</span>
              </div>
              <strong className="shrink-0 text-neutral-900">
                {valueType === 'revenue' ? currency(item.revenue) : `${item.unitsSold} un.`}
              </strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GraphLine({ label, value, color, count, dark = false }: {
  label: string;
  value: number;
  color: string;
  count?: number;
  dark?: boolean;
}) {
  return (
    <div>
      <div className={`flex justify-between text-xs font-bold mb-1 ${dark ? 'text-neutral-300' : 'text-neutral-600'}`}>
        <span>{label}</span>
        <span>{count ?? `${value}%`}</span>
      </div>
      <ProgressBar value={value} color={color} />
    </div>
  );
}

function ProgressBar({ value, color = 'bg-[#8D514B]' }: { value: number; color?: string }) {
  return (
    <div className="h-2.5 bg-white/10 rounded-full overflow-hidden ring-1 ring-black/5">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }} />
    </div>
  );
}

function StatusCard({ label, value, detail, tone }: {
  label: string;
  value: number;
  detail: string;
  tone: 'neutral' | 'amber' | 'emerald';
}) {
  const classes = {
    neutral: 'bg-neutral-50 border-neutral-100 text-neutral-900',
    amber: 'bg-amber-50 border-amber-100 text-amber-800',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
  };
  return (
    <div className={`rounded-2xl border p-5 ${classes[tone]}`}>
      <p className="text-xs font-black uppercase tracking-widest opacity-70">{label}</p>
      <strong className="block mt-2 text-4xl font-black">{value}</strong>
      <span className="text-xs font-bold opacity-75">{detail}</span>
    </div>
  );
}

function IssueCard({ label, count, tone }: { label: string; count: number; tone: string }) {
  const classes = tone === 'red'
    ? 'bg-red-50 border-red-100 text-red-700'
    : tone === 'amber'
      ? 'bg-amber-50 border-amber-100 text-amber-800'
      : 'bg-[#F8EEEC] border-[#E7C9C4] text-[#8D514B]';
  return (
    <div className={`rounded-2xl border p-4 ${classes}`}>
      <p className="text-xs font-black uppercase tracking-widest opacity-75">{label}</p>
      <strong className="block mt-2 text-3xl font-black">{count}</strong>
    </div>
  );
}

function lineColor(key: string, offset = 0) {
  const palette = ['bg-[#8D514B]', 'bg-[#C98F86]', 'bg-neutral-900', 'bg-[#D9B0AA]', 'bg-[#7A4944]', 'bg-neutral-600'];
  const hash = Array.from(key).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return palette[(hash + offset) % palette.length];
}

function currency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

function percentOf(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}
