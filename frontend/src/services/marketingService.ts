import { apiRequest } from './apiClient';

export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'expired';
export type CampaignType = 'promotion' | 'launch' | 'featured' | 'flash';
export type DiscountType = 'none' | 'percent' | 'fixed' | 'override_price';

export interface CampaignProduct {
  product_id: string;
  campaign_price?: number | null;
  sort_order?: number | null;
}

export interface MarketingCampaign {
  id: string;
  name: string;
  slug: string;
  type: CampaignType;
  status: CampaignStatus;
  is_active: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
  discount_type: DiscountType;
  discount_value: number;
  badge_label: string;
  banner_title?: string | null;
  banner_subtitle?: string | null;
  banner_image_url?: string | null;
  priority: number;
  created_at: string;
  updated_at?: string;
  marketing_campaign_products?: CampaignProduct[];
}

export interface CampaignPayload {
  name: string;
  slug?: string;
  type: CampaignType;
  status: CampaignStatus;
  isActive: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  discountType: DiscountType;
  discountValue: number;
  badgeLabel: string;
  bannerTitle?: string | null;
  bannerSubtitle?: string | null;
  bannerImageUrl?: string | null;
  priority: number;
}

export async function listCampaigns() {
  return apiRequest<MarketingCampaign[]>('/api/marketing/campaigns', { auth: true });
}

export async function createCampaign(payload: CampaignPayload) {
  return apiRequest<MarketingCampaign>('/api/marketing/campaigns', {
    method: 'POST',
    auth: true,
    body: JSON.stringify(payload),
  });
}

export async function updateCampaign(id: string, payload: CampaignPayload) {
  return apiRequest<MarketingCampaign>(`/api/marketing/campaigns/${id}`, {
    method: 'PUT',
    auth: true,
    body: JSON.stringify(payload),
  });
}

export async function updateCampaignStatus(id: string, status: CampaignStatus) {
  return apiRequest<MarketingCampaign>(`/api/marketing/campaigns/${id}/status`, {
    method: 'PATCH',
    auth: true,
    body: JSON.stringify({ status }),
  });
}

export async function replaceCampaignProducts(id: string, products: CampaignProduct[]) {
  return apiRequest<MarketingCampaign>(`/api/marketing/campaigns/${id}/products`, {
    method: 'PUT',
    auth: true,
    body: JSON.stringify({
      products: products.map((product, index) => ({
        productId: product.product_id,
        campaignPrice: product.campaign_price ?? null,
        sortOrder: product.sort_order ?? index,
      })),
    }),
  });
}

export async function deleteCampaign(id: string) {
  return apiRequest<{ ok: true }>(`/api/marketing/campaigns/${id}`, {
    method: 'DELETE',
    auth: true,
  });
}
