import type { NextFunction, Request, Response } from 'express';
import { verifySession } from '../lib/auth.js';
import { handleError } from '../lib/http.js';
import { extractSessionToken, isUnsafeAuthenticatedRequest } from '../modules/auth/sessionCookie.js';
import { env } from '../config/env.js';
import { assertTrustedAdminOrigin } from './adminOrigin.js';
import { attachAdminAudit } from './adminAudit.js';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = extractSessionToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Autenticacao obrigatoria.' });
    }

    req.admin = verifySession(token);
    if (isUnsafeAuthenticatedRequest(req)) {
      return res.status(403).json({ error: 'Requisicao administrativa invalida.' });
    }
    assertTrustedAdminOrigin(req, env.corsOrigins);
    attachAdminAudit(req, res);

    next();
  } catch (error) {
    return handleError(res, error);
  }
}

