import { motion, useReducedMotion } from 'motion/react';
import type { TrendPoint } from '../../../services/dashboardService';

type RoundedBarChartProps = {
  points: TrendPoint[];
  comparisonPoints?: TrendPoint[];
  label: string;
  formatValue?: (value: number) => string;
  height?: number;
  compact?: boolean;
  highlightMax?: boolean;
};

function shortNumber(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    notation: Math.abs(value) >= 1_000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(value);
}

export function RoundedBarChart({
  points,
  comparisonPoints = [],
  label,
  formatValue = shortNumber,
  height = 270,
  compact = false,
  highlightMax = true,
}: RoundedBarChartProps) {
  const reducedMotion = useReducedMotion();
  const width = 760;
  const top = compact ? 6 : 26;
  const bottom = compact ? 4 : 34;
  const left = compact ? 3 : 42;
  const right = compact ? 3 : 8;
  const chartHeight = height - top - bottom;
  const chartWidth = width - left - right;
  const maxValue = Math.max(1, ...points.map((point) => point.value), ...comparisonPoints.map((point) => point.value));
  const slot = chartWidth / Math.max(points.length, 1);
  const barWidth = Math.max(3, Math.min(compact ? 12 : 38, slot * 0.62));
  const maxIndex = points.reduce((best, point, index) => point.value > (points[best]?.value ?? -1) ? index : best, 0);
  const patternId = `rounded-bars-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const labelEvery = Math.max(1, Math.ceil(points.length / (compact ? 0 : 7)));

  return (
    <motion.svg
      viewBox={`0 0 ${width} ${height}`}
      className={compact ? 'h-14 w-full' : 'w-full'}
      style={compact ? undefined : { minHeight: height }}
      role="img"
      aria-label={`${label}: grafico de barras com ${points.length} periodos`}
      initial={reducedMotion ? false : 'hidden'}
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: compact ? 0.025 : 0.045 } } }}
    >
      <defs>
        <pattern id={patternId} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <rect width="7" height="7" fill="#9BCDB7" />
          <rect width="2" height="7" fill="#78B99B" opacity="0.48" />
        </pattern>
      </defs>

      {!compact && [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
        const y = top + chartHeight - chartHeight * ratio;
        return (
          <g key={ratio}>
            <line x1={left} y1={y} x2={width - right} y2={y} stroke="#E7ECE9" strokeDasharray="5 7" />
            <text x={left - 8} y={y + 4} textAnchor="end" fill="#8A938E" fontSize="10" fontWeight="700">
              {shortNumber(maxValue * ratio)}
            </text>
          </g>
        );
      })}

      {points.map((point, index) => {
        const x = left + slot * index + (slot - barWidth) / 2;
        const valueHeight = Math.max(point.value > 0 ? 4 : 0, (point.value / maxValue) * chartHeight);
        const y = top + chartHeight - valueHeight;
        const previous = comparisonPoints[index]?.value ?? 0;
        const previousHeight = (previous / maxValue) * chartHeight;
        const isMax = highlightMax && index === maxIndex && point.value > 0;
        const radius = Math.min(barWidth / 2, valueHeight / 2);

        return (
          <motion.g
            key={`${point.bucket}-${index}`}
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1 },
            }}
          >
            {previous > 0 && (
              <rect
                x={x - 3}
                y={top + chartHeight - previousHeight}
                width={barWidth + 6}
                height={previousHeight}
                rx={(barWidth + 6) / 2}
                fill="#E5ECE8"
                opacity="0.76"
              >
                <title>Periodo anterior: {formatValue(previous)}</title>
              </rect>
            )}
            <motion.rect
              x={x}
              width={barWidth}
              rx={radius}
              fill={isMax ? '#078653' : `url(#${patternId})`}
              initial={reducedMotion ? false : { y: top + chartHeight, height: 0, opacity: 0.35 }}
              animate={{ y, height: valueHeight, opacity: 1 }}
              transition={{ duration: 0.95, delay: Math.min(index * 0.09, 0.72), ease: [0.16, 1, 0.3, 1] }}
            >
              <title>{point.label}: {formatValue(point.value)}</title>
            </motion.rect>
            {isMax && !compact && (
              <motion.circle
                cx={x + barWidth / 2}
                cy={y - 7}
                r="5"
                fill="#078653"
                stroke="#FFFFFF"
                strokeWidth="2"
                initial={reducedMotion ? false : { scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4 }}
              />
            )}
            {!compact && index % labelEvery === 0 && (
              <text x={x + barWidth / 2} y={height - 10} textAnchor="middle" fill="#7E8983" fontSize="10" fontWeight="800">
                {point.label}
              </text>
            )}
          </motion.g>
        );
      })}
    </motion.svg>
  );
}
