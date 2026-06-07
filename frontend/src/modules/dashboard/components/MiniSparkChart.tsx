import { motion, useReducedMotion } from 'motion/react';
import type { TrendPoint } from '../../../services/dashboardService';

function chartPath(points: TrendPoint[], width: number, height: number): string {
  if (points.length === 0) return '';
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return points.map((point, index) => {
    const x = points.length === 1 ? width / 2 : (index / (points.length - 1)) * width;
    const y = height - 4 - ((point.value - min) / range) * (height - 8);
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(' ');
}

export function MiniSparkChart({
  points,
  label,
  color = '#A5635C',
}: {
  points: TrendPoint[];
  label: string;
  color?: string;
}) {
  const reducedMotion = useReducedMotion();
  const width = 180;
  const height = 52;
  const path = chartPath(points, width, height);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-14"
      role="img"
      aria-label={`${label}: evolucao em ${points.length} periodos`}
      preserveAspectRatio="none"
    >
      <path d={`M 0 ${height - 4} L ${width} ${height - 4}`} stroke="#EDE7E5" strokeWidth="1" />
      {path && (
        <motion.path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={reducedMotion ? false : { pathLength: 0, opacity: 0.4 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.65, ease: 'easeOut' }}
        />
      )}
    </svg>
  );
}
