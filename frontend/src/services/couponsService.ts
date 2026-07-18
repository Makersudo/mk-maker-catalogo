import { apiRequest } from './apiClient';

export interface Coupon {
  id: string;
  code: string;
  description?: string | null;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  min_order_value: number;
  max_uses?: number | null;
  uses_count: number;
  expires_at?: string | null;
  is_active: boolean;
  campaign_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CouponPayload {
  code: string;
  description?: string | null;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  min_order_value: number;
  max_uses?: number | null;
  expires_at?: string | null;
  is_active: boolean;
  campaign_id?: string | null;
}

export interface CouponValidation {
  id: string;
  code: string;
  description?: string | null;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  discount_amount: number;
  min_order_value: number;
}

// Public
export async function validateCoupon(code: string, orderTotal: number): Promise<CouponValidation> {
  return apiRequest<CouponValidation>('/api/coupons/validate', {
    method: 'POST', body: JSON.stringify({ code, orderTotal }),
  });
}

export async function useCoupon(id: string): Promise<void> {
  await apiRequest<void>(`/api/coupons/use/${id}`, { method: 'POST' });
}

// Admin
export async function listCoupons(): Promise<Coupon[]> {
  return apiRequest<Coupon[]>('/api/coupons/admin', { auth: true });
}

export async function createCoupon(payload: CouponPayload): Promise<Coupon> {
  return apiRequest<Coupon>('/api/coupons/admin', {
    method: 'POST', body: JSON.stringify(payload), auth: true,
  });
}

export async function updateCoupon(id: string, payload: CouponPayload): Promise<Coupon> {
  return apiRequest<Coupon>(`/api/coupons/admin/${id}`, {
    method: 'PUT', body: JSON.stringify(payload), auth: true,
  });
}

export async function toggleCoupon(id: string): Promise<Coupon> {
  return apiRequest<Coupon>(`/api/coupons/admin/${id}/toggle`, {
    method: 'PATCH', auth: true,
  });
}

export async function deleteCoupon(id: string): Promise<void> {
  await apiRequest<void>(`/api/coupons/admin/${id}`, { method: 'DELETE', auth: true });
}
