import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { mapProduct } from './mapper.js';

describe('product mapper', () => {
  it('maps the product brand label from the database row', () => {
    const product = mapProduct({
      id: 'product-id',
      slug: 'batom-dior',
      title: 'Batom matte',
      description: 'Batom com acabamento matte.',
      price: 149.9,
      category_id: 'category-id',
      subcategory_id: 'subcategory-id',
      brand_label: 'DIOR',
      audience: 'beleza',
      product_type: 'Batons',
      variation: 'Batom matte',
      features: ['acabamento premium'],
      image_prompt: 'Rotulo frontal legivel com o texto exato "DIOR".',
      catalog_status: 'draft',
      is_active: false,
      is_featured: false,
      is_promo: false,
      is_new: false,
      stock_quantity: 0,
      variants_enabled: false,
      product_images: [],
      product_variants: [],
      created_at: '2026-05-30T00:00:00.000Z',
      updated_at: '2026-05-30T00:00:00.000Z',
    });

    assert.equal(product.brandLabel, 'DIOR');
  });
});
