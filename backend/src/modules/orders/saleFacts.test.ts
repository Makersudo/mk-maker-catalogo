import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildOrderItemSaleFacts, publicOrderItem } from './saleFacts.js';

describe('buildOrderItemSaleFacts', () => {
  it('preserves purchase cost and catalog dimensions at sale time', () => {
    const facts = buildOrderItemSaleFacts({
      product: {
        purchase_cost: '18.50',
        category_id: 'category-1',
        category: { name: 'Pele' },
        subcategory_id: 'subcategory-1',
        subcategory: { name: 'Bases' },
      },
      quantity: 3,
    });

    assert.deepEqual(facts, {
      unit_purchase_cost: 18.5,
      cost_subtotal: 55.5,
      category_id: 'category-1',
      category_name: 'Pele',
      subcategory_id: 'subcategory-1',
      subcategory_name: 'Bases',
    });
  });

  it('normalizes missing or invalid purchase cost to zero', () => {
    const facts = buildOrderItemSaleFacts({
      product: {
        purchase_cost: null,
        category_id: null,
        category: null,
        subcategory_id: null,
        subcategory: null,
      },
      quantity: 2,
    });

    assert.equal(facts.unit_purchase_cost, 0);
    assert.equal(facts.cost_subtotal, 0);
    assert.equal(facts.category_id, null);
    assert.equal(facts.subcategory_name, null);
  });

  it('removes internal cost and historical dimension fields from public checkout items', () => {
    const item = publicOrderItem({
      id: 'item-1',
      product_name: 'Base',
      unit_price: 49.9,
      quantity: 2,
      subtotal: 99.8,
      unit_purchase_cost: 15,
      cost_subtotal: 30,
      category_id: 'category-1',
      category_name: 'Pele',
      subcategory_id: 'subcategory-1',
      subcategory_name: 'Bases',
    });

    assert.deepEqual(item, {
      id: 'item-1',
      product_name: 'Base',
      unit_price: 49.9,
      quantity: 2,
      subtotal: 99.8,
    });
  });
});
