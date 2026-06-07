import { useState } from 'react';
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  CalendarRange,
  Download,
  RefreshCw,
  X,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import type {
  DashboardAnalytics,
  DashboardAnalyticsSeries,
  TrendPoint,
} from '../../../services/dashboardService';
import type { useDashboardOverview } from '../hooks/useDashboardOverview';
import { AnimatedCounter } from './AnimatedCounter';
import { DashboardInsightsPanel } from './DashboardInsightsPanel';
import { DashboardPrimaryChart } from './DashboardPrimaryChart';
import { MiniSparkChart } from './MiniSparkChart';
import { PeriodSelector } from './PeriodSelector';

type OverviewState = ReturnType<typeof useDashboardOverview>;
type MetricKey = keyof DashboardAnalyticsSeries;
type ComparisonKey = keyof DashboardAnalytics['comparison'];

type MetricOption = {
  key: MetricKey;
  comparisonKey: ComparisonKey;
  label: string;
  description: string;
  format: (value: number) => string;
  aggregate: 'sum' | 'last' | 'average';
};

const currency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
const integer = (value: number) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(value || 0);
const percent = (value: number) => `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(value || 0)}%`;

export const metricOptions: MetricOption[] = [
  { key: 'revenue', comparisonKey: 'revenuePercent', label: 'Receita', description: 'Receita confirmada no periodo', format: currency, aggregate: 'sum' },
  { key: 'realizedGrossProfit', comparisonKey: 'realizedGrossProfitPercent', label: 'Lucro realizado', description: 'Lucro das vendas confirmadas', format: currency, aggregate: 'sum' },
  { key: 'orders', comparisonKey: 'ordersPercent', label: 'Pedidos', description: 'Pedidos validos no periodo', format: integer, aggregate: 'sum' },
  { key: 'unitsSold', comparisonKey: 'unitsSoldPercent', label: 'Unidades', description: 'Quantidade total vendida', format: integer, aggregate: 'sum' },
  { key: 'averageTicket', comparisonKey: 'averageTicketPercent', label: 'Ticket medio', description: 'Valor medio por pedido', format: currency, aggregate: 'average' },
  { key: 'stockUnits', comparisonKey: 'stockUnitsPercent', label: 'Estoque', description: 'Unidades disponiveis', format: integer, aggregate: 'last' },
  { key: 'inventoryPurchaseValue', comparisonKey: 'inventoryPurchaseValuePercent', label: 'Mercadoria', description: 'Valor investido em estoque', format: currency, aggregate: 'last' },
  { key: 'inventorySaleValue', comparisonKey: 'inventorySaleValuePercent', label: 'Potencial', description: 'Potencial atual de venda', format: currency, aggregate: 'last' },
  { key: 'estimatedGrossProfit', comparisonKey: 'estimatedGrossProfitPercent', label: 'Lucro estimado', description: 'Lucro bruto potencial', format: currency, aggregate: 'last' },
  { key: 'productsCreated', comparisonKey: 'productsCreatedPercent', label: 'Cadastros', description: 'Produtos cadastrados', format: integer, aggregate: 'sum' },
  { key: 'completionScore', comparisonKey: 'completionScorePercent', label: 'Saude', description: 'Qualidade atual da vitrine', format: percent, aggregate: 'last' },
];

function aggregate(points: TrendPoint[], mode: MetricOption['aggregate']) {
  if (mode === 'last') return points.at(-1)?.value ?? 0;
  if (mode === 'average') {
    const populated = points.filter((point) => point.value > 0);
    return populated.length ? populated.reduce((total, point) => total + point.value, 0) / populated.length : 0;
  }
  return points.reduce((total, point) => total + point.value, 0);
}

function generatedAtLabel(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

function downloadCsv(option: MetricOption, points: TrendPoint[], comparisonPoints: TrendPoint[]) {
  const rows = [
    ['Periodo', option.label, 'Periodo anterior'],
    ...points.map((point, index) => [point.label, String(point.value), String(comparisonPoints[index]?.value ?? 0)]),
  ];
  const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(';')).join('\n');
  const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `dashboard-${option.key}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function DashboardAnalyticsWorkspace({ overview }: { overview: OverviewState }) {
  const reducedMotion = useReducedMotion();
  const [metricKey, setMetricKey] = useState<MetricKey>('revenue');
  const current = overview.data?.current;
  const analytics = overview.data?.analytics;
  const metrics = current?.catalogMetrics;

  if (overview.error && !overview.data) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div className="flex-1">
            <strong className="text-sm">Dashboard temporariamente indisponivel</strong>
            <p className="mt-1 text-xs">{overview.error}</p>
          </div>
          <button type="button" onClick={overview.retry} className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs font-black uppercase">
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!current || !analytics || !metrics) {
    return <div className="h-[620px] animate-pulse rounded-3xl border border-neutral-200 bg-white shadow-sm" />;
  }

  const selected = metricOptions.find((option) => option.key === metricKey) ?? metricOptions[0];
  const selectedPoints = analytics.series[selected.key];
  const comparisonPoints = analytics.previousSeries[selected.key];
  const selectedValue = aggregate(selectedPoints, selected.aggregate);
  const selectedComparison = analytics.comparison[selected.comparisonKey];
  const health = metrics.summary.completionScore;
  const cardOptions = metricOptions.filter((option) => ['orders', 'averageTicket', 'inventoryPurchaseValue', 'inventorySaleValue'].includes(option.key));

  return (
    <section className="rounded-3xl border border-neutral-200 bg-[#F5F7F6] p-3 shadow-[0_24px_70px_rgba(27,31,36,0.08)] md:p-5">
      <header className="rounded-2xl bg-white p-4 shadow-[0_12px_32px_rgba(27,31,36,0.06)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#9B5F58]">Central de inteligencia</p>
            <h1 className="mt-1 text-2xl font-black text-neutral-950 md:text-3xl">Desempenho e saude da loja</h1>
            <p className="mt-1 text-xs text-neutral-500">Vendas, estoque, qualidade e operacao em uma unica leitura.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={overview.retry}
              disabled={overview.loading}
              title="Atualizar dados"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-600 hover:border-[#C98F86] hover:text-[#8D514B] disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${overview.loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => downloadCsv(selected, selectedPoints, comparisonPoints)}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 text-[10px] font-black uppercase text-neutral-600 hover:border-[#C98F86] hover:text-[#8D514B]"
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </button>
            <span className="w-full text-right text-[10px] font-bold text-neutral-400 sm:w-auto">Atualizado {generatedAtLabel(overview.data.generatedAt)}</span>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 border-t border-neutral-100 pt-4 xl:flex-row xl:items-center">
          <select
            id="overview-category"
            value={overview.categoryId ?? ''}
            onChange={(event) => overview.setCategoryId(event.target.value || null)}
            className="h-10 rounded-xl border border-neutral-200 bg-white px-3 text-xs font-bold text-neutral-700"
            aria-label="Categoria da analise"
          >
            <option value="">Todas as categorias</option>
            {metrics.categoryPerformance.map((category) => (
              <option key={category.categoryId} value={category.categoryId}>{category.name}</option>
            ))}
          </select>
          <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3">
            <CalendarRange className="h-4 w-4 shrink-0 text-neutral-400" />
            <input aria-label="Data inicial" type="date" value={overview.dateFrom} onChange={(event) => overview.setDateFrom(event.target.value)} className="h-10 min-w-0 bg-transparent text-xs font-bold text-neutral-600 outline-none" />
            <span className="text-neutral-300">-</span>
            <input aria-label="Data final" type="date" value={overview.dateTo} onChange={(event) => overview.setDateTo(event.target.value)} className="h-10 min-w-0 bg-transparent text-xs font-bold text-neutral-600 outline-none" />
            {(overview.dateFrom || overview.dateTo) && (
              <button type="button" title="Limpar datas" onClick={overview.clearDateRange} className="text-neutral-400 hover:text-neutral-900"><X className="h-4 w-4" /></button>
            )}
          </div>
          <div className="xl:ml-auto"><PeriodSelector value={overview.period} onChange={overview.setPeriod} /></div>
        </div>
      </header>

      <div className="mt-4 flex gap-1 overflow-x-auto rounded-2xl border border-neutral-200 bg-white p-1.5 shadow-sm">
        {metricOptions.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setMetricKey(option.key)}
            className={`whitespace-nowrap rounded-xl px-3 py-2 text-[10px] font-black uppercase transition-colors ${
              metricKey === option.key ? 'bg-[#078653] text-white shadow-sm' : 'text-neutral-500 hover:bg-emerald-50 hover:text-emerald-800'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <motion.div
        key={`${overview.period}:${overview.categoryId ?? 'all'}:${metricKey}`}
        className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12"
        initial={reducedMotion ? false : 'hidden'}
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.065 } } }}
      >
        <Reveal className="xl:col-span-3">
          <article className="h-full rounded-2xl bg-[#078653] p-5 text-white shadow-[0_18px_42px_rgba(4,120,87,0.22)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-100">{selected.label}</span>
                <p className="mt-1 text-xs text-emerald-100">{selected.description}</p>
              </div>
              <TrendBadge value={selectedComparison} dark />
            </div>
            <strong className="mt-8 block text-3xl font-black"><AnimatedCounter value={selectedValue} format={selected.format} /></strong>
            <div className="mt-8 rounded-xl bg-white/10 p-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-100">Periodo analisado</span>
              <strong className="mt-1 block text-sm">{analytics.range.from} a {analytics.range.to}</strong>
            </div>
          </article>
        </Reveal>

        <Reveal className="xl:col-span-6">
          <article className="h-full rounded-2xl border border-neutral-200 bg-white p-5 shadow-[0_18px_45px_rgba(27,31,36,0.08)]">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">{selected.label} por periodo</span>
                <h2 className="mt-1 text-lg font-black text-neutral-950">Evolucao da operacao</h2>
              </div>
              <div className="flex items-center gap-3 text-[9px] font-black uppercase text-neutral-500">
                <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[#078653]" />Atual</span>
                <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[#E5ECE8]" />Anterior</span>
              </div>
            </div>
            <DashboardPrimaryChart points={selectedPoints} comparisonPoints={comparisonPoints} label={selected.label} formatValue={selected.format} />
          </article>
        </Reveal>

        <Reveal className="xl:col-span-3">
          <article className="h-full rounded-2xl border border-[#CFE5DA] bg-white p-5 shadow-[0_16px_38px_rgba(7,134,83,0.08)]">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Saude agora</span>
            <strong className="mt-3 block text-5xl font-black text-neutral-950"><AnimatedCounter value={health} format={percent} /></strong>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-emerald-50">
              <div className="h-full rounded-full bg-[#078653]" style={{ width: `${health}%` }} />
            </div>
            <div className="mt-7 grid grid-cols-2 gap-2">
              <NowMetric label="Live" value={metrics.summary.liveProducts} />
              <NowMetric label="Com imagem" value={metrics.imageCoverage.withImage} />
              <NowMetric label="Estoque" value={metrics.stockHealth.totalUnits} />
              <NowMetric label="Alertas" value={metrics.alerts.length} />
            </div>
          </article>
        </Reveal>

        {cardOptions.map((option) => {
          const value = aggregate(analytics.series[option.key], option.aggregate);
          return (
            <Reveal key={option.key} className="xl:col-span-3">
              <article className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-[0_10px_28px_rgba(27,31,36,0.05)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">{option.label}</span>
                    <strong className="mt-1 block text-xl font-black text-neutral-950"><AnimatedCounter value={value} format={option.format} /></strong>
                  </div>
                  <TrendBadge value={analytics.comparison[option.comparisonKey]} />
                </div>
                <MiniSparkChart points={analytics.series[option.key]} label={option.label} />
              </article>
            </Reveal>
          );
        })}
      </motion.div>

      <DashboardInsightsPanel metrics={metrics} analytics={analytics} />
    </section>
  );
}

function Reveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.28 } } }}>
      {children}
    </motion.div>
  );
}

function NowMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-neutral-100 bg-[#F8FAF9] p-3">
      <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400">{label}</span>
      <strong className="mt-1 block text-lg font-black text-neutral-950"><AnimatedCounter value={value} /></strong>
    </div>
  );
}

function TrendBadge({ value, dark = false }: { value: number | null; dark?: boolean }) {
  if (value === null) return <span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase ${dark ? 'bg-white/10 text-emerald-100' : 'bg-neutral-100 text-neutral-400'}`}>Sem base</span>;
  const positive = value >= 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-black ${dark ? 'bg-white/12 text-white' : positive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
      <Icon className="h-3 w-3" />
      {Math.abs(value)}%
    </span>
  );
}
