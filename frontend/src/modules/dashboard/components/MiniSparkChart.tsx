import type { TrendPoint } from '../../../services/dashboardService';
import { RoundedBarChart } from './RoundedBarChart';

export function MiniSparkChart({
  points,
  label,
}: {
  points: TrendPoint[];
  label: string;
  color?: string;
}) {
  return <RoundedBarChart points={points} label={label} height={58} compact />;
}
