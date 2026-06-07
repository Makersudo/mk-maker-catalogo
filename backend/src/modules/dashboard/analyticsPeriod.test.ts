import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseAnalyticsRange } from './analyticsPeriod.js';

describe('parseAnalyticsRange', () => {
  const now = new Date('2026-06-06T15:00:00.000Z');

  it('creates the default daily range with thirty calendar days', () => {
    const range = parseAnalyticsRange({ period: 'daily' }, now);

    assert.deepEqual(range, {
      period: 'daily',
      from: '2026-05-08',
      to: '2026-06-06',
      categoryId: null,
    });
  });

  it('accepts explicit monthly range and category filter', () => {
    const range = parseAnalyticsRange({
      period: 'monthly',
      from: '2025-07-01',
      to: '2026-06-30',
      categoryId: '1f5c9485-d7bb-4e62-8d30-458cfd91ce6c',
    }, now);

    assert.equal(range.period, 'monthly');
    assert.equal(range.from, '2025-07-01');
    assert.equal(range.to, '2026-06-30');
    assert.equal(range.categoryId, '1f5c9485-d7bb-4e62-8d30-458cfd91ce6c');
  });

  it('rejects unsupported periods, invalid dates, inverted ranges, and excessive ranges', () => {
    assert.throws(() => parseAnalyticsRange({ period: 'hourly' }, now), /Periodo de analise invalido/);
    assert.throws(() => parseAnalyticsRange({ period: 'daily', from: '2026-02-30', to: '2026-03-01' }, now), /Data inicial invalida/);
    assert.throws(() => parseAnalyticsRange({ period: 'daily', from: '2026-06-07', to: '2026-06-01' }, now), /Intervalo de datas invalido/);
    assert.throws(() => parseAnalyticsRange({ period: 'daily', from: '2020-01-01', to: '2026-06-01' }, now), /Intervalo diario excede/);
  });

  it('rejects malformed category ids', () => {
    assert.throws(
      () => parseAnalyticsRange({ period: 'weekly', categoryId: 'pele' }, now),
      /Categoria invalida/
    );
  });
});
