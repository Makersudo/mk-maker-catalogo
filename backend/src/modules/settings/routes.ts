import { Router } from 'express';
import { getSupabaseAdmin } from '../../lib/supabase.js';
import { handleError, ok } from '../../lib/http.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { loadMergedPublicSettings, upsertCatalogConfigFromPublicSettings } from '../catalogConfig/service.js';
import { normalizePublicSettingsPayload } from './publicSettings.js';

export const settingsRouter = Router();

settingsRouter.get('/', async (_req, res) => {
  try {
    return ok(res, await loadMergedPublicSettings());
  } catch (error) {
    return handleError(res, error);
  }
});

settingsRouter.put('/', requireAuth, async (req, res) => {
  try {
    const now = new Date().toISOString();
    const entries = normalizePublicSettingsPayload(req.body ?? {}).map((entry) => ({
      ...entry,
      updated_at: now,
    }));

    if (entries.length === 0) return ok(res, {});

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('settings')
      .upsert(entries, { onConflict: 'key' })
      .select('key,value,is_public');

    if (error) throw error;

    await upsertCatalogConfigFromPublicSettings(supabase, entries, now);
    return ok(res, await loadMergedPublicSettings(supabase));
  } catch (error) {
    return handleError(res, error);
  }
});
