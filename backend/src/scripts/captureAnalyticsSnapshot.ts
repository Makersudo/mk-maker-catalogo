import { getSupabaseAdmin } from '../lib/supabase.js';
import { parseAnalyticsRange } from '../modules/dashboard/analyticsPeriod.js';
import { captureDailySnapshot } from '../modules/dashboard/snapshot.js';

function requestedDate(): string {
  const argument = process.argv.find((value) => value.startsWith('--date='));
  const value = argument?.slice('--date='.length);
  if (value) return parseAnalyticsRange({ period: 'daily', from: value, to: value }).from;
  return parseAnalyticsRange({ period: 'daily' }).to;
}

async function main() {
  const snapshotDate = requestedDate();
  const result = await captureDailySnapshot(getSupabaseAdmin(), snapshotDate);
  console.log(JSON.stringify({
    status: 'ok',
    snapshotDate,
    totalProducts: result.global.total_products,
    categorySnapshots: result.categories.length,
  }));
}

main().catch((error) => {
  console.error('Falha ao capturar snapshot analitico.', error);
  process.exitCode = 1;
});
