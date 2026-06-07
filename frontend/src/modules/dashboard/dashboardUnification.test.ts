import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

describe('unified dashboard workspace', () => {
  it('uses one overview request and one linked analytics workspace', () => {
    const view = readFileSync(new URL('./views/DashboardView.tsx', import.meta.url), 'utf8');
    const service = readFileSync(new URL('../../services/dashboardService.ts', import.meta.url), 'utf8');
    const workspace = readFileSync(new URL('./components/DashboardAnalyticsWorkspace.tsx', import.meta.url), 'utf8');
    const chart = readFileSync(new URL('./components/DashboardPrimaryChart.tsx', import.meta.url), 'utf8');
    const bars = readFileSync(new URL('./components/RoundedBarChart.tsx', import.meta.url), 'utf8');
    const insights = readFileSync(new URL('./components/DashboardInsightsPanel.tsx', import.meta.url), 'utf8');

    assert.equal(view.includes('DashboardAnalyticsWorkspace'), true);
    assert.equal(view.includes('HistoricalAnalyticsPanel'), false);
    assert.equal(view.includes('CatalogMetricsModule'), false);
    assert.equal(view.includes('Visao executiva'), false);
    assert.equal(view.includes('Dashboard da MK Maker'), false);
    assert.equal(service.includes('/api/dashboard/overview'), true);
    assert.equal(workspace.includes('PeriodSelector'), true);
    assert.equal(workspace.includes('AnimatedCounter'), true);
    assert.equal(workspace.includes('staggerChildren'), true);
    assert.equal(workspace.includes('metricOptions'), true);
    assert.equal(workspace.includes('comparisonPoints'), true);
    assert.equal(workspace.includes('Exportar CSV'), true);
    assert.equal(workspace.includes('Atualizado'), true);
    assert.equal(chart.includes('RoundedBarChart'), true);
    assert.equal(bars.includes('motion.rect'), true);
    assert.equal(bars.includes('rx='), true);
    assert.equal(bars.includes('highlightMax'), true);
    assert.equal(insights.includes('Vendas'), true);
    assert.equal(insights.includes('Estoque'), true);
    assert.equal(insights.includes('Categorias'), true);
    assert.equal(insights.includes('Qualidade'), true);
  });
});
