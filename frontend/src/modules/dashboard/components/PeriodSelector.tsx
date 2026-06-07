import type { AnalyticsPeriod } from '../../../services/dashboardService';

const options: Array<{ value: AnalyticsPeriod; label: string }> = [
  { value: 'daily', label: 'Diario' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'yearly', label: 'Anual' },
];

export function PeriodSelector({
  value,
  onChange,
}: {
  value: AnalyticsPeriod;
  onChange: (period: AnalyticsPeriod) => void;
}) {
  return (
    <div className="inline-flex w-full sm:w-auto rounded-xl border border-neutral-200 bg-white p-1" aria-label="Periodo da analise">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`flex-1 sm:flex-none rounded-lg px-3 py-2 text-[11px] font-black uppercase transition-colors ${
            value === option.value
              ? 'bg-neutral-950 text-white'
              : 'text-neutral-500 hover:bg-[#F8EEEC] hover:text-[#8D514B]'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
