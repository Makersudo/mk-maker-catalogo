import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type AnalyticsPeriod,
  type DashboardAnalytics,
  getDashboardAnalytics,
} from '../../../services/dashboardService';

const responseCache = new Map<string, DashboardAnalytics>();

export function useDashboardAnalytics() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('daily');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requestVersion, setRequestVersion] = useState(0);
  const activeRequest = useRef(0);

  const retry = useCallback(() => setRequestVersion((value) => value + 1), []);

  useEffect(() => {
    const requestId = activeRequest.current + 1;
    activeRequest.current = requestId;
    const key = `${period}:${categoryId ?? 'all'}`;
    const cached = responseCache.get(key);

    if (cached) {
      setData(cached);
      setLoading(false);
      setError('');
    } else {
      setLoading(true);
    }

    getDashboardAnalytics(period, categoryId)
      .then((response) => {
        if (activeRequest.current !== requestId) return;
        responseCache.set(key, response);
        setData(response);
        setError('');
      })
      .catch((requestError) => {
        if (activeRequest.current !== requestId) return;
        setError(requestError instanceof Error ? requestError.message : 'Nao foi possivel carregar o historico.');
      })
      .finally(() => {
        if (activeRequest.current === requestId) setLoading(false);
      });
  }, [categoryId, period, requestVersion]);

  return {
    period,
    setPeriod,
    categoryId,
    setCategoryId,
    data,
    loading,
    error,
    retry,
  };
}
