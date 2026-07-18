import { Router } from 'express';
import { getSupabaseAdmin } from '../../lib/supabase.js';
import { ApiError, handleError, ok, optionalString, requireString } from '../../lib/http.js';
import { requireAuth } from '../../middleware/requireAuth.js';

export const couponsRouter = Router();

type DiscountType = 'percent' | 'fixed';

function normalizeDiscountType(value: unknown): DiscountType {
  return value === 'fixed' ? 'fixed' : 'percent';
}

function parsePayload(body: any) {
  const code = requireString(body.code, 'code').toUpperCase().trim();
  const discountValue = Number(body.discount_value ?? body.discountValue ?? 0);
  if (discountValue <= 0) throw new ApiError(400, 'O valor do desconto deve ser maior que zero.');

  return {
    code,
    description:      optionalString(body.description) ?? null,
    discount_type:    normalizeDiscountType(body.discount_type ?? body.discountType),
    discount_value:   discountValue,
    min_order_value:  Number(body.min_order_value ?? body.minOrderValue ?? 0),
    max_uses:         body.max_uses ?? body.maxUses ?? null,
    expires_at:       (body.expires_at ?? body.expiresAt) ? new Date(body.expires_at ?? body.expiresAt).toISOString() : null,
    is_active:        Boolean(body.is_active ?? body.isActive ?? true),
    campaign_id:      optionalString(body.campaign_id ?? body.campaignId) ?? null,
  };
}

// ─── PUBLIC — Validação de Cupom ──────────────────────────────────────────────

/** POST /api/coupons/validate — valida e retorna o cupom (não incrementa uses_count) */
couponsRouter.post('/validate', async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const rawCode = String(req.body?.code ?? '').toUpperCase().trim();
    if (!rawCode) throw new ApiError(400, 'Código do cupom é obrigatório.');

    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .ilike('code', rawCode)
      .single();

    if (error || !coupon) throw new ApiError(404, 'Cupom inválido ou não encontrado.');
    if (!coupon.is_active) throw new ApiError(422, 'Este cupom está inativo.');
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      throw new ApiError(422, 'Este cupom expirou.');
    }
    if (coupon.max_uses !== null && coupon.uses_count >= coupon.max_uses) {
      throw new ApiError(422, 'Este cupom atingiu o limite de usos.');
    }

    const orderTotal = Number(req.body?.orderTotal ?? req.body?.order_total ?? 0);
    if (coupon.min_order_value > 0 && orderTotal < coupon.min_order_value) {
      throw new ApiError(422, `Pedido mínimo de R$ ${Number(coupon.min_order_value).toFixed(2).replace('.', ',')} para usar este cupom.`);
    }

    // Calcular desconto
    let discountAmount = 0;
    if (coupon.discount_type === 'percent') {
      discountAmount = (orderTotal * Number(coupon.discount_value)) / 100;
    } else {
      discountAmount = Math.min(Number(coupon.discount_value), orderTotal);
    }

    return ok(res, {
      id: coupon.id,
      code: coupon.code,
      description: coupon.description,
      discount_type: coupon.discount_type,
      discount_value: Number(coupon.discount_value),
      discount_amount: discountAmount,
      min_order_value: Number(coupon.min_order_value),
    });
  } catch (err) {
    return handleError(res, err);
  }
});

/** POST /api/coupons/use/:id — incrementa uses_count ao finalizar pedido via WhatsApp */
couponsRouter.post('/use/:id', async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { id } = req.params;
    const { error } = await supabase.rpc('increment_coupon_uses', { coupon_id: id });
    if (error) {
      // Fallback manual se RPC não existir
      await supabase
        .from('coupons')
        .update({ uses_count: supabase.rpc('increment_coupon_uses' as any) } as any)
        .eq('id', id);
    }
    return ok(res, { used: true });
  } catch (err) {
    return handleError(res, err);
  }
});

// ─── ADMIN ────────────────────────────────────────────────────────────────────

/** GET /api/coupons/admin — listar todos */
couponsRouter.get('/admin', requireAuth, async (_req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new ApiError(500, error.message);
    return ok(res, data ?? []);
  } catch (err) {
    return handleError(res, err);
  }
});

/** POST /api/coupons/admin — criar */
couponsRouter.post('/admin', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const payload = parsePayload(req.body);

    // Verificar unicidade do código
    const { data: existing } = await supabase
      .from('coupons')
      .select('id')
      .ilike('code', payload.code)
      .single();

    if (existing) throw new ApiError(409, `O código "${payload.code}" já existe.`);

    const { data, error } = await supabase
      .from('coupons')
      .insert(payload)
      .select()
      .single();

    if (error) throw new ApiError(500, error.message);
    return ok(res, data, 201);
  } catch (err) {
    return handleError(res, err);
  }
});

/** PUT /api/coupons/admin/:id — atualizar */
couponsRouter.put('/admin/:id', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { id } = req.params;
    const payload = parsePayload(req.body);
    const { data, error } = await supabase
      .from('coupons')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new ApiError(500, error.message);
    if (!data) throw new ApiError(404, 'Cupom não encontrado.');
    return ok(res, data);
  } catch (err) {
    return handleError(res, err);
  }
});

/** PATCH /api/coupons/admin/:id/toggle — ativar/pausar */
couponsRouter.patch('/admin/:id/toggle', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { id } = req.params;
    const { data: current } = await supabase
      .from('coupons').select('is_active').eq('id', id).single();

    if (!current) throw new ApiError(404, 'Cupom não encontrado.');

    const { data, error } = await supabase
      .from('coupons')
      .update({ is_active: !current.is_active })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new ApiError(500, error.message);
    return ok(res, data);
  } catch (err) {
    return handleError(res, err);
  }
});

/** DELETE /api/coupons/admin/:id — deletar */
couponsRouter.delete('/admin/:id', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { id } = req.params;
    const { error } = await supabase.from('coupons').delete().eq('id', id);
    if (error) throw new ApiError(500, error.message);
    return ok(res, { deleted: true });
  } catch (err) {
    return handleError(res, err);
  }
});
