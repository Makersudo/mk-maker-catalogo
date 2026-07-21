import { Router } from 'express';
import { getSupabaseAdmin } from '../../lib/supabase.js';
import { ApiError, handleError, ok, requireString, optionalString } from '../../lib/http.js';
import { requireAuth } from '../../middleware/requireAuth.js';

export const licensesRouter = Router();

function parsePayload(body: any) {
  return {
    license_key:     requireString(body.license_key ?? body.licenseKey, 'license_key'),
    client_name:     requireString(body.client_name ?? body.clientName, 'client_name'),
    domain:          optionalString(body.domain) ?? null,
    active:          Boolean(body.active ?? true),
    message:         optionalString(body.message) ?? null,
    support_contact: optionalString(body.support_contact ?? body.supportContact) ?? null,
  };
}

// ─── PUBLIC ──────────────────────────────────────────────────────────────────

/** GET /api/licenses/validate — Valida se uma licença está ativa */
licensesRouter.get('/validate', async (req, res) => {
  try {
    const key = req.query.key as string;
    const domain = req.query.domain as string;

    if (!key) {
      throw new ApiError(400, 'Chave de licença não fornecida.');
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('catalog_licenses')
      .select('*')
      .eq('license_key', key)
      .maybeSingle();

    if (error) throw new ApiError(500, error.message);
    
    if (!data) {
      return ok(res, {
        active: false,
        status: 'not_found',
        message: 'Licença inválida ou não registrada.',
      });
    }

    if (!data.active) {
      return ok(res, {
        active: false,
        status: 'suspended',
        message: data.message || 'Plataforma suspensa por pendências financeiras.',
        supportContact: data.support_contact,
      });
    }

    return ok(res, {
      active: true,
      status: 'active',
      message: 'Licença ativa e válida.',
      clientName: data.client_name,
    });

  } catch (err) {
    return handleError(res, err);
  }
});

// ─── ADMIN ────────────────────────────────────────────────────────────────────

/** GET /api/licenses/admin — Listar todas as licenças */
licensesRouter.get('/admin', requireAuth, async (_req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('catalog_licenses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new ApiError(500, error.message);
    return ok(res, data ?? []);
  } catch (err) {
    return handleError(res, err);
  }
});

/** POST /api/licenses/admin — Criar licença */
licensesRouter.post('/admin', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const payload = parsePayload(req.body);
    const { data, error } = await supabase
      .from('catalog_licenses')
      .insert(payload)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new ApiError(400, 'Esta chave de licença já está em uso.');
      }
      throw new ApiError(500, error.message);
    }
    return ok(res, data, 201);
  } catch (err) {
    return handleError(res, err);
  }
});

/** PUT /api/licenses/admin/:id — Atualizar licença */
licensesRouter.put('/admin/:id', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { id } = req.params;
    const payload = parsePayload(req.body);
    const { data, error } = await supabase
      .from('catalog_licenses')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new ApiError(500, error.message);
    if (!data) throw new ApiError(404, 'Licença não encontrada.');
    return ok(res, data);
  } catch (err) {
    return handleError(res, err);
  }
});

/** DELETE /api/licenses/admin/:id — Deletar licença */
licensesRouter.delete('/admin/:id', requireAuth, async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { id } = req.params;
    const { error } = await supabase
      .from('catalog_licenses')
      .delete()
      .eq('id', id);

    if (error) throw new ApiError(500, error.message);
    return ok(res, { deleted: true });
  } catch (err) {
    return handleError(res, err);
  }
});
