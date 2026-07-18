import { Router } from 'express';
import { getSupabaseAdmin } from '../../lib/supabase.js';
import { ApiError, handleError, ok, optionalString, requireString } from '../../lib/http.js';
import { requireAuth } from '../../middleware/requireAuth.js';

export const announcementsRouter = Router();

type LinkType = 'product' | 'category' | 'campaign' | 'url' | 'none';
type AnimationType = 'slide' | 'fade' | 'zoom' | 'flip' | 'bounce' | 'typewriter';

function normalizeLink(value: unknown): LinkType {
  const valid: LinkType[] = ['product', 'category', 'campaign', 'url', 'none'];
  return valid.includes(value as LinkType) ? (value as LinkType) : 'url';
}

function normalizeAnimation(value: unknown): AnimationType {
  const valid: AnimationType[] = ['slide', 'fade', 'zoom', 'flip', 'bounce', 'typewriter'];
  return valid.includes(value as AnimationType) ? (value as AnimationType) : 'slide';
}

function parsePayload(body: any) {
  return {
    title:            requireString(body.title, 'title'),
    subtitle:         optionalString(body.subtitle) ?? null,
    emoji:            optionalString(body.emoji) ?? null,
    image_url:        optionalString(body.image_url ?? body.imageUrl) ?? null,
    bg_color:         optionalString(body.bg_color ?? body.bgColor) ?? '#c98f86',
    text_color:       optionalString(body.text_color ?? body.textColor) ?? '#ffffff',
    link_type:        normalizeLink(body.link_type ?? body.linkType),
    link_value:       optionalString(body.link_value ?? body.linkValue) ?? null,
    animation_type:   normalizeAnimation(body.animation_type ?? body.animationType),
    duration_seconds: Number(body.duration_seconds ?? body.durationSeconds ?? 4),
    sort_order:       Number(body.sort_order ?? body.sortOrder ?? 0),
    is_active:        Boolean(body.is_active ?? body.isActive ?? true),
    is_full_banner:   Boolean(body.is_full_banner ?? body.isFullBanner ?? false),
  };
}

// ─── PUBLIC ──────────────────────────────────────────────────────────────────

/** GET /api/announcements — lista ativos ordenados */
announcementsRouter.get('/', async (_req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('banner_announcements')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw new ApiError(500, error.message);
    return ok(res, data ?? []);
  } catch (err) {
    return handleError(res, err);
  }
});

// ─── ADMIN ────────────────────────────────────────────────────────────────────

/** GET /api/announcements/admin — lista todos (admin) */
announcementsRouter.get('/admin', requireAuth, async (_req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('banner_announcements')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw new ApiError(500, error.message);
    return ok(res, data ?? []);
  } catch (err) {
    return handleError(res, err);
  }
});

/** POST /api/announcements/admin — criar */
announcementsRouter.post('/admin', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const payload = parsePayload(req.body);
    const { data, error } = await supabase
      .from('banner_announcements')
      .insert(payload)
      .select()
      .single();

    if (error) throw new ApiError(500, error.message);
    return ok(res, data, 201);
  } catch (err) {
    return handleError(res, err);
  }
});

/** PUT /api/announcements/admin/:id — atualizar */
announcementsRouter.put('/admin/:id', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { id } = req.params;
    const payload = parsePayload(req.body);
    const { data, error } = await supabase
      .from('banner_announcements')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new ApiError(500, error.message);
    if (!data) throw new ApiError(404, 'Anúncio não encontrado.');
    return ok(res, data);
  } catch (err) {
    return handleError(res, err);
  }
});

/** PATCH /api/announcements/admin/:id/toggle — ativar/pausar */
announcementsRouter.patch('/admin/:id/toggle', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { id } = req.params;
    const { data: current, error: fetchErr } = await supabase
      .from('banner_announcements')
      .select('is_active')
      .eq('id', id)
      .single();

    if (fetchErr || !current) throw new ApiError(404, 'Anúncio não encontrado.');

    const { data, error } = await supabase
      .from('banner_announcements')
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

/** DELETE /api/announcements/admin/:id — deletar */
announcementsRouter.delete('/admin/:id', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { id } = req.params;
    const { error } = await supabase
      .from('banner_announcements')
      .delete()
      .eq('id', id);

    if (error) throw new ApiError(500, error.message);
    return ok(res, { deleted: true });
  } catch (err) {
    return handleError(res, err);
  }
});
