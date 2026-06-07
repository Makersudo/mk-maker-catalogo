import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildCatalogMetrics } from './catalogMetrics.js';

describe('buildCatalogMetrics', () => {
  it('aggregates catalog health, quality, inventory, catalog line and sales metrics', () => {
    const metrics = buildCatalogMetrics({
      categories: [
        { id: 'cat-skin', name: 'Pele', slug: 'pele', parent_id: null, is_active: true },
        { id: 'cat-eyes', name: 'Olhos', slug: 'olhos', parent_id: null, is_active: true },
        { id: 'cat-removers', name: 'Removedores', slug: 'removedores', parent_id: 'cat-skin', is_active: true },
        { id: 'cat-empty', name: 'Vazia', slug: 'vazia', parent_id: null, is_active: true },
      ],
      products: [
        {
          id: 'p1',
          title: 'Demaquilante bifasico',
          price: 79.9,
          purchase_cost: 30,
          audience: 'masculino',
          catalog_status: 'live',
          is_active: true,
          is_featured: true,
          is_promo: false,
          is_new: false,
          stock_quantity: 10,
          variants_enabled: false,
          category_id: 'cat-skin',
          subcategory_id: 'cat-removers',
          created_at: '2026-04-23T10:00:00.000Z',
          category: { id: 'cat-skin', name: 'Pele', slug: 'pele' },
          subcategory: { id: 'cat-removers', name: 'Removedores', slug: 'removedores' },
          product_images: [{ id: 'img1', url: 'https://cdn.test/p1.webp' }],
          product_variants: [],
        },
        {
          id: 'p2',
          title: 'Paleta de sombras',
          price: 0,
          purchase_cost: 12,
          audience: 'suplemento',
          catalog_status: 'ready',
          is_active: false,
          is_featured: false,
          is_promo: true,
          is_new: true,
          stock_quantity: 0,
          variants_enabled: false,
          category_id: 'cat-eyes',
          subcategory_id: null,
          created_at: '2026-04-20T10:00:00.000Z',
          category: { id: 'cat-eyes', name: 'Olhos', slug: 'olhos' },
          subcategory: null,
          product_images: [],
          product_variants: [],
        },
        {
          id: 'p3',
          title: 'Gloss labial',
          price: 99.9,
          purchase_cost: 25,
          audience: 'feminino',
          catalog_status: 'draft',
          is_active: true,
          is_featured: false,
          is_promo: false,
          is_new: true,
          stock_quantity: 0,
          variants_enabled: true,
          category_id: null,
          subcategory_id: null,
          created_at: '2026-03-10T10:00:00.000Z',
          category: null,
          subcategory: null,
          product_images: [{ id: 'img3', url: 'https://cdn.test/p3.webp' }],
          product_variants: [
            { id: 'v1', stock_quantity: 1, price: 109.9, is_active: true },
            { id: 'v2', stock_quantity: 0, price: null, is_active: true },
          ],
        },
      ],
      orders: [
        {
          id: 'o1',
          total_amount: 259.7,
          status: 'paid',
          created_at: '2026-04-23T11:00:00.000Z',
          order_items: [
            { product_id: 'p1', quantity: 2, subtotal: 159.8, cost_subtotal: 60 },
            { product_id: 'p3', quantity: 1, subtotal: 99.9, cost_subtotal: 25 },
          ],
          order_status_events: [
            { next_status: 'confirmed', created_at: '2026-04-23T11:10:00.000Z' },
            { next_status: 'ready_for_pickup', created_at: '2026-04-23T11:40:00.000Z' },
            { next_status: 'completed', created_at: '2026-04-23T12:00:00.000Z' },
          ],
        },
        {
          id: 'o2',
          total_amount: 79.9,
          status: 'cancelled',
          created_at: '2026-04-22T11:00:00.000Z',
          order_items: [
            { product_id: 'p1', quantity: 1, subtotal: 79.9, cost_subtotal: 30 },
          ],
          order_status_events: [
            { next_status: 'cancelled', created_at: '2026-04-22T11:20:00.000Z' },
          ],
        },
      ],
    }, { now: new Date('2026-04-23T12:00:00.000Z'), lowStockThreshold: 3 });

    assert.equal(metrics.summary.totalProducts, 3);
    assert.equal(metrics.summary.completionScore, 50);
    assert.equal(metrics.summary.averagePrice, 59.93);
    assert.equal(metrics.summary.priceMin, 0);
    assert.equal(metrics.summary.priceMax, 99.9);
    assert.deepEqual(metrics.statusFunnel, { draft: 1, ready: 1, live: 1 });
    assert.deepEqual(metrics.imageCoverage, { total: 3, withImage: 2, withoutImage: 1, percent: 67 });
    assert.deepEqual(metrics.stockHealth, {
      totalUnits: 11,
      ok: 1,
      low: 1,
      zero: 1,
      variantManaged: 1,
      lowStockThreshold: 3,
    });
    assert.deepEqual(metrics.inventoryValue, {
      purchaseValue: 325,
      saleValue: 908.9,
      estimatedGrossProfit: 583.9,
      estimatedGrossMarginPercent: 64,
      productsWithPurchaseCost: 3,
    });
    assert.equal(metrics.sales.totalRevenue, 259.7);
    assert.equal(metrics.sales.averageTicket, 259.7);
    assert.equal(metrics.sales.unitsSold, 3);
    assert.equal(metrics.sales.validOrders, 1);
    assert.equal(metrics.sales.realizedGrossProfit, 174.7);
    assert.equal(metrics.orderOperations.averageMinutesToConfirmation, 10);
    assert.equal(metrics.orderOperations.averageMinutesToReady, 40);
    assert.equal(metrics.orderOperations.averageMinutesToCompletion, 60);
    assert.equal(metrics.orderOperations.fulfillmentRate, 100);
    assert.equal(metrics.orderOperations.cancellationRate, 50);
    assert.equal(metrics.catalogLines.find((item) => item.key === 'pele')?.unitsSold, 2);
    assert.equal(metrics.catalogLines.find((item) => item.key === 'pele')?.realizedGrossProfit, 99.8);
    assert.equal(metrics.catalogLines.find((item) => item.key === 'olhos')?.withoutPrice, 1);
    assert.deepEqual(metrics.catalogLines.map((item) => item.label), ['Pele', 'Olhos', 'Sem categoria']);
    assert.equal(metrics.quality.withoutImage.count, 1);
    assert.equal(metrics.quality.withoutPrice.count, 1);
    assert.equal(metrics.quality.withoutCategory.count, 1);
    assert.equal(metrics.quality.withoutSubcategory.count, 2);
    assert.equal(metrics.quality.emptyCategories.count, 1);
    assert.equal(metrics.topProductsByRevenue[0].id, 'p1');
    assert.equal(metrics.topProductsByRevenue[0].revenue, 159.8);
    assert.equal(metrics.topProductsByProfit[0].realizedGrossProfit, 99.8);
    assert.equal(metrics.topProductsByRevenue[0].lineLabel, 'Pele');
    assert.equal(metrics.categoryPerformance[0].categoryId, 'cat-skin');
    assert.equal(metrics.categoryPerformance[0].revenue, 159.8);
    assert.equal(metrics.categoryPerformance[0].realizedGrossProfit, 99.8);
    assert.equal(metrics.activity.productsCreatedLast7Days, 2);
    assert.equal(metrics.activity.ordersLast7Days, 1);
    assert.equal(metrics.alerts[0].severity, 'critical');
  });

  it('returns safe zero metrics when the catalog is empty', () => {
    const metrics = buildCatalogMetrics({ products: [], categories: [], orders: [] });

    assert.equal(metrics.summary.totalProducts, 0);
    assert.equal(metrics.summary.completionScore, 0);
    assert.equal(metrics.imageCoverage.percent, 0);
    assert.equal(metrics.sales.averageTicket, 0);
    assert.equal(metrics.alerts.length, 0);
  });
});
