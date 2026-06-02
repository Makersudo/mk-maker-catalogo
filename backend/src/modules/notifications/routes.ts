import { Router } from 'express';
import { getSupabaseAdmin } from '../../lib/supabase.js';
import { ApiError, handleError, ok, requireString } from '../../lib/http.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  publicPushConfig,
  removePushSubscription,
  savePushSubscription,
} from './service.js';

export const notificationRouter = Router();

notificationRouter.use(requireAuth);

notificationRouter.get('/', async (req, res) => {
  try {
    const limit = Number(req.query.limit ?? 20);
    return ok(res, await listNotifications(getSupabaseAdmin(), limit));
  } catch (error) {
    return handleError(res, error);
  }
});

notificationRouter.get('/push/public-key', (_req, res) => {
  return ok(res, publicPushConfig());
});

notificationRouter.post('/push/subscribe', async (req, res) => {
  try {
    const subscription = req.body.subscription ?? req.body;
    const userAgent = req.get('user-agent') ?? '';
    return ok(res, await savePushSubscription(getSupabaseAdmin(), subscription, userAgent), 201);
  } catch (error) {
    return handleError(res, error);
  }
});

notificationRouter.delete('/push/subscribe', async (req, res) => {
  try {
    const subscription = req.body.subscription ?? req.body;
    return ok(res, await removePushSubscription(getSupabaseAdmin(), subscription));
  } catch (error) {
    return handleError(res, error);
  }
});

notificationRouter.patch('/read-all', async (_req, res) => {
  try {
    return ok(res, await markAllNotificationsRead(getSupabaseAdmin()));
  } catch (error) {
    return handleError(res, error);
  }
});

notificationRouter.patch('/:id/read', async (req, res) => {
  try {
    const id = requireString(req.params.id, 'id');
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new ApiError(400, 'ID de notificacao invalido.');
    return ok(res, await markNotificationRead(getSupabaseAdmin(), id));
  } catch (error) {
    return handleError(res, error);
  }
});
