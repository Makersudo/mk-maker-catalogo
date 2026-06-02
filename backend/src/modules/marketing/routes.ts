import { Router } from 'express';
import { getSupabaseAdmin } from '../../lib/supabase.js';
import { ApiError, handleError, ok, optionalString, requireNumber, requireString } from '../../lib/http.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { invalidatePublicCatalogCache } from '../catalog/service.js';

export const marketingRouter = Router();

const CAMPAIGN_SELECT = '*, marketing_campaign_products(product_id,campaign_price,sort_order)';

function slugify(value: string) {
  const slug = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || `campanha-${Date.now()}`;
}

function normalizeCampaignStatus(value: unknown) {
  const status = String(value ?? 'draft');
  return ['draft', 'scheduled', 'active', 'paused', 'expired'].includes(status) ? status : 'draft';
}

function normalizeCampaignType(value: unknown) {
  const type = String(value ?? 'promotion');
  return ['promotion', 'launch', 'featured', 'flash'].includes(type) ? type : 'promotion';
}

function normalizeDiscountType(value: unknown) {
  const type = String(value ?? 'none');
  return ['none', 'percent', 'fixed', 'override_price'].includes(type) ? type : 'none';
}

function optionalDateString(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new ApiError(400, 'Data da campanha invalida.');
  return date.toISOString();
}

function parseCampaignPayload(body: any) {
  const name = requireString(body.name, 'name');
  const startsAt = optionalDateString(body.startsAt ?? body.starts_at);
  const endsAt = optionalDateString(body.endsAt ?? body.ends_at);

  if (startsAt && endsAt && new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
    throw new ApiError(400, 'A data final deve ser maior que a data inicial.');
  }

  return {
    name,
    slug: optionalString(body.slug) || slugify(name),
    type: normalizeCampaignType(body.type),
    status: normalizeCampaignStatus(body.status),
    is_active: Boolean(body.isActive ?? body.is_active ?? body.status === 'active'),
    starts_at: startsAt,
    ends_at: endsAt,
    discount_type: normalizeDiscountType(body.discountType ?? body.discount_type),
    discount_value: requireNumber(body.discountValue ?? body.discount_value ?? 0, 'discountValue'),
    badge_label: optionalString(body.badgeLabel ?? body.badge_label) || 'OFERTA',
    banner_title: optionalString(body.bannerTitle ?? body.banner_title) || null,
    banner_subtitle: optionalString(body.bannerSubtitle ?? body.banner_subtitle) || null,
    banner_image_url: optionalString(body.bannerImageUrl ?? body.banner_image_url) || null,
    priority: Math.floor(requireNumber(body.priority ?? 0, 'priority')),
  };
}

function parseCampaignProducts(body: any) {
  const rawProducts = Array.isArray(body.products) ? body.products : Array.isArray(body.productIds) ? body.productIds : [];
  const products = rawProducts.map((item: any, index: number) => {
    if (typeof item === 'string') {
      return { product_id: item, campaign_price: null, sort_order: index };
    }

    return {
      product_id: requireString(item.productId ?? item.product_id, 'productId'),
      campaign_price: item.campaignPrice === null || item.campaignPrice === undefined || item.campaign_price === null || item.campaign_price === undefined
        ? null
        : requireNumber(item.campaignPrice ?? item.campaign_price, 'campaignPrice'),
      sort_order: Math.floor(Number(item.sortOrder ?? item.sort_order ?? index)),
    };
  });

  const unique = new Map<string, typeof products[number]>();
  for (const product of products) unique.set(product.product_id, product);
  return Array.from(unique.values());
}

marketingRouter.get('/campaigns', requireAuth, async (_req, res) => {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from('marketing_campaigns')
      .select(CAMPAIGN_SELECT)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return ok(res, data ?? []);
  } catch (error) {
    return handleError(res, error);
  }
});

marketingRouter.post('/campaigns', requireAuth, async (req, res) => {
  try {
    const payload = parseCampaignPayload(req.body);
    const { data, error } = await getSupabaseAdmin()
      .from('marketing_campaigns')
      .insert(payload)
      .select(CAMPAIGN_SELECT)
      .single();

    if (error) throw error;
    invalidatePublicCatalogCache();
    return ok(res, data, 201);
  } catch (error) {
    return handleError(res, error);
  }
});

marketingRouter.put('/campaigns/:id', requireAuth, async (req, res) => {
  try {
    const payload = parseCampaignPayload(req.body);
    const { data, error } = await getSupabaseAdmin()
      .from('marketing_campaigns')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select(CAMPAIGN_SELECT)
      .single();

    if (error) throw error;
    invalidatePublicCatalogCache();
    return ok(res, data);
  } catch (error) {
    return handleError(res, error);
  }
});

marketingRouter.patch('/campaigns/:id/status', requireAuth, async (req, res) => {
  try {
    const status = normalizeCampaignStatus(req.body.status);
    const { data, error } = await getSupabaseAdmin()
      .from('marketing_campaigns')
      .update({
        status,
        is_active: status === 'active' || status === 'scheduled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select(CAMPAIGN_SELECT)
      .single();

    if (error) throw error;
    invalidatePublicCatalogCache();
    return ok(res, data);
  } catch (error) {
    return handleError(res, error);
  }
});

marketingRouter.put('/campaigns/:id/products', requireAuth, async (req, res) => {
  try {
    const products = parseCampaignProducts(req.body);
    const supabase = getSupabaseAdmin();

    const { error: deleteError } = await supabase
      .from('marketing_campaign_products')
      .delete()
      .eq('campaign_id', req.params.id);

    if (deleteError) throw deleteError;

    if (products.length > 0) {
      const { error: insertError } = await supabase
        .from('marketing_campaign_products')
        .insert(products.map((product) => ({ ...product, campaign_id: req.params.id })));

      if (insertError) throw insertError;
    }

    const { data, error } = await supabase
      .from('marketing_campaigns')
      .select(CAMPAIGN_SELECT)
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    invalidatePublicCatalogCache();
    return ok(res, data);
  } catch (error) {
    return handleError(res, error);
  }
});

marketingRouter.delete('/campaigns/:id', requireAuth, async (req, res) => {
  try {
    const { error } = await getSupabaseAdmin()
      .from('marketing_campaigns')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    invalidatePublicCatalogCache();
    return ok(res, { ok: true });
  } catch (error) {
    return handleError(res, error);
  }
});
