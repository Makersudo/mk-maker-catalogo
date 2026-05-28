import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStoreUsage, mapMobileProduct, normalizeStoreSlug, resolveMobilePlan } from './contract.js';

test('normalizes a store slug from direct code or public link', () => {
  assert.equal(normalizeStoreSlug('MK MAKER'), 'mk-maker');
  assert.equal(normalizeStoreSlug('https://app.sistemalizecatalogo.com/loja/MK-MAKER?x=1'), 'mk-maker');
});

test('falls back to medium plan for invalid plan codes', () => {
  assert.equal(resolveMobilePlan('master').code, 'master');
  assert.equal(resolveMobilePlan('unknown').code, 'medium');
});

test('builds mobile store usage from product and variant stock', () => {
  const usage = buildStoreUsage({
    products: [
      { stockQuantity: 4, variants: [{ stockQuantity: 2 }, { stockQuantity: 3 }] },
      { stockQuantity: 1, variants: [] },
    ],
    ordersThisMonthCount: 8,
  });

  assert.deepEqual(usage, {
    products: 2,
    ordersThisMonth: 8,
    stockItems: 10,
  });
});

test('maps public catalog product to mobile contract', () => {
  const product = mapMobileProduct({
    id: 'abc',
    title: 'Creatina',
    description: 'Pura',
    price: 89.9,
    categoryName: 'Performance',
    images: ['https://example.com/a.jpg'],
    stockQuantity: 3,
    variants: [
      { id: 'v1', label: '300g', price: 89.9, stockQuantity: 3, isActive: true },
      { id: 'v2', label: '600g', price: 149.9, stockQuantity: 0, isActive: false },
    ],
  });

  assert.equal(product.name, 'Creatina');
  assert.equal(product.category, 'Performance');
  assert.equal(product.variants.length, 1);
});
