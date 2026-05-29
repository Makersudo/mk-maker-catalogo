import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { catalogCategorySeeds, masterCatalogProducts } from './masterCatalog.js';

const expectedRootCategories = [
  'Pele',
  'Olhos',
  'Sobrancelhas',
  'Boca',
  'Pinceis e Esponjas',
  'Acessorios de Maquiagem',
  'Fixacao e Finalizacao',
  'Maquiagem Artistica',
  'Maquiagem Infantil',
  'Demaquilantes e Limpeza',
  'Kits e Combos',
  'Unhas',
];

describe('MK Maker master catalog', () => {
  it('keeps the planned category, subcategory and product limits', () => {
    const rootCategories = catalogCategorySeeds.filter((category) => category.parentSlug === null);
    const subcategories = catalogCategorySeeds.filter((category) => category.parentSlug !== null);

    assert.deepEqual(rootCategories.map((category) => category.name), expectedRootCategories);
    assert.equal(rootCategories.length, 12);
    assert.equal(subcategories.length, 38);
    assert.ok(subcategories.length <= 40);
    assert.equal(masterCatalogProducts.length, 228);
    assert.ok(masterCatalogProducts.length <= 250);
  });

  it('links every product to a valid subcategory with at most six products each', () => {
    const categoryBySlug = new Map(catalogCategorySeeds.map((category) => [category.slug, category]));
    const categorySlugs = new Set(categoryBySlug.keys());
    const subcategorySlugs = new Set(
      catalogCategorySeeds
        .filter((category) => category.parentSlug !== null)
        .map((category) => category.slug),
    );
    const productsBySubcategory = new Map<string, number>();

    for (const product of masterCatalogProducts) {
      assert.ok(categorySlugs.has(product.categorySlug), `${product.slug} has invalid category`);
      assert.ok(subcategorySlugs.has(product.subcategorySlug), `${product.slug} has invalid subcategory`);
      assert.equal(categoryBySlug.get(product.categorySlug)?.parentSlug, null);
      assert.equal(categoryBySlug.get(product.subcategorySlug)?.parentSlug, product.categorySlug);
      assert.equal(product.catalogStatus, 'draft');
      assert.equal(product.isActive, false);
      assert.equal(product.price, 0);

      productsBySubcategory.set(
        product.subcategorySlug,
        (productsBySubcategory.get(product.subcategorySlug) ?? 0) + 1,
      );
    }

    for (const [subcategorySlug, total] of productsBySubcategory) {
      assert.ok(total <= 6, `${subcategorySlug} has ${total} products`);
    }
  });
});
