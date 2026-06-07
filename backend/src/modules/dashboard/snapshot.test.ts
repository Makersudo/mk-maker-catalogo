import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildSnapshotRows, captureDailySnapshot } from './snapshot.js';

const categories = [
  { id: 'category-1', name: 'Pele', slug: 'pele', parent_id: null, is_active: true },
  { id: 'subcategory-1', name: 'Bases', slug: 'bases', parent_id: 'category-1', is_active: true },
];

const products = [
  {
    id: 'product-1',
    title: 'Base',
    price: 50,
    purchase_cost: 20,
    catalog_status: 'live',
    is_active: true,
    is_featured: true,
    is_promo: false,
    is_new: true,
    stock_quantity: 10,
    variants_enabled: false,
    category_id: 'category-1',
    subcategory_id: 'subcategory-1',
    product_images: [{ id: 'image-1', url: 'https://example.test/base.png' }],
    product_variants: [],
  },
  {
    id: 'product-2',
    title: 'Primer',
    price: 30,
    purchase_cost: 10,
    catalog_status: 'ready',
    is_active: true,
    is_featured: false,
    is_promo: true,
    is_new: false,
    stock_quantity: 2,
    variants_enabled: false,
    category_id: 'category-1',
    subcategory_id: 'subcategory-1',
    product_images: [],
    product_variants: [],
  },
];

describe('dashboard snapshots', () => {
  it('builds global and category daily snapshots from current catalog state', () => {
    const rows = buildSnapshotRows({
      snapshotDate: '2026-06-06',
      products,
      categories,
    });

    assert.equal(rows.global.total_products, 2);
    assert.equal(rows.global.live_products, 1);
    assert.equal(rows.global.products_with_image, 1);
    assert.equal(rows.global.stock_total_units, 12);
    assert.equal(rows.global.low_stock_products, 1);
    assert.equal(rows.global.inventory_purchase_value, 220);
    assert.equal(rows.global.inventory_sale_value, 560);
    assert.equal(rows.global.estimated_gross_profit, 340);
    assert.equal(rows.categories.length, 1);
    assert.equal(rows.categories[0].category_name, 'Pele');
    assert.equal(rows.categories[0].stock_total_units, 12);
  });

  it('upserts the same snapshot date for safe retries', async () => {
    const calls: Array<{ table: string; rows: unknown; options: unknown }> = [];
    const supabase = {
      from(table: string) {
        if (table === 'products') {
          return { select: async () => ({ data: products, error: null }) };
        }
        if (table === 'categories') {
          return { select: async () => ({ data: categories, error: null }) };
        }
        return {
          upsert: async (rows: unknown, options: unknown) => {
            calls.push({ table, rows, options });
            return { error: null };
          },
        };
      },
    };

    await captureDailySnapshot(supabase, '2026-06-06');
    await captureDailySnapshot(supabase, '2026-06-06');

    assert.equal(calls.length, 4);
    assert.deepEqual(calls[0].options, { onConflict: 'snapshot_date' });
    assert.deepEqual(calls[1].options, { onConflict: 'snapshot_date,category_id' });
  });
});
