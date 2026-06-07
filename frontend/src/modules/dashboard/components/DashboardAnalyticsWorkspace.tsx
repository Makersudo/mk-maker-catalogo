import { AlertCircle, ArrowUpRight, Boxes, CircleDollarSign, Package, RefreshCw, ShoppingBag, Sparkles } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import type { useDashboardOverview } from '../hooks/useDashboardOverview';
import { AnimatedCounter } from './AnimatedCounter';
import { DashboardPrimaryChart } from './DashboardPrimaryChart';
import { MiniSparkChart } from './MiniSparkChart';
import { PeriodSelector } from './PeriodSelector';

type OverviewState = ReturnType<typeof useDashboardOverview>;

function sum(points: Array<{ value: number }>) {
  return points.reduce((total, point) => total + point.value, 0);
}

function last(points: Array<{ value: number }>) {
  return points.at(-1)?.value ?? 0;
}

function currency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

export function DashboardAnalyticsWorkspace({ overview }: { overview: OverviewState }) {
  const reducedMotion = useReducedMotion();
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

  const revenue = sum(analytics.series.revenue);
  const orders = sum(analytics.series.orders);
  const realizedProfit = sum(analytics.series.realizedGrossProfit);
  const health = metrics.summary.completionScore;
  const cards = [
    { label: 'Pedidos', value: orders, points: analytics.series.orders, icon: ShoppingBag, tone: 'text-emerald-700 bg-emerald-50' },
    { label: 'Ticket medio', value: orders ? revenue / orders : 0, points: analytics.series.averageTicket, format: currency, icon: CircleDollarSign, tone: 'text-blue-700 bg-blue-50' },
    { label: 'Valor em mercadoria', value: last(analytics.series.inventoryPurchaseValue), points: analytics.series.inventoryPurchaseValue, format: currency, icon: Boxes, tone: 'text-amber-700 bg-amber-50' },
    { label: 'Potencial de venda', value: last(analytics.series.inventorySaleValue), points: analytics.series.inventorySaleValue, format: currency, icon: Sparkles, tone: 'text-[#8D514B] bg-[#F8EEEC]' },
  ];

  return (
    <section className="rounded-3xl border border-neutral-200 bg-[#F7F7F6] p-3 shadow-[0_24px_70px_rgba(27,31,36,0.08)] md:p-5">
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-[0_12px_32px_rgba(27,31,36,0.06)] lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#9B5F58]">Central de inteligencia</p>
          <h2 className="mt-1 text-xl font-black text-neutral-950 md:text-2xl">Desempenho e saude da loja</h2>
          <p className="mt-1 text-xs text-neutral-500">Uma unica leitura para vendas, estoque, qualidade e operacao atual.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="sr-only" htmlFor="overview-category">Categoria da analise</label>
          <select
            id="overview-category"
            value={overview.categoryId ?? ''}
            onChange={(event) => overview.setCategoryId(event.target.value || null)}
            className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-bold text-neutral-700"
          >
            <option value="">Todas as categorias</option>
            {metrics.categoryPerformance.map((category) => (
              <option key={category.categoryId} value={category.categoryId}>{category.name}</option>
            ))}
          </select>
          <PeriodSelector value={overview.period} onChange={overview.setPeriod} />
        </div>
      </div>

      <motion.div
        key={`${overview.period}:${overview.categoryId ?? 'all'}`}
        className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12"
        initial={reducedMotion ? false : 'hidden'}
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.065 } } }}
      >
        <Reveal className="xl:col-span-3">
          <article className="h-full rounded-2xl bg-emerald-700 p-5 text-white shadow-[0_18px_42px_rgba(4,120,87,0.22)]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-100">Receita do periodo</span>
              <ArrowUpRight className="h-5 w-5" />
            </div>
            <strong className="mt-8 block text-3xl font-black"><AnimatedCounter value={revenue} format={currency} /></strong>
            <p className="mt-2 text-xs text-emerald-100">{orders} pedidos validos no periodo</p>
            <div className="mt-8 rounded-xl bg-white/10 p-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-100">Lucro realizado</span>
              <strong className="mt-1 block text-xl"><AnimatedCounter value={realizedProfit} format={currency} /></strong>
            </div>
          </article>
        </Reveal>

        <Reveal className="xl:col-span-6">
          <article className="h-full rounded-2xl border border-neutral-200 bg-white p-5 shadow-[0_18px_45px_rgba(27,31,36,0.08)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Receita por periodo</span>
                <h3 className="mt-1 text-lg font-black text-neutral-950">Evolucao da operacao</h3>
              </div>
              <span className="rounded-full bg-[#F8EEEC] px-3 py-1 text-[10px] font-black uppercase text-[#8D514B]">Historico vinculado</span>
            </div>
            <DashboardPrimaryChart points={analytics.series.revenue} />
          </article>
        </Reveal>

        <Reveal className="xl:col-span-3">
          <article className="h-full rounded-2xl border border-[#E7C9C4] bg-[#FFF9F7] p-5 shadow-[0_16px_38px_rgba(141,81,75,0.12)]">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#8D514B]">Saude agora</span>
            <strong className="mt-3 block text-5xl font-black text-neutral-950"><AnimatedCounter value={health} format={(value) => `${Math.round(value)}%`} /></strong>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white ring-1 ring-[#E7C9C4]">
              <div className="h-full rounded-full bg-[#C98F86]" style={{ width: `${health}%` }} />
            </div>
            <div className="mt-7 grid grid-cols-2 gap-2">
              <NowMetric label="Live" value={metrics.summary.liveProducts} />
              <NowMetric label="Com imagem" value={metrics.imageCoverage.withImage} />
              <NowMetric label="Estoque" value={metrics.stockHealth.totalUnits} />
              <NowMetric label="Alertas" value={metrics.alerts.length} />
            </div>
          </article>
        </Reveal>

        {cards.map((card) => (
          <Reveal key={card.label} className="sm:col-span-1 xl:col-span-3">
            <article className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-[0_10px_28px_rgba(27,31,36,0.05)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">{card.label}</span>
                  <strong className="mt-1 block text-xl font-black text-neutral-950">
                    <AnimatedCounter value={card.value} format={card.format} />
                  </strong>
                </div>
                <span className={`rounded-xl p-2 ${card.tone}`}><card.icon className="h-4 w-4" /></span>
              </div>
              <MiniSparkChart points={card.points} label={card.label} />
            </article>
          </Reveal>
        ))}

        <Reveal className="xl:col-span-7">
          <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-black text-neutral-950">Produtos com maior receita</h3>
            <div className="mt-4 space-y-3">
              {metrics.topProductsByRevenue.length === 0 ? (
                <p className="text-sm text-neutral-400">Sem vendas registradas no periodo.</p>
              ) : metrics.topProductsByRevenue.map((product, index) => (
                <div key={product.id} className="grid grid-cols-[28px_1fr_auto] items-center gap-3 rounded-xl bg-neutral-50 px-3 py-2">
                  <span className="font-black text-neutral-400">{index + 1}</span>
                  <div className="min-w-0">
                    <strong className="block truncate text-sm text-neutral-900">{product.title}</strong>
                    <span className="text-[10px] font-bold uppercase text-neutral-400">{product.lineLabel}</span>
                  </div>
                  <strong className="text-sm text-neutral-900">{currency(product.revenue)}</strong>
                </div>
              ))}
            </div>
          </article>
        </Reveal>

        <Reveal className="xl:col-span-5">
          <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-black text-neutral-950">Prioridades da vitrine</h3>
            <div className="mt-4 space-y-3">
              {metrics.alerts.length === 0 ? (
                <div className="rounded-xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">Nenhum alerta critico encontrado.</div>
              ) : metrics.alerts.slice(0, 5).map((alert) => (
                <div key={alert.label} className="flex items-center justify-between gap-3 rounded-xl border border-neutral-100 p-3">
                  <div>
                    <strong className="block text-sm text-neutral-900">{alert.label}</strong>
                    <span className="text-[11px] text-neutral-500">{alert.action}</span>
                  </div>
                  <span className="rounded-full bg-[#F8EEEC] px-2.5 py-1 text-xs font-black text-[#8D514B]">{alert.count}</span>
                </div>
              ))}
            </div>
          </article>
        </Reveal>
      </motion.div>
    </section>
  );
}

function Reveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.28 } },
      }}
    >
      {children}
    </motion.div>
  );
}

function NowMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[#E7C9C4] bg-white p-3">
      <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400">{label}</span>
      <strong className="mt-1 block text-lg font-black text-neutral-950"><AnimatedCounter value={value} /></strong>
    </div>
  );
}
