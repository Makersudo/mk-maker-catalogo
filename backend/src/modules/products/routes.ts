import { Router } from 'express';
import { getSupabaseAdmin } from '../../lib/supabase.js';
import { ApiError, handleError, ok, optionalString, requireNumber, requireString } from '../../lib/http.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { invalidatePublicCatalogCache, loadPublicCatalogSnapshot } from '../catalog/service.js';
import { assertPublicCatalogQuery } from '../catalog/publicQueryGuard.js';
import { assertCatalogResourceLimit } from '../catalogConfig/service.js';
import { parseBulkStockPayload } from './bulkStock.js';
import { mapProduct, type ProductPayload } from './mapper.js';
import { productSelect } from './select.js';
import { parseProductVariants } from './variants.js';
import { saveProductImages, saveProductVariants } from './childCollections.js';

export const productRouter = Router();

export function parseProductPayload(body: any): ProductPayload {
  const rawSubcategoryId = body.subcategoryId ?? body.subcategory_id;
  const rawAudience = body.audience;
  const audience = rawAudience === 'feminino' || rawAudience === 'masculino' || rawAudience === 'suplemento'
    ? rawAudience
    : null;
  const rawCatalogStatus = body.catalogStatus ?? body.catalog_status;
  const catalogStatus = rawCatalogStatus === 'draft' || rawCatalogStatus === 'ready' || rawCatalogStatus === 'live'
    ? rawCatalogStatus
    : 'draft';

  return {
    slug: typeof body.slug === 'string' && body.slug.trim() ? body.slug.trim() : undefined,
    title: requireString(body.title, 'title'),
    description: optionalString(body.description),
    price: requireNumber(body.price, 'price'),
    categoryId: requireString(body.categoryId ?? body.category_id, 'categoryId'),
    subcategoryId: typeof rawSubcategoryId === 'string' && rawSubcategoryId.trim() ? rawSubcategoryId : null,
    audience,
    brandLabel: optionalString(body.brandLabel ?? body.brand_label),
    productType: optionalString(body.productType ?? body.product_type),
    variation: optionalString(body.variation) || null,
    features: Array.isArray(body.features) ? body.features.filter((item: unknown) => typeof item === 'string').map((item: string) => item.trim()).filter(Boolean) : [],
    imagePrompt: optionalString(body.imagePrompt ?? body.image_prompt),
    catalogStatus,
    images: Array.isArray(body.images) ? body.images.filter((item: unknown) => typeof item === 'string') : [],
    isActive: body.isActive ?? body.is_active ?? catalogStatus === 'live',
    isFeatured: body.isFeatured ?? body.is_featured ?? false,
    isPromo: body.isPromo ?? body.is_promo ?? false,
    isNew: body.isNew ?? body.is_new ?? false,
    stockQuantity: Number(body.stockQuantity ?? body.stock_quantity ?? 0),
    variantsEnabled: Boolean(body.variantsEnabled ?? body.variants_enabled ?? false),
    variants: parseProductVariants(body.variants),
  };
}

async function validateCategoryTree(categoryId: string, subcategoryId?: string | null) {
  const supabase = getSupabaseAdmin();
  const { data: category, error: categoryError } = await supabase
    .from('categories')
    .select('id,parent_id,is_active')
    .eq('id', categoryId)
    .single();

  if (categoryError || !category) throw new ApiError(400, 'Categoria principal invalida.');
  if (category.parent_id) throw new ApiError(400, 'Selecione uma categoria principal valida.');

  if (!subcategoryId) return;

  const { data: subcategory, error: subcategoryError } = await supabase
    .from('categories')
    .select('id,parent_id,is_active')
    .eq('id', subcategoryId)
    .single();

  if (subcategoryError || !subcategory) throw new ApiError(400, 'Subcategoria invalida.');
  if (subcategory.parent_id !== categoryId) throw new ApiError(400, 'Subcategoria nao pertence a categoria principal selecionada.');
}

productRouter.get('/', async (req, res) => {
  try {
    assertPublicCatalogQuery(req.query);
    res.set('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=1800');
    const snapshot = await loadPublicCatalogSnapshot();
    return ok(res, snapshot.products);
  } catch (error) {
    return handleError(res, error);
  }
});

productRouter.get('/admin', requireAuth, async (_req, res) => {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from('products')
      .select(productSelect())
      .order('created_at', { ascending: false });

    if (error) throw error;
    return ok(res, (data ?? []).map(mapProduct));
  } catch (error) {
    return handleError(res, error);
  }
});

productRouter.post('/', requireAuth, async (req, res) => {
  try {
    const payload = parseProductPayload(req.body);
    await validateCategoryTree(payload.categoryId, payload.subcategoryId);
    const supabase = getSupabaseAdmin();
    await assertCatalogResourceLimit(supabase, 'products');
    const { data, error } = await supabase
      .from('products')
      .insert({
        slug: payload.slug ?? null,
        title: payload.title,
        description: payload.description,
        price: payload.price,
        category_id: payload.categoryId,
        subcategory_id: payload.subcategoryId,
        audience: payload.audience,
        brand_label: payload.brandLabel ?? '',
        product_type: payload.productType,
        variation: payload.variation,
        features: payload.features ?? [],
        image_prompt: payload.imagePrompt ?? '',
        catalog_status: payload.catalogStatus ?? 'draft',
        is_active: payload.isActive,
        is_featured: payload.isFeatured,
        is_promo: payload.isPromo,
        is_new: payload.isNew,
        stock_quantity: payload.stockQuantity ?? 0,
        variants_enabled: payload.variantsEnabled ?? false,
      })
      .select('*')
      .single();

    if (error) throw error;
    await saveProductImages(supabase, data.id, payload.images, payload.title);
    await saveProductVariants(supabase, data.id, payload.variants ?? []);

    const { data: created, error: fetchError } = await getSupabaseAdmin().from('products').select(productSelect()).eq('id', data.id).single();
    if (fetchError) throw fetchError;

    invalidatePublicCatalogCache();
    return ok(res, mapProduct(created), 201);
  } catch (error) {
    return handleError(res, error);
  }
});

productRouter.put('/:id', requireAuth, async (req, res) => {
  try {
    const payload = parseProductPayload(req.body);
    await validateCategoryTree(payload.categoryId, payload.subcategoryId);
    const { data, error } = await getSupabaseAdmin()
      .from('products')
      .update({
        slug: payload.slug ?? null,
        title: payload.title,
        description: payload.description,
        price: payload.price,
        category_id: payload.categoryId,
        subcategory_id: payload.subcategoryId,
        audience: payload.audience,
        brand_label: payload.brandLabel ?? '',
        product_type: payload.productType,
        variation: payload.variation,
        features: payload.features ?? [],
        image_prompt: payload.imagePrompt ?? '',
        catalog_status: payload.catalogStatus ?? 'draft',
        is_active: payload.isActive,
        is_featured: payload.isFeatured,
        is_promo: payload.isPromo,
        is_new: payload.isNew,
        stock_quantity: payload.stockQuantity ?? 0,
        variants_enabled: payload.variantsEnabled ?? false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select('*')
      .single();

    if (error) throw error;
    if (!data) throw new ApiError(404, 'Produto nao encontrado.');

    const supabase = getSupabaseAdmin();
    await saveProductImages(supabase, data.id, payload.images, payload.title);
    await saveProductVariants(supabase, data.id, payload.variants ?? []);

    const { data: updated, error: fetchError } = await getSupabaseAdmin().from('products').select(productSelect()).eq('id', data.id).single();
    if (fetchError) throw fetchError;

    invalidatePublicCatalogCache();
    return ok(res, mapProduct(updated));
  } catch (error) {
    return handleError(res, error);
  }
});

productRouter.patch('/bulk/stock', requireAuth, async (req, res) => {
  try {
    const payload = parseBulkStockPayload(req.body);
    const supabase = getSupabaseAdmin();

    const { data: existingProducts, error: existingProductsError } = await supabase
      .from('products')
      .select('id')
      .in('id', payload.productIds);

    if (existingProductsError) throw existingProductsError;
    if ((existingProducts ?? []).length !== payload.productIds.length) {
      throw new ApiError(404, 'Um ou mais produtos nao foram encontrados.');
    }

    const { data, error } = await supabase
      .from('products')
      .update({
        stock_quantity: payload.stockQuantity,
        updated_at: new Date().toISOString(),
      })
      .in('id', payload.productIds)
      .select(productSelect());

    if (error) throw error;

    invalidatePublicCatalogCache();
    return ok(res, (data ?? []).map(mapProduct));
  } catch (error) {
    return handleError(res, error);
  }
});

productRouter.patch('/bulk/visibility', requireAuth, async (req, res) => {
  try {
    const productIds = Array.isArray(req.body.productIds)
      ? req.body.productIds.filter((id: unknown) => typeof id === 'string' && id.trim()).map((id: string) => id.trim())
      : [];

    if (productIds.length === 0) throw new ApiError(400, 'Selecione ao menos um produto.');

    const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof req.body.isActive === 'boolean') updatePayload.is_active = req.body.isActive;
    if (typeof req.body.isFeatured === 'boolean') updatePayload.is_featured = req.body.isFeatured;
    if (typeof req.body.isPromo === 'boolean') updatePayload.is_promo = req.body.isPromo;
    if (typeof req.body.isNew === 'boolean') updatePayload.is_new = req.body.isNew;
    if (['draft', 'ready', 'live'].includes(String(req.body.catalogStatus))) updatePayload.catalog_status = req.body.catalogStatus;

    if (Object.keys(updatePayload).length === 1) throw new ApiError(400, 'Informe ao menos uma alteracao de vitrine.');

    const { data, error } = await getSupabaseAdmin()
      .from('products')
      .update(updatePayload)
      .in('id', productIds)
      .select(productSelect());

    if (error) throw error;
    invalidatePublicCatalogCache();
    return ok(res, (data ?? []).map(mapProduct));
  } catch (error) {
    return handleError(res, error);
  }
});

productRouter.patch('/:id/visibility', requireAuth, async (req, res) => {
  try {
    const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof req.body.isActive === 'boolean') updatePayload.is_active = req.body.isActive;
    if (typeof req.body.isFeatured === 'boolean') updatePayload.is_featured = req.body.isFeatured;
    if (typeof req.body.isPromo === 'boolean') updatePayload.is_promo = req.body.isPromo;
    if (typeof req.body.isNew === 'boolean') updatePayload.is_new = req.body.isNew;
    if (['draft', 'ready', 'live'].includes(String(req.body.catalogStatus))) updatePayload.catalog_status = req.body.catalogStatus;

    if (Object.keys(updatePayload).length === 1) throw new ApiError(400, 'Informe ao menos uma alteracao de vitrine.');

    const { data, error } = await getSupabaseAdmin()
      .from('products')
      .update(updatePayload)
      .eq('id', req.params.id)
      .select(productSelect())
      .single();

    if (error) throw error;
    invalidatePublicCatalogCache();
    return ok(res, mapProduct(data));
  } catch (error) {
    return handleError(res, error);
  }
});

productRouter.patch('/:id/status', requireAuth, async (req, res) => {
  try {
    const fieldMap: Record<string, string> = {
      isActive: 'is_active',
      isFeatured: 'is_featured',
      isPromo: 'is_promo',
      isNew: 'is_new',
    };
    const field = fieldMap[String(req.body.field)];
    if (!field) throw new ApiError(400, 'Campo de status invalido.');

    const { data: current, error: currentError } = await getSupabaseAdmin().from('products').select(field).eq('id', req.params.id).single<Record<string, boolean>>();
    if (currentError) throw currentError;

    const { data, error } = await getSupabaseAdmin()
      .from('products')
      .update({ [field]: !Boolean(current?.[field]), updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select(productSelect())
      .single();

    if (error) throw error;
    invalidatePublicCatalogCache();
    return ok(res, mapProduct(data));
  } catch (error) {
    return handleError(res, error);
  }
});

productRouter.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { error } = await getSupabaseAdmin().from('products').delete().eq('id', req.params.id);
    if (error) throw error;
    invalidatePublicCatalogCache();
    return ok(res, { ok: true });
  } catch (error) {
    return handleError(res, error);
  }
});
