import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { mapProduct, mapPublicProduct } from './mapper.js';

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

  it('removes operational and commercial fields from public products', () => {
    const product = mapPublicProduct({
      ...mapProduct({
        id: 'product-id',
        slug: 'batom-dior',
        title: 'Batom matte',
        description: 'Batom com acabamento matte.',
        price: 149.9,
        purchase_cost: 45,
        category_id: 'category-id',
        subcategory_id: 'subcategory-id',
        brand_label: 'DIOR',
        image_prompt: 'Prompt interno.',
        catalog_status: 'live',
        is_active: true,
        is_featured: true,
        is_promo: false,
        is_new: false,
        stock_quantity: 8,
        variants_enabled: false,
        product_images: [],
        product_variants: [],
        created_at: '2026-05-30T00:00:00.000Z',
        updated_at: '2026-05-30T01:00:00.000Z',
      }),
      relevanceScore: 12,
      relevanceUnitsSold: 5,
      relevanceOrderCount: 3,
    });

    assert.equal(product.relevanceScore, 12);
    assert.equal('purchaseCost' in product, false);
    assert.equal('imagePrompt' in product, false);
    assert.equal('catalogStatus' in product, false);
    assert.equal('updated_at' in product, false);
    assert.equal('relevanceUnitsSold' in product, false);
    assert.equal('relevanceOrderCount' in product, false);
  });
});
