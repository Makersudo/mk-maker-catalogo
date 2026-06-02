import { apiRequest } from './apiClient';

export type OrderStatus = 'new' | 'confirmed' | 'preparing' | 'ready_for_pickup' | 'sent' | 'completed' | 'cancelled';

export interface AdminOrderItem {
  id: string;
  order_id: string;
  product_id?: string | null;
  product_variant_id?: string | null;
  product_name: string;
  variant_label?: string | null;
  variant_options?: Array<{ name: string; value: string }>;
  unit_price: number;
  quantity: number;
  subtotal: number;
  created_at: string;
}

export interface OrderStatusEvent {
  id: string;
  order_id: string;
  previous_status?: OrderStatus | string | null;
  next_status: OrderStatus;
  note?: string | null;
  created_at: string;
}

export interface AdminOrder {
  id: string;
  customer_name: string;
  customer_phone?: string | null;
  cep?: string | null;
  address?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  region?: string | null;
  city?: string | null;
  state?: string | null;
  reference_point?: string | null;
  fulfillment_type: 'delivery' | 'pickup';
  payment_method: 'cash' | 'pix' | 'card';
  order_code?: string | null;
  total_amount: number;
  status: OrderStatus;
  created_at: string;
  updated_at?: string;
  order_items?: AdminOrderItem[];
  order_status_events?: OrderStatusEvent[];
}

export interface OrderListParams {
  search?: string;
  status?: OrderStatus | 'all';
}

export async function listOrders(params: OrderListParams = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.status && params.status !== 'all') query.set('status', params.status);
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return apiRequest<AdminOrder[]>(`/api/orders${suffix}`, { auth: true });
}

export async function updateOrderStatus(id: string, status: OrderStatus, note = '') {
  return apiRequest<AdminOrder>(`/api/orders/${id}/status`, {
    method: 'PATCH',
    auth: true,
    body: JSON.stringify({ status, note }),
  });
}
