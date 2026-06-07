import { AlertCircle } from 'lucide-react';
import { DashboardAnalyticsWorkspace } from '../components/DashboardAnalyticsWorkspace';
import { useDashboardOverview } from '../hooks/useDashboardOverview';

export function DashboardView() {
  const overview = useDashboardOverview();
  const inactiveProducts = overview.data?.current.inactiveProducts ?? 0;

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-4 pb-6 md:gap-6">
      {inactiveProducts > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-800 md:items-center">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 md:mt-0" />
          <p className="text-xs font-medium md:text-sm">
            Existem <strong>{inactiveProducts} produtos inativos</strong> fora do catalogo publico.
          </p>
        </div>
      )}

      <DashboardAnalyticsWorkspace overview={overview} />
    </div>
  );
}
