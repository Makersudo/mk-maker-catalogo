import { catalogCategorySeeds, masterCatalogProducts } from '../catalog/masterCatalog.js';
import { assertUnique } from './catalogCli.js';

const MAX_ROOT_CATEGORIES = 12;
const MAX_SUBCATEGORIES = 40;
const MAX_PRODUCTS = 250;
const MAX_PRODUCTS_PER_SUBCATEGORY = 6;

function assert(condition: unknown, message: string, errors: string[]) {
  if (!condition) errors.push(message);
}

async function main() {
  const errors: string[] = [];
  const categoryBySlug = new Map(catalogCategorySeeds.map((category) => [category.slug, category]));
  const categorySlugs = new Set(categoryBySlug.keys());
  const rootCategories = catalogCategorySeeds.filter((category) => category.parentSlug === null);
  const subcategories = catalogCategorySeeds.filter((category) => category.parentSlug !== null);

  try {
    assertUnique(catalogCategorySeeds.map((category) => category.slug), 'Categoria');
    assertUnique(masterCatalogProducts.map((product) => product.slug), 'Produto');
  } catch (error: any) {
    errors.push(error.message);
  }

  assert(rootCategories.length <= MAX_ROOT_CATEGORIES, `Catalogo excede ${MAX_ROOT_CATEGORIES} categorias raiz`, errors);
  assert(subcategories.length <= MAX_SUBCATEGORIES, `Catalogo excede ${MAX_SUBCATEGORIES} subcategorias`, errors);
  assert(masterCatalogProducts.length <= MAX_PRODUCTS, `Catalogo excede ${MAX_PRODUCTS} produtos`, errors);

  for (const category of catalogCategorySeeds) {
    if (category.parentSlug) {
      assert(categorySlugs.has(category.parentSlug), `Categoria pai ausente para ${category.slug}: ${category.parentSlug}`, errors);
    }
  }

  for (const product of masterCatalogProducts) {
    assert(categorySlugs.has(product.categorySlug), `Produto ${product.slug} aponta para categoria inexistente: ${product.categorySlug}`, errors);
    assert(categorySlugs.has(product.subcategorySlug), `Produto ${product.slug} aponta para subcategoria inexistente: ${product.subcategorySlug}`, errors);
    assert(categoryBySlug.get(product.categorySlug)?.parentSlug === null, `Produto ${product.slug} deve apontar categoria raiz em categorySlug`, errors);
    assert(categoryBySlug.get(product.subcategorySlug)?.parentSlug === product.categorySlug, `Produto ${product.slug} aponta para subcategoria fora da categoria principal`, errors);
    assert(product.title.trim().length > 2, `Produto ${product.slug} sem titulo valido`, errors);
    assert(product.description.trim().length > 10, `Produto ${product.slug} sem descricao suficiente`, errors);
    assert(product.imagePrompt.trim().length > 40, `Produto ${product.slug} sem prompt de imagem suficiente`, errors);
    assert(product.catalogStatus === 'draft', `Seed ${product.slug} deve iniciar como draft`, errors);
    assert(product.isActive === false, `Seed ${product.slug} deve iniciar como inativo`, errors);
    assert(product.price === 0, `Seed ${product.slug} deve iniciar sem preco real`, errors);
  }

  const subcategoryProductCounts = masterCatalogProducts.reduce<Record<string, number>>((acc, product) => {
    acc[product.subcategorySlug] = (acc[product.subcategorySlug] ?? 0) + 1;
    return acc;
  }, {});

  for (const [subcategorySlug, total] of Object.entries(subcategoryProductCounts)) {
    assert(total <= MAX_PRODUCTS_PER_SUBCATEGORY, `Subcategoria ${subcategorySlug} possui ${total} produtos`, errors);
  }

  if (errors.length > 0) {
    process.stderr.write(`Catalogo inseguro:\n- ${errors.join('\n- ')}\n`);
    process.exit(1);
  }

  const counts = masterCatalogProducts.reduce<Record<string, number>>((acc, product) => {
    acc[product.audience] = (acc[product.audience] ?? 0) + 1;
    return acc;
  }, {});

  process.stdout.write([
    'Catalogo validado com travas seguras.',
    `Categorias raiz: ${rootCategories.length}/${MAX_ROOT_CATEGORIES}`,
    `Subcategorias: ${subcategories.length}/${MAX_SUBCATEGORIES}`,
    `Categorias totais: ${catalogCategorySeeds.length}`,
    `Produtos: ${masterCatalogProducts.length}`,
    `Feminino: ${counts.feminino ?? 0}`,
    `Masculino: ${counts.masculino ?? 0}`,
    `Suplementos: ${counts.suplemento ?? 0}`,
  ].join('\n'));
  process.stdout.write('\n');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
