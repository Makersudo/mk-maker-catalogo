import { Router } from 'express';
import { createSession, validateAdminCredentials } from '../../lib/auth.js';
import { handleError, ok, requireString } from '../../lib/http.js';
import { env } from '../../config/env.js';
import { getSupabaseAdmin } from '../../lib/supabase.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { loginKey, rateLimit } from '../../middleware/rateLimit.js';
import { validateAdminAccessCode } from './adminSecrets.js';
import { consumeStoredGateToken, createStoredGateToken } from './gateTokens.js';
import { buildLoginResponse, serializeLogoutCookie, serializeSessionCookie } from './sessionCookie.js';
import {
  confirmAdminTotpSetup,
  getAdminTotpSetupStatus,
  startAdminTotpSetup,
} from './totpSetup.js';

export const authRouter = Router();

authRouter.post('/gate', rateLimit({
  keyPrefix: 'admin-gate',
  windowMs: env.loginRateLimitWindowMs,
  max: env.loginRateLimitMaxAttempts,
}), async (req, res) => {
  try {
    const accessCode = requireString(req.body.accessCode, 'accessCode');
    
    // Permite qualquer código de acesso localmente em ambiente de desenvolvimento
    if (env.nodeEnv !== 'development') {
      await validateAdminAccessCode(accessCode);
    } else {
      console.log('[Dev Mode] Ignorando validação do código do Google Authenticator.');
    }

    return ok(res, {
      gateToken: await createStoredGateToken(getSupabaseAdmin()),
    });
  } catch (error) {
    return handleError(res, error);
  }
});

authRouter.get('/totp/status', async (_req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store');
    return ok(res, await getAdminTotpSetupStatus(getSupabaseAdmin()));
  } catch (error) {
    return handleError(res, error);
  }
});

authRouter.post('/totp/setup/start', rateLimit({
  keyPrefix: 'admin-totp-setup-start',
  windowMs: env.loginRateLimitWindowMs,
  max: env.loginRateLimitMaxAttempts,
}), async (req, res) => {
  try {
    const status = await getAdminTotpSetupStatus(getSupabaseAdmin());

    if (status.configured && !req.admin) {
      return requireAuth(req, res, async () => {
        try {
          res.setHeader('Cache-Control', 'no-store');
          return ok(res, await startAdminTotpSetup(getSupabaseAdmin(), {
            jwtSecret: env.jwtSecret,
            allowReset: true,
          }));
        } catch (error) {
          return handleError(res, error);
        }
      });
    }

    if (!status.configured) {
      const email = requireString(req.body.email, 'email');
      const password = requireString(req.body.password, 'password');
      validateAdminCredentials(email, password);
    }

    res.setHeader('Cache-Control', 'no-store');
    return ok(res, await startAdminTotpSetup(getSupabaseAdmin(), {
      jwtSecret: env.jwtSecret,
      allowReset: false,
    }));
  } catch (error) {
    return handleError(res, error);
  }
});

authRouter.post('/totp/setup/confirm', rateLimit({
  keyPrefix: 'admin-totp-setup-confirm',
  windowMs: env.loginRateLimitWindowMs,
  max: env.loginRateLimitMaxAttempts,
}), async (req, res) => {
  try {
    const setupToken = requireString(req.body.setupToken, 'setupToken');
    const code = requireString(req.body.code, 'code');

    await confirmAdminTotpSetup(getSupabaseAdmin(), {
      jwtSecret: env.jwtSecret,
      setupToken,
      code,
    });

    res.setHeader('Cache-Control', 'no-store');
    return ok(res, { success: true });
  } catch (error) {
    return handleError(res, error);
  }
});

authRouter.post('/login', rateLimit({
  keyPrefix: 'login',
  windowMs: env.loginRateLimitWindowMs,
  max: env.loginRateLimitMaxAttempts,
  keyGenerator: loginKey,
}), async (req, res) => {
  try {
    const email = requireString(req.body.email, 'email');
    const password = requireString(req.body.password, 'password');
    const gateToken = requireString(req.get('x-admin-gate-token') || req.body.gateToken, 'gateToken');

    await consumeStoredGateToken(getSupabaseAdmin(), gateToken);
    const adminEmail = validateAdminCredentials(email, password);
    const token = createSession(adminEmail);

    res.setHeader('Set-Cookie', serializeSessionCookie(token, env.nodeEnv));
    return ok(res, buildLoginResponse(adminEmail, token, req));
  } catch (error) {
    return handleError(res, error);
  }
});

authRouter.get('/me', requireAuth, (req, res) => {
  return ok(res, {
    user: {
      id: 'admin',
      email: req.admin?.email,
    },
  });
});

authRouter.post('/logout', requireAuth, (_req, res) => {
  res.setHeader('Set-Cookie', serializeLogoutCookie(env.nodeEnv));
  return ok(res, { success: true });
});
