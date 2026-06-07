import type { TrendPoint } from '../../../services/dashboardService';
import { RoundedBarChart } from './RoundedBarChart';

export function DashboardPrimaryChart({
  points,
  comparisonPoints,
  label,
  formatValue,
}: {
  points: TrendPoint[];
  comparisonPoints?: TrendPoint[];
  label: string;
  formatValue?: (value: number) => string;
}) {
  return <RoundedBarChart points={points} comparisonPoints={comparisonPoints} label={label} formatValue={formatValue} />;
}
