import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

describe('historical dashboard analytics UI', () => {
  it('offers all required periods and real spark chart paths', () => {
    const selector = readFileSync(new URL('./components/PeriodSelector.tsx', import.meta.url), 'utf8');
    const chart = readFileSync(new URL('./components/MiniSparkChart.tsx', import.meta.url), 'utf8');
    const panel = readFileSync(new URL('./components/HistoricalAnalyticsPanel.tsx', import.meta.url), 'utf8');

    for (const label of ['Diario', 'Semanal', 'Mensal', 'Anual']) {
      assert.equal(selector.includes(label), true);
    }
    assert.equal(chart.includes('motion.path'), true);
    assert.equal(chart.includes('useReducedMotion'), true);
    assert.equal(panel.includes('Todas as categorias'), true);
    assert.equal(panel.includes('staggerChildren'), true);
    assert.equal(panel.includes('Produtos cadastrados'), true);
    assert.equal(panel.includes('Saude da vitrine'), true);
  });
});
