async function apiRequest<T>(path: string, options: RequestInit & { auth?: boolean } = {}) {
  const api = await import('./apiClient');
  return api.apiRequest<T>(path, options);
}

export interface AdminNotification {
  id: string;
  type: 'new_order';
  title: string;
  message: string;
  order_id?: string | null;
  order_code?: string | null;
  payload?: Record<string, unknown>;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
}

export interface NotificationListResponse {
  items: AdminNotification[];
  unreadCount: number;
  push: PushPublicConfig;
}

export interface PushPublicConfig {
  enabled: boolean;
  publicKey: string;
}

export interface PushEnableResult {
  enabled: boolean;
  status: 'subscribed' | 'unsupported' | 'denied' | 'not_configured';
}

export function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = `${base64String}${padding}`.replace(/-/g, '+').replace(/_/g, '/');
  const rawData = globalThis.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export async function listNotifications(limit = 20) {
  return apiRequest<NotificationListResponse>(`/api/notifications?limit=${limit}`, { auth: true });
}

export async function markNotificationRead(id: string) {
  return apiRequest<AdminNotification>(`/api/notifications/${id}/read`, {
    method: 'PATCH',
    auth: true,
  });
}

export async function markAllNotificationsRead() {
  return apiRequest<{ success: boolean }>('/api/notifications/read-all', {
    method: 'PATCH',
    auth: true,
  });
}

export async function getPushPublicConfig() {
  return apiRequest<PushPublicConfig>('/api/notifications/push/public-key', { auth: true });
}

export async function savePushSubscription(subscription: PushSubscriptionJSON) {
  return apiRequest('/api/notifications/push/subscribe', {
    method: 'POST',
    auth: true,
    body: JSON.stringify({ subscription }),
  });
}

export async function enableBrowserPushNotifications(): Promise<PushEnableResult> {
  if (
    typeof window === 'undefined'
    || !('serviceWorker' in navigator)
    || !('PushManager' in window)
    || !('Notification' in window)
  ) {
    return { enabled: false, status: 'unsupported' };
  }

  const config = await getPushPublicConfig();
  if (!config.enabled || !config.publicKey) {
    return { enabled: false, status: 'not_configured' };
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return { enabled: false, status: 'denied' };
  }

  const registration = await navigator.serviceWorker.register('/sw.js');
  const existing = await registration.pushManager.getSubscription();
  const subscription = existing ?? await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(config.publicKey),
  });

  await savePushSubscription(subscription.toJSON());
  return { enabled: true, status: 'subscribed' };
}
