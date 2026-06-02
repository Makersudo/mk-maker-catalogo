export type CampaignDiscountType = 'none' | 'percent' | 'fixed' | 'override_price';

export interface CampaignProductRow {
  product_id: string;
  campaign_price?: number | string | null;
  sort_order?: number | null;
}

export interface CampaignRow {
  id: string;
  name: string;
  type?: string | null;
  badge_label?: string | null;
  status: string;
  is_active?: boolean | null;
  starts_at?: string | null;
  ends_at?: string | null;
  priority?: number | null;
  discount_type?: CampaignDiscountType | string | null;
  discount_value?: number | string | null;
  marketing_campaign_products?: CampaignProductRow[] | null;
  created_at?: string | null;
}

export interface ActiveProductCampaign {
  id: string;
  name: string;
  type: string;
  badgeLabel: string;
  startsAt: string | null;
  endsAt: string | null;
  discountType: CampaignDiscountType;
  discountValue: number;
  originalPrice: number;
  finalPrice: number;
  priority: number;
  sortOrder: number;
  isHighlight: boolean;
}

const ACTIVE_STATUSES = new Set(['active', 'scheduled']);
const DISCOUNT_TYPES = new Set<CampaignDiscountType>(['none', 'percent', 'fixed', 'override_price']);

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toTimestamp(value: string | null | undefined) {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

function normalizeDiscountType(value: unknown): CampaignDiscountType {
  return DISCOUNT_TYPES.has(value as CampaignDiscountType) ? value as CampaignDiscountType : 'none';
}

function roundCurrency(value: number) {
  return Math.round(Math.max(0, value) * 100) / 100;
}

export function calculateCampaignPrice(
  basePrice: number,
  discountType: CampaignDiscountType | string | null | undefined,
  discountValue: number | string | null | undefined
) {
  const price = Math.max(0, toNumber(basePrice));
  const value = Math.max(0, toNumber(discountValue));

  switch (normalizeDiscountType(discountType)) {
    case 'percent':
      return roundCurrency(price * (1 - Math.min(value, 100) / 100));
    case 'fixed':
      return roundCurrency(price - value);
    case 'override_price':
      return roundCurrency(value);
    case 'none':
    default:
      return roundCurrency(price);
  }
}

export function isCampaignActive(campaign: CampaignRow, now = new Date()) {
  if (!campaign.is_active || !ACTIVE_STATUSES.has(String(campaign.status))) return false;

  const currentTime = now.getTime();
  const startsAt = toTimestamp(campaign.starts_at);
  const endsAt = toTimestamp(campaign.ends_at);

  if (startsAt !== null && startsAt > currentTime) return false;
  if (endsAt !== null && endsAt <= currentTime) return false;

  return true;
}

export function selectActiveCampaignForProduct(
  productId: string,
  basePrice: number,
  campaigns: CampaignRow[],
  now = new Date()
): ActiveProductCampaign | null {
  const candidates = campaigns
    .filter((campaign) => isCampaignActive(campaign, now))
    .map((campaign) => {
      const productLink = (campaign.marketing_campaign_products ?? []).find((item) => item.product_id === productId);
      if (!productLink) return null;

      const originalPrice = roundCurrency(basePrice);
      const overridePrice = productLink.campaign_price === null || productLink.campaign_price === undefined
        ? null
        : toNumber(productLink.campaign_price, NaN);
      const discountType = normalizeDiscountType(campaign.discount_type);
      const finalPrice = overridePrice !== null && Number.isFinite(overridePrice)
        ? roundCurrency(overridePrice)
        : calculateCampaignPrice(originalPrice, discountType, campaign.discount_value);

      return {
        id: campaign.id,
        name: campaign.name,
        type: campaign.type || 'promotion',
        badgeLabel: campaign.badge_label || 'OFERTA',
        startsAt: campaign.starts_at ?? null,
        endsAt: campaign.ends_at ?? null,
        discountType,
        discountValue: toNumber(campaign.discount_value),
        originalPrice,
        finalPrice,
        priority: Number(campaign.priority ?? 0),
        sortOrder: Math.max(0, Math.floor(toNumber(productLink.sort_order, 0))),
        isHighlight: true,
        createdAt: toTimestamp(campaign.created_at) ?? 0,
        endsAtSort: toTimestamp(campaign.ends_at) ?? Number.MAX_SAFE_INTEGER,
      };
    })
    .filter((campaign): campaign is ActiveProductCampaign & { createdAt: number; endsAtSort: number } => Boolean(campaign))
    .sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      if (a.endsAtSort !== b.endsAtSort) return a.endsAtSort - b.endsAtSort;
      return b.createdAt - a.createdAt;
    });

  const selected = candidates[0];
  if (!selected) return null;

  return {
    id: selected.id,
    name: selected.name,
    type: selected.type,
    badgeLabel: selected.badgeLabel,
    startsAt: selected.startsAt,
    endsAt: selected.endsAt,
    discountType: selected.discountType,
    discountValue: selected.discountValue,
    originalPrice: selected.originalPrice,
    finalPrice: selected.finalPrice,
    priority: selected.priority,
    sortOrder: selected.sortOrder,
    isHighlight: selected.isHighlight,
  };
}
