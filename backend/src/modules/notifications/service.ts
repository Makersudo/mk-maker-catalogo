import webPush from 'web-push';
import { env } from '../../config/env.js';
import { ApiError } from '../../lib/http.js';

type SupabaseLike = {
  from: (table: string) => any;
};

export type NotificationType = 'new_order';

export interface NewOrderNotificationInput {
  id: string;
  order_code?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  total_amount?: number | string | null;
  fulfillment_type?: string | null;
}

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  message: string;
  order_id: string;
  order_code: string;
  payload: Record<string, unknown>;
  is_read: boolean;
}

export interface StoredNotification extends NotificationPayload {
  id: string;
  created_at?: string;
  read_at?: string | null;
}

export interface NormalizedPushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushDeliveryResult {
  enabled: boolean;
  sent: number;
  failed: number;
  skippedReason?: string;
}

function currency(value: unknown) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
    .format(Number.isFinite(amount) ? amount : 0)
    .replace(/\u00a0/g, ' ');
}

function orderCode(order: NewOrderNotificationInput) {
  return String(order.order_code || 'PEDIDO SEM TICKET');
}

export function buildNewOrderNotification(order: NewOrderNotificationInput): NotificationPayload {
  const customerName = order.customer_name?.trim() || 'Cliente nao informado';
  const code = orderCode(order);
  const total = currency(order.total_amount);
  const fulfillmentType = order.fulfillment_type === 'pickup' ? 'pickup' : 'delivery';
  const fulfillmentLabel = fulfillmentType === 'pickup' ? 'retirada' : 'entrega';

  return {
    type: 'new_order',
    title: 'Novo pedido recebido',
    message: `${customerName} finalizou o pedido ${code} no valor de ${total} para ${fulfillmentLabel}.`,
    order_id: order.id,
    order_code: code,
    payload: {
      customerName,
      customerPhone: order.customer_phone || '',
      totalAmount: Number(order.total_amount ?? 0),
      fulfillmentType,
    },
    is_read: false,
  };
}

export async function createNewOrderNotification(supabase: SupabaseLike, order: NewOrderNotificationInput) {
  const notification = buildNewOrderNotification(order);
  const { data, error } = await supabase
    .from('notifications')
    .insert(notification)
    .select('*')
    .single();

  if (error) throw error;
  return data as StoredNotification;
}

export function normalizePushSubscription(value: unknown): NormalizedPushSubscription {
  if (!value || typeof value !== 'object') {
    throw new ApiError(400, 'Assinatura push invalida.');
  }

  const input = value as {
    endpoint?: unknown;
    keys?: { p256dh?: unknown; auth?: unknown };
  };
  const endpoint = typeof input.endpoint === 'string' ? input.endpoint.trim() : '';
  const p256dh = typeof input.keys?.p256dh === 'string' ? input.keys.p256dh.trim() : '';
  const auth = typeof input.keys?.auth === 'string' ? input.keys.auth.trim() : '';

  if (!endpoint || !p256dh || !auth) {
    throw new ApiError(400, 'Assinatura push incompleta.');
  }

  return { endpoint, p256dh, auth };
}

export function isWebPushConfigured() {
  return Boolean(env.webPushPublicKey && env.webPushPrivateKey);
}

function configureWebPush() {
  if (!isWebPushConfigured()) return false;
  webPush.setVapidDetails(env.webPushSubject, env.webPushPublicKey, env.webPushPrivateKey);
  return true;
}

export function publicPushConfig() {
  return {
    enabled: isWebPushConfigured(),
    publicKey: env.webPushPublicKey,
  };
}

export async function savePushSubscription(supabase: SupabaseLike, subscriptionInput: unknown, userAgent = '') {
  const subscription = normalizePushSubscription(subscriptionInput);
  const { data, error } = await supabase
    .from('push_subscriptions')
    .upsert({
      endpoint: subscription.endpoint,
      p256dh: subscription.p256dh,
      auth: subscription.auth,
      user_agent: userAgent,
      is_active: true,
      last_error: null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'endpoint' })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function removePushSubscription(supabase: SupabaseLike, subscriptionInput: unknown) {
  const subscription = normalizePushSubscription(subscriptionInput);
  const { error } = await supabase
    .from('push_subscriptions')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('endpoint', subscription.endpoint);

  if (error) throw error;
  return { success: true };
}

export async function listNotifications(supabase: SupabaseLike, limit = 20) {
  const safeLimit = Math.min(50, Math.max(1, Math.floor(limit)));
  const [itemsResult, unreadResult] = await Promise.all([
    supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(safeLimit),
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('is_read', false),
  ]);

  if (itemsResult.error) throw itemsResult.error;
  if (unreadResult.error) throw unreadResult.error;

  return {
    items: itemsResult.data ?? [],
    unreadCount: unreadResult.count ?? 0,
    push: publicPushConfig(),
  };
}

export async function markNotificationRead(supabase: SupabaseLike, id: string) {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function markAllNotificationsRead(supabase: SupabaseLike) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('is_read', false);

  if (error) throw error;
  return { success: true };
}

export async function dispatchPushNotification(supabase: SupabaseLike, notification: StoredNotification): Promise<PushDeliveryResult> {
  if (!configureWebPush()) {
    return { enabled: false, sent: 0, failed: 0, skippedReason: 'web_push_not_configured' };
  }

  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('is_active', true);

  if (error) throw error;

  const subscriptions = data ?? [];
  let sent = 0;
  let failed = 0;
  const payload = JSON.stringify({
    title: notification.title,
    body: notification.message,
    icon: '/assets/mk-maker-logo-symbol-transparent.png',
    badge: '/assets/mk-maker-logo-symbol-transparent.png',
    data: {
      url: `/admin/orders?ticket=${encodeURIComponent(notification.order_code)}`,
      orderId: notification.order_id,
      notificationId: notification.id,
    },
  });

  for (const subscription of subscriptions) {
    try {
      await webPush.sendNotification({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      }, payload);
      sent += 1;
    } catch (error: any) {
      failed += 1;
      const expired = error?.statusCode === 404 || error?.statusCode === 410;
      await supabase
        .from('push_subscriptions')
        .update({
          is_active: !expired,
          last_error: error instanceof Error ? error.message : 'Falha ao enviar push.',
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscription.id);
    }
  }

  return { enabled: true, sent, failed };
}
