import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import type { TrendPoint } from '../../../services/dashboardService';
import { AnimatedCounter } from './AnimatedCounter';
import { MiniSparkChart } from './MiniSparkChart';

export function MetricTrendCard({
  label,
  value,
  points,
  comparison,
  format,
}: {
  label: string;
  value: number;
  points: TrendPoint[];
  comparison: number | null;
  format?: (value: number) => string;
}) {
  const positive = comparison !== null && comparison > 0;
  const negative = comparison !== null && comparison < 0;
  const ComparisonIcon = positive ? ArrowUpRight : negative ? ArrowDownRight : Minus;

  return (
    <article className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm min-w-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 truncate">{label}</p>
          <strong className="mt-1 block text-xl md:text-2xl font-black text-neutral-900">
            <AnimatedCounter value={value} format={format} />
          </strong>
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-black ${
          positive ? 'bg-emerald-50 text-emerald-700' : negative ? 'bg-red-50 text-red-700' : 'bg-neutral-100 text-neutral-500'
        }`}>
          <ComparisonIcon className="h-3 w-3" />
          {comparison === null ? 'Sem base' : `${Math.abs(comparison).toLocaleString('pt-BR')}%`}
        </span>
      </div>
      <div className="mt-2">
        <MiniSparkChart points={points} label={label} />
      </div>
    </article>
  );
}
