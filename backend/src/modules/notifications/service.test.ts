import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildNewOrderNotification,
  createNewOrderNotification,
  normalizePushSubscription,
} from './service.js';

describe('notifications service', () => {
  it('builds a new order notification payload for the admin center', () => {
    const notification = buildNewOrderNotification({
      id: 'order-1',
      order_code: 'MK-20260602-ABC123',
      customer_name: 'Maria Ferreira',
      customer_phone: '11999998888',
      total_amount: 149.9,
      fulfillment_type: 'pickup',
    });

    assert.equal(notification.type, 'new_order');
    assert.equal(notification.title, 'Novo pedido recebido');
    assert.equal(notification.order_id, 'order-1');
    assert.equal(notification.order_code, 'MK-20260602-ABC123');
    assert.match(notification.message, /Maria Ferreira/);
    assert.match(notification.message, /R\$ 149,90/);
    assert.equal(notification.payload.customerPhone, '11999998888');
    assert.equal(notification.payload.fulfillmentType, 'pickup');
  });

  it('persists the new order notification in Supabase', async () => {
    const inserts: Array<{ table: string; payload: any }> = [];
    const supabase = {
      from(table: string) {
        return {
          insert(payload: any) {
            inserts.push({ table, payload });
            return {
              select() {
                return {
                  single: async () => ({ data: { id: 'notification-1', ...payload }, error: null }),
                };
              },
            };
          },
        };
      },
    };

    const created = await createNewOrderNotification(supabase, {
      id: 'order-1',
      order_code: 'MK-20260602-ABC123',
      customer_name: 'Maria Ferreira',
      customer_phone: '11999998888',
      total_amount: 149.9,
      fulfillment_type: 'pickup',
    });

    assert.equal(created?.id, 'notification-1');
    assert.equal(inserts.length, 1);
    assert.equal(inserts[0].table, 'notifications');
    assert.equal(inserts[0].payload.type, 'new_order');
    assert.equal(inserts[0].payload.is_read, false);
  });

  it('normalizes browser push subscriptions for storage', () => {
    const subscription = normalizePushSubscription({
      endpoint: 'https://push.example/subscription',
      keys: {
        p256dh: 'public-key',
        auth: 'auth-secret',
      },
    });

    assert.deepEqual(subscription, {
      endpoint: 'https://push.example/subscription',
      p256dh: 'public-key',
      auth: 'auth-secret',
    });
  });
});
