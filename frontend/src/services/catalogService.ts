import { apiRequest } from './apiClient';

export interface PublicCatalogCategory {
  id: string;
  name: string;
  parent_id?: string | null;
  parentId?: string | null;
}

export interface PublicCatalogProduct {
  id: string;
  slug?: string | null;
  title: string;
  description: string;
  price: number;
  campaign?: {
    id: string;
    name: string;
    type: string;
    badgeLabel: string;
    startsAt?: string | null;
    endsAt?: string | null;
    discountType: 'none' | 'percent' | 'fixed' | 'override_price';
    discountValue: number;
    originalPrice: number;
    finalPrice: number;
    priority: number;
    sortOrder: number;
    isHighlight: boolean;
  } | null;
  isFeatured?: boolean;
  isNew?: boolean;
  created_at?: string;
  relevanceScore?: number;
  relevanceUnitsSold?: number;
  relevanceOrderCount?: number;
  categoryId?: string;
  subcategoryId?: string | null;
  categoryName?: string | null;
  subcategoryName?: string | null;
  brandLabel?: string;
  images: string[];
  features?: string[];
  stockQuantity?: number;
  variantsEnabled?: boolean;
  variants?: Array<{
    id: string;
    label: string;
    sku?: string;
    options: Array<{ name: string; value: string }>;
    price?: number | null;
    stockQuantity: number;
    isActive: boolean;
  }>;
}

export interface PublicCatalogBootstrapResponse {
  categories: PublicCatalogCategory[];
  products: PublicCatalogProduct[];
}

let cachedCatalog: {
  expiresAt: number;
  data: PublicCatalogBootstrapResponse;
} | null = null;
let pendingCatalogRequest: Promise<PublicCatalogBootstrapResponse> | null = null;
const CATALOG_CACHE_TTL_MS = 5 * 60 * 1000;
const CATALOG_STORAGE_TTL_MS = 15 * 60 * 1000;
const CATALOG_STORAGE_KEY = 'mk-maker-public-catalog-v2';

function isCatalogPayload(value: unknown): value is PublicCatalogBootstrapResponse {
  if (!value || typeof value !== 'object') return false;
  const payload = value as PublicCatalogBootstrapResponse;
  return Array.isArray(payload.categories) && Array.isArray(payload.products);
}

function readStoredCatalog() {
  try {
    const raw = window.localStorage.getItem(CATALOG_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as { expiresAt?: number; data?: unknown };
    if (!parsed.expiresAt || parsed.expiresAt <= Date.now() || !isCatalogPayload(parsed.data)) {
      window.localStorage.removeItem(CATALOG_STORAGE_KEY);
      return null;
    }

    return {
      expiresAt: parsed.expiresAt,
      data: parsed.data,
    };
  } catch {
    return null;
  }
}

function writeStoredCatalog(data: PublicCatalogBootstrapResponse) {
  try {
    window.localStorage.setItem(
      CATALOG_STORAGE_KEY,
      JSON.stringify({
        data,
        expiresAt: Date.now() + CATALOG_STORAGE_TTL_MS,
      }),
    );
  } catch {
    // Storage can be unavailable in private mode or full devices.
  }
}

export async function getPublicCatalogBootstrap() {
  if (!cachedCatalog) {
    cachedCatalog = readStoredCatalog();
  }

  if (cachedCatalog && cachedCatalog.expiresAt > Date.now()) {
    return cachedCatalog.data;
  }

  if (!pendingCatalogRequest) {
    pendingCatalogRequest = apiRequest<PublicCatalogBootstrapResponse>('/api/catalog/bootstrap')
      .then((data) => {
        cachedCatalog = {
          data,
          expiresAt: Date.now() + CATALOG_CACHE_TTL_MS,
        };
        writeStoredCatalog(data);
        return data;
      })
      .finally(() => {
        pendingCatalogRequest = null;
      });
  }

  return pendingCatalogRequest;
}
