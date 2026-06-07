import type {
  AnalyticsPeriod,
  AnalyticsRange,
  DashboardAnalyticsResponse,
  TrendPoint,
} from './analyticsTypes.js';
import type {
  AnalyticsRepository,
  ProductCreationAnalyticsRow,
  SalesAnalyticsRow,
  SnapshotAnalyticsRow,
} from './analyticsRepository.js';

const TIMEZONE = 'America/Sao_Paulo' as const;
const CACHE_TTL_MS = 120_000;
const CACHE_MAX_ENTRIES = 32;
const analyticsCache = new Map<string, { expiresAt: number; data: DashboardAnalyticsResponse }>();

function dateValue(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function dateString(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function addDays(value: string, amount: number): string {
  const date = dateValue(value);
  date.setUTCDate(date.getUTCDate() + amount);
  return dateString(date);
}

function bucketStart(value: string, period: AnalyticsPeriod): string {
  const date = dateValue(value);
  if (period === 'weekly') {
    const day = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() - day + 1);
  } else if (period === 'monthly') {
    date.setUTCDate(1);
  } else if (period === 'yearly') {
    date.setUTCMonth(0, 1);
  }
  return dateString(date);
}

function nextBucket(value: string, period: AnalyticsPeriod): string {
  const date = dateValue(value);
  if (period === 'daily') date.setUTCDate(date.getUTCDate() + 1);
  if (period === 'weekly') date.setUTCDate(date.getUTCDate() + 7);
  if (period === 'monthly') date.setUTCMonth(date.getUTCMonth() + 1);
  if (period === 'yearly') date.setUTCFullYear(date.getUTCFullYear() + 1);
  return dateString(date);
}

function buckets(range: AnalyticsRange): string[] {
  const result: string[] = [];
  const last = bucketStart(range.to, range.period);
  for (let current = bucketStart(range.from, range.period); current <= last; current = nextBucket(current, range.period)) {
    result.push(current);
  }
  return result;
}

function labelFor(bucket: string, period: AnalyticsPeriod): string {
  const date = dateValue(bucket);
  if (period === 'yearly') return String(date.getUTCFullYear());
  if (period === 'monthly') {
    return new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit', timeZone: 'UTC' }).format(date);
  }
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' }).format(date);
}

function numberValue(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function seriesFromRows<T extends { bucket_start: string }>(
  bucketList: string[],
  period: AnalyticsPeriod,
  rows: T[],
  field: keyof T
): TrendPoint[] {
  const values = new Map(rows.map((row) => [row.bucket_start, numberValue(row[field])]));
  return bucketList.map((bucket) => ({
    bucket,
    label: labelFor(bucket, period),
    value: values.get(bucket) ?? 0,
  }));
}

function pointInTimeSeries<T extends { bucket_start: string }>(
  bucketList: string[],
  period: AnalyticsPeriod,
  rows: T[],
  field: keyof T
): TrendPoint[] {
  const ordered = [...rows].sort((a, b) => a.bucket_start.localeCompare(b.bucket_start));
  let index = 0;
  let last = 0;
  return bucketList.map((bucket) => {
    while (index < ordered.length && ordered[index].bucket_start <= bucket) {
      last = numberValue(ordered[index][field]);
      index += 1;
    }
    return { bucket, label: labelFor(bucket, period), value: last };
  });
}

function sum(rows: Array<Record<string, unknown>>, field: string): number {
  return rows.reduce((total, row) => total + numberValue(row[field]), 0);
}

function last(rows: Array<Record<string, unknown>>, field: string): number {
  const ordered = [...rows].sort((a, b) => String(a.bucket_start).localeCompare(String(b.bucket_start)));
  return ordered.length ? numberValue(ordered.at(-1)?.[field]) : 0;
}

function comparison(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / Math.abs(previous)) * 1000) / 10;
}

function previousRange(range: AnalyticsRange): AnalyticsRange {
  const days = Math.floor((dateValue(range.to).getTime() - dateValue(range.from).getTime()) / 86_400_000) + 1;
  const to = addDays(range.from, -1);
  return { ...range, from: addDays(to, -(days - 1)), to };
}

export async function buildDashboardAnalytics(
  range: AnalyticsRange,
  repository: AnalyticsRepository
): Promise<DashboardAnalyticsResponse> {
  const previous = previousRange(range);
  const [sales, snapshots, created, previousSales, previousSnapshots, previousCreated] = await Promise.all([
    repository.loadSales(range),
    repository.loadSnapshots(range),
    repository.loadProductsCreated(range),
    repository.loadSales(previous),
    repository.loadSnapshots(previous),
    repository.loadProductsCreated(previous),
  ]);
  const bucketList = buckets(range);
  const currentRevenue = sum(sales as unknown as Array<Record<string, unknown>>, 'revenue');
  const currentOrders = sum(sales as unknown as Array<Record<string, unknown>>, 'orders');
  const previousRevenue = sum(previousSales as unknown as Array<Record<string, unknown>>, 'revenue');
  const previousOrders = sum(previousSales as unknown as Array<Record<string, unknown>>, 'orders');

  return {
    period: range.period,
    timezone: TIMEZONE,
    range: { from: range.from, to: range.to },
    categoryId: range.categoryId,
    series: {
      revenue: seriesFromRows(bucketList, range.period, sales, 'revenue'),
      orders: seriesFromRows(bucketList, range.period, sales, 'orders'),
      unitsSold: seriesFromRows(bucketList, range.period, sales, 'units_sold'),
      averageTicket: seriesFromRows(bucketList, range.period, sales, 'average_ticket'),
      productsCreated: seriesFromRows(bucketList, range.period, created, 'products_created'),
      stockUnits: pointInTimeSeries(bucketList, range.period, snapshots, 'stock_units'),
      inventoryPurchaseValue: pointInTimeSeries(bucketList, range.period, snapshots, 'inventory_purchase_value'),
      inventorySaleValue: pointInTimeSeries(bucketList, range.period, snapshots, 'inventory_sale_value'),
      estimatedGrossProfit: pointInTimeSeries(bucketList, range.period, snapshots, 'estimated_gross_profit'),
      realizedGrossProfit: seriesFromRows(bucketList, range.period, sales, 'realized_gross_profit'),
      completionScore: pointInTimeSeries(bucketList, range.period, snapshots, 'completion_score'),
    },
    comparison: {
      revenuePercent: comparison(currentRevenue, previousRevenue),
      ordersPercent: comparison(currentOrders, previousOrders),
      unitsSoldPercent: comparison(
        sum(sales as unknown as Array<Record<string, unknown>>, 'units_sold'),
        sum(previousSales as unknown as Array<Record<string, unknown>>, 'units_sold')
      ),
      averageTicketPercent: comparison(
        currentOrders ? currentRevenue / currentOrders : 0,
        previousOrders ? previousRevenue / previousOrders : 0
      ),
      productsCreatedPercent: comparison(
        sum(created as unknown as Array<Record<string, unknown>>, 'products_created'),
        sum(previousCreated as unknown as Array<Record<string, unknown>>, 'products_created')
      ),
      stockUnitsPercent: comparison(
        last(snapshots as unknown as Array<Record<string, unknown>>, 'stock_units'),
        last(previousSnapshots as unknown as Array<Record<string, unknown>>, 'stock_units')
      ),
      inventoryPurchaseValuePercent: comparison(
        last(snapshots as unknown as Array<Record<string, unknown>>, 'inventory_purchase_value'),
        last(previousSnapshots as unknown as Array<Record<string, unknown>>, 'inventory_purchase_value')
      ),
      inventorySaleValuePercent: comparison(
        last(snapshots as unknown as Array<Record<string, unknown>>, 'inventory_sale_value'),
        last(previousSnapshots as unknown as Array<Record<string, unknown>>, 'inventory_sale_value')
      ),
      estimatedGrossProfitPercent: comparison(
        last(snapshots as unknown as Array<Record<string, unknown>>, 'estimated_gross_profit'),
        last(previousSnapshots as unknown as Array<Record<string, unknown>>, 'estimated_gross_profit')
      ),
      realizedGrossProfitPercent: comparison(
        sum(sales as unknown as Array<Record<string, unknown>>, 'realized_gross_profit'),
        sum(previousSales as unknown as Array<Record<string, unknown>>, 'realized_gross_profit')
      ),
      completionScorePercent: comparison(
        last(snapshots as unknown as Array<Record<string, unknown>>, 'completion_score'),
        last(previousSnapshots as unknown as Array<Record<string, unknown>>, 'completion_score')
      ),
    },
  };
}

export function clearDashboardAnalyticsCache() {
  analyticsCache.clear();
}

export async function getCachedDashboardAnalytics(
  range: AnalyticsRange,
  repository: AnalyticsRepository
): Promise<DashboardAnalyticsResponse> {
  const key = `${range.period}:${range.from}:${range.to}:${range.categoryId ?? 'all'}`;
  const cached = analyticsCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  const data = await buildDashboardAnalytics(range, repository);
  if (analyticsCache.size >= CACHE_MAX_ENTRIES) {
    const oldest = analyticsCache.keys().next().value;
    if (oldest) analyticsCache.delete(oldest);
  }
  analyticsCache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, data });
  return data;
}
