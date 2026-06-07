import type { Request, Response } from 'express';
import { getSupabaseAdmin } from '../lib/supabase.js';

interface AdminAuditInput {
  adminEmail: string;
  method: string;
  path: string;
  statusCode: number;
  ip?: string;
  userAgent?: string;
}

export function buildAdminAuditEvent(input: AdminAuditInput) {
  return {
    admin_email: input.adminEmail,
    method: input.method.toUpperCase(),
    path: input.path.split('?')[0],
    status_code: input.statusCode,
    ip_address: input.ip || null,
    user_agent: input.userAgent || null,
  };
}

export function attachAdminAudit(req: Request, res: Response) {
  if (!req.admin || ['GET', 'HEAD', 'OPTIONS'].includes(req.method.toUpperCase())) return;

  res.once('finish', () => {
    const event = buildAdminAuditEvent({
      adminEmail: req.admin?.email ?? 'unknown',
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    void (async () => {
      try {
        const { error } = await getSupabaseAdmin().from('admin_audit_logs').insert(event);
        if (error) console.error('Falha ao registrar auditoria administrativa.', error.message);
      } catch (error) {
        console.error('Falha ao registrar auditoria administrativa.', error);
      }
    })();
  });
}
