import { motion, useReducedMotion } from 'motion/react';
import type { TrendPoint } from '../../../services/dashboardService';

function coordinates(points: TrendPoint[], width: number, height: number) {
  if (points.length === 0) return [];
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return points.map((point, index) => ({
    ...point,
    x: points.length === 1 ? width / 2 : (index / (points.length - 1)) * width,
    y: height - 26 - ((point.value - min) / range) * (height - 52),
  }));
}

export function DashboardPrimaryChart({ points }: { points: TrendPoint[] }) {
  const reducedMotion = useReducedMotion();
  const width = 720;
  const height = 260;
  const chartPoints = coordinates(points, width, height);
  const line = chartPoints.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const area = line ? `${line} L ${width} ${height - 20} L 0 ${height - 20} Z` : '';

  return (
    <div className="min-h-[260px] w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[260px] w-full" role="img" aria-label="Evolucao da receita no periodo" preserveAspectRatio="none">
        <defs>
          <linearGradient id="dashboard-revenue-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C98F86" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#C98F86" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[60, 110, 160, 210].map((y) => (
          <path key={y} d={`M 0 ${y} L ${width} ${y}`} stroke="#EEEAE8" strokeDasharray="5 7" />
        ))}
        {area && <path d={area} fill="url(#dashboard-revenue-area)" />}
        {line && (
          <motion.path
            d={line}
            fill="none"
            stroke="#9B5F58"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={reducedMotion ? false : { pathLength: 0, opacity: 0.4 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        )}
        {chartPoints.map((point) => (
          <circle key={point.bucket} cx={point.x} cy={point.y} r="4" fill="#ffffff" stroke="#9B5F58" strokeWidth="3" />
        ))}
      </svg>
      <div className="mt-1 grid grid-cols-4 gap-2 text-[10px] font-bold uppercase text-neutral-400">
        {chartPoints.filter((_, index) => index % Math.max(1, Math.ceil(chartPoints.length / 4)) === 0).slice(0, 4).map((point) => (
          <span key={point.bucket}>{point.label}</span>
        ))}
      </div>
    </div>
  );
}
