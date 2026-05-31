import { createClient } from '@supabase/supabase-js';
import { catalogCategorySeeds, masterCatalogProducts } from '../catalog/masterCatalog.js';
import { env, assertSupabaseConfigured } from '../config/env.js';

function log(message: string) {
  process.stdout.write(`${message}\n`);
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const roots = catalogCategorySeeds.filter((category) => category.parentSlug === null);
  const children = catalogCategorySeeds.filter((category) => category.parentSlug !== null);

  if (dryRun) {
    log(`Dry run: ${catalogCategorySeeds.length} categorias e ${masterCatalogProducts.length} produtos preparados.`);
    return;
  }

  assertSupabaseConfigured();

  const supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { error: rootError } = await supabase
    .from('categories')
    .upsert(
      roots.map((category) => ({
        slug: category.slug,
        name: category.name,
        parent_id: null,
        sort_order: category.sortOrder,
        is_active: true,
      })),
      { onConflict: 'slug' }
    );

  if (rootError) throw rootError;

  const { data: rootRows, error: rootRowsError } = await supabase
    .from('categories')
    .select('id, slug')
    .in('slug', roots.map((category) => category.slug));

  if (rootRowsError) throw rootRowsError;

  const rootIdBySlug = new Map((rootRows ?? []).map((row) => [row.slug, row.id]));

  const childRows = children.map((category) => {
    const parentId = rootIdBySlug.get(category.parentSlug!);
    if (!parentId) throw new Error(`Categoria pai ausente: ${category.parentSlug}`);

    return {
      slug: category.slug,
      name: category.name,
      parent_id: parentId,
      sort_order: category.sortOrder,
      is_active: true,
    };
  });

  const { error: childError } = await supabase
    .from('categories')
    .upsert(childRows, { onConflict: 'slug' });

  if (childError) throw childError;

  const allCategorySlugs = catalogCategorySeeds.map((category) => category.slug);
  const { data: categoryRows, error: categoryRowsError } = await supabase
    .from('categories')
    .select('id, slug')
    .in('slug', allCategorySlugs);

  if (categoryRowsError) throw categoryRowsError;

  const categoryIdBySlug = new Map((categoryRows ?? []).map((row) => [row.slug, row.id]));

  const productRows = masterCatalogProducts.map((product) => {
    const categoryId = categoryIdBySlug.get(product.categorySlug);
    const subcategoryId = categoryIdBySlug.get(product.subcategorySlug);

    if (!categoryId) throw new Error(`Categoria principal ausente: ${product.categorySlug}`);
    if (!subcategoryId) throw new Error(`Subcategoria ausente: ${product.subcategorySlug}`);

    return {
      slug: product.slug,
      title: product.title,
      description: product.description,
      price: product.price,
      category_id: categoryId,
      subcategory_id: subcategoryId,
      audience: product.audience,
      brand_label: product.brandLabel,
      product_type: product.productType,
      variation: product.variation,
      features: product.features,
      image_prompt: product.imagePrompt,
      catalog_status: product.catalogStatus,
      is_active: product.isActive,
      is_featured: product.isFeatured,
      is_promo: product.isPromo,
      is_new: product.isNew,
      stock_quantity: product.stockQuantity,
    };
  });

  const { error: productsError } = await supabase
    .from('products')
    .upsert(productRows, { onConflict: 'slug' });

  if (productsError) throw productsError;

  log(`Importacao concluida: ${catalogCategorySeeds.length} categorias e ${masterCatalogProducts.length} produtos sincronizados.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
