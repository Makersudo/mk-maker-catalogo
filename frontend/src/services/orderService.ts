import { apiRequest } from './apiClient';
import { CartItem, CheckoutData } from '../types';

export async function createOrder(cart: CartItem[], customer: CheckoutData) {
  const idempotencyKey = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return apiRequest<{ whatsappUrl: string; order: { order_code?: string } }>('/api/orders', {
    method: 'POST',
    headers: {
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({
      customer,
      items: cart.map((item) => ({
        productId: item.product.id,
        variantId: item.variant?.id ?? null,
        quantity: item.quantity,
      })),
    }),
  });
}
