self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }

  const title = payload.title || 'Novo pedido recebido';
  const options = {
    body: payload.body || 'A central recebeu uma nova compra no catalogo.',
    icon: payload.icon || '/assets/mk-maker-logo-symbol-transparent.png',
    badge: payload.badge || '/assets/mk-maker-logo-symbol-transparent.png',
    data: payload.data || { url: '/admin/orders' },
    tag: payload.data?.orderId || 'mk-maker-order',
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/admin/orders';

  event.waitUntil((async () => {
    const windows = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    const sameOriginUrl = new URL(targetUrl, self.location.origin).href;

    for (const client of windows) {
      if ('focus' in client) {
        await client.focus();
        if ('navigate' in client) await client.navigate(sameOriginUrl);
        return;
      }
    }

    if (clients.openWindow) await clients.openWindow(sameOriginUrl);
  })());
});
