import type { AnalyticsPeriod, AnalyticsRange } from './analyticsTypes.js';

const ANALYTICS_TIMEZONE = 'America/Sao_Paulo';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const maxRangeDays: Record<AnalyticsPeriod, number> = {
  daily: 366,
  weekly: 366 * 5,
  monthly: 366 * 10,
  yearly: 366 * 20,
};

function dateInTimeZone(now: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: ANALYTICS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function parseDate(value: unknown, field: 'inicial' | 'final'): string {
  const normalized = String(value ?? '').trim();
  if (!DATE_PATTERN.test(normalized)) throw new Error(`Data ${field} invalida.`);

  const date = new Date(`${normalized}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== normalized) {
    throw new Error(`Data ${field} invalida.`);
  }
  return normalized;
}

function addDays(date: string, amount: number): string {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
}

function addMonths(date: string, amount: number): string {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(1);
  value.setUTCMonth(value.getUTCMonth() + amount);
  return value.toISOString().slice(0, 10);
}

function addYears(date: string, amount: number): string {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCMonth(0, 1);
  value.setUTCFullYear(value.getUTCFullYear() + amount);
  return value.toISOString().slice(0, 10);
}

function defaultFrom(period: AnalyticsPeriod, to: string): string {
  if (period === 'daily') return addDays(to, -29);
  if (period === 'weekly') return addDays(to, -83);
  if (period === 'monthly') return addMonths(to, -11);
  return addYears(to, -4);
}

function daysBetween(from: string, to: string): number {
  return Math.floor(
    (new Date(`${to}T00:00:00.000Z`).getTime() - new Date(`${from}T00:00:00.000Z`).getTime())
      / (24 * 60 * 60 * 1000)
  );
}

export function parseAnalyticsRange(
  input: { period?: unknown; from?: unknown; to?: unknown; categoryId?: unknown },
  now = new Date()
): AnalyticsRange {
  const period = String(input.period ?? 'daily').trim() as AnalyticsPeriod;
  if (!['daily', 'weekly', 'monthly', 'yearly'].includes(period)) {
    throw new Error('Periodo de analise invalido.');
  }

  const to = input.to ? parseDate(input.to, 'final') : dateInTimeZone(now);
  const from = input.from ? parseDate(input.from, 'inicial') : defaultFrom(period, to);
  const rangeDays = daysBetween(from, to);
  if (rangeDays < 0) throw new Error('Intervalo de datas invalido.');
  if (rangeDays > maxRangeDays[period]) {
    throw new Error(`Intervalo ${period === 'daily' ? 'diario' : period} excede o limite permitido.`);
  }

  const categoryId = input.categoryId ? String(input.categoryId).trim() : null;
  if (categoryId && !UUID_PATTERN.test(categoryId)) throw new Error('Categoria invalida.');

  return { period, from, to, categoryId };
}
