import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ApiError } from '../../lib/http.js';
import { parseBulkStockPayload } from './bulkStock.js';
import { parseProductPayload } from './routes.js';

describe('parseBulkStockPayload', () => {
  it('accepts explicit product ids and a non-negative integer stock quantity', () => {
    const payload = parseBulkStockPayload({
      productIds: ['prod-1', 'prod-2'],
      stockQuantity: 12,
    });

    assert.deepEqual(payload, {
      productIds: ['prod-1', 'prod-2'],
      stockQuantity: 12,
    });
  });

  it('rejects when no product ids are provided', () => {
    assert.throws(
      () => parseBulkStockPayload({ productIds: [], stockQuantity: 5 }),
      (error) => error instanceof ApiError && error.status === 400 && error.message === 'Selecione ao menos um produto.'
    );
  });

  it('rejects negative or fractional stock quantities', () => {
    assert.throws(
      () => parseBulkStockPayload({ productIds: ['prod-1'], stockQuantity: -1 }),
      (error) => error instanceof ApiError && error.status === 400 && error.message === 'Quantidade de estoque invalida.'
    );

    assert.throws(
      () => parseBulkStockPayload({ productIds: ['prod-1'], stockQuantity: 1.5 }),
      (error) => error instanceof ApiError && error.status === 400 && error.message === 'Quantidade de estoque invalida.'
    );
  });
});

describe('parseProductPayload', () => {
  it('creates new products as inactive drafts unless explicitly published', () => {
    const payload = parseProductPayload({
      title: 'Produto',
      price: 10,
      purchaseCost: 4.5,
      categoryId: 'category-id',
    });

    assert.equal(payload.catalogStatus, 'draft');
    assert.equal(payload.isActive, false);
    assert.equal(payload.purchaseCost, 4.5);
  });

  it('defaults purchase cost to zero for old product payloads', () => {
    const payload = parseProductPayload({
      title: 'Produto',
      price: 10,
      categoryId: 'category-id',
    });

    assert.equal(payload.purchaseCost, 0);
  });
});
