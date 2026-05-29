import { ApiError } from '../../lib/http.js';
import { getSupabaseAdmin } from '../../lib/supabase.js';

export type CheckoutMode = 'whatsapp' | 'internal_order' | 'external_link' | 'pix_whatsapp';
export type CatalogResource = 'products' | 'categories' | 'subcategories';

type CatalogConfigRow = {
  store_name?: unknown;
  store_slug?: unknown;
  logo_url?: unknown;
  banner_url?: unknown;
  primary_color?: unknown;
  secondary_color?: unknown;
  whatsapp_phone?: unknown;
  checkout_mode?: unknown;
  external_checkout_url?: unknown;
  plan_code?: unknown;
  max_products?: unknown;
  max_categories?: unknown;
  max_subcategories?: unknown;
  is_active?: unknown;
};

type PublicSettingEntry = {
  key: string;
  value: string;
  is_public: boolean;
};

const RESOURCE_LABELS: Record<CatalogResource, string> = {
  products: 'produtos',
  categories: 'categorias',
  subcategories: 'subcategorias',
};

const RESOURCE_LIMIT_KEYS: Record<CatalogResource, keyof CatalogConfigRow> = {
  products: 'max_products',
  categories: 'max_categories',
  subcategories: 'max_subcategories',
};

function optionalSetting(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  const normalized = String(value).trim();
  return normalized || undefined;
}

function numberSetting(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? String(parsed) : undefined;
}

function normalizeLimit(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

function nullableTextSetting(value: string): string | null {
  const normalized = String(value ?? '').trim();
  return normalized || null;
}

function normalizeHexSetting(value: string): string {
  return String(value ?? '').trim().toLowerCase();
}

export function normalizeCheckoutMode(value: unknown): CheckoutMode {
  if (value === 'internal_order' || value === 'external_link' || value === 'pix_whatsapp' || value === 'whatsapp') {
    return value;
  }

  return 'whatsapp';
}

export function mapCatalogConfig(row: CatalogConfigRow = {}): Record<string, string> {
  const settings: Record<string, string> = {
    checkout_mode: normalizeCheckoutMode(row.checkout_mode),
    store_active: String(row.is_active !== false),
  };

  const textFields: Array<[string, unknown]> = [
    ['store_name', row.store_name],
    ['store_slug', row.store_slug],
    ['store_logo', row.logo_url],
    ['store_banner', row.banner_url],
    ['store_primary_color', row.primary_color],
    ['store_secondary_color', row.secondary_color],
    ['whatsapp_phone', row.whatsapp_phone],
    ['external_checkout_url', row.external_checkout_url],
    ['store_plan', row.plan_code],
  ];

  for (const [key, value] of textFields) {
    const mapped = optionalSetting(value);
    if (mapped !== undefined) settings[key] = mapped;
  }

  const numberFields: Array<[string, unknown]> = [
    ['max_products', row.max_products],
    ['max_categories', row.max_categories],
    ['max_subcategories', row.max_subcategories],
  ];

  for (const [key, value] of numberFields) {
    const mapped = numberSetting(value);
    if (mapped !== undefined) settings[key] = mapped;
  }

  return settings;
}

export function mapPublicSettingsToCatalogConfigRow(entries: PublicSettingEntry[]): Record<string, unknown> {
  const row: Record<string, unknown> = { id: true };

  for (const entry of entries) {
    if (!entry.is_public) continue;

    switch (entry.key) {
      case 'store_name':
        row.store_name = String(entry.value ?? '').trim();
        break;
      case 'store_slug':
        row.store_slug = String(entry.value ?? '').trim();
        break;
      case 'store_logo':
        row.logo_url = nullableTextSetting(entry.value);
        break;
      case 'store_banner':
        row.banner_url = nullableTextSetting(entry.value);
        break;
      case 'store_primary_color':
        row.primary_color = normalizeHexSetting(entry.value);
        break;
      case 'store_secondary_color':
        row.secondary_color = normalizeHexSetting(entry.value);
        break;
      case 'whatsapp_phone':
        row.whatsapp_phone = nullableTextSetting(entry.value);
        break;
    }
  }

  return row;
}

export async function upsertCatalogConfigFromPublicSettings(
  supabase: any,
  entries: PublicSettingEntry[],
  updatedAt = new Date().toISOString()
) {
  const row = mapPublicSettingsToCatalogConfigRow(entries);
  if (Object.keys(row).length <= 1) return;

  const { error } = await supabase
    .from('catalog_config')
    .upsert({ ...row, updated_at: updatedAt }, { onConflict: 'id' });

  if (error) throw error;
}

export function mergeCatalogSettings(
  legacySettings: Record<string, string>,
  catalogConfigSettings: Record<string, string>
): Record<string, string> {
  return { ...legacySettings, ...catalogConfigSettings };
}

export async function loadCatalogConfig(supabase = getSupabaseAdmin()) {
  const { data, error } = await supabase
    .from('catalog_config')
    .select('*')
    .eq('id', true)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export async function loadCatalogConfigSettings(supabase = getSupabaseAdmin()): Promise<Record<string, string>> {
  const config = await loadCatalogConfig(supabase);
  return config ? mapCatalogConfig(config) : {};
}

export async function loadMergedPublicSettings(supabase = getSupabaseAdmin()): Promise<Record<string, string>> {
  const [{ data, error }, catalogConfig] = await Promise.all([
    supabase.from('settings').select('key,value').eq('is_public', true),
    loadCatalogConfigSettings(supabase),
  ]);

  if (error) throw error;

  const legacySettings = (data ?? []).reduce<Record<string, string>>((acc, row) => {
    acc[row.key] = row.value ?? '';
    return acc;
  }, {});

  return mergeCatalogSettings(legacySettings, catalogConfig);
}

export async function assertCatalogLimit(
  supabase: any,
  options: { resource: CatalogResource; limit?: number | null }
) {
  if (options.limit === null || options.limit === undefined) return;

  let query = supabase
    .from(options.resource === 'products' ? 'products' : 'categories')
    .select('id', { count: 'exact', head: true });

  if (options.resource === 'categories') {
    query = query.is('parent_id', null);
  } else if (options.resource === 'subcategories') {
    query = query.not('parent_id', 'is', null);
  }

  const { count, error } = await query;
  if (error) throw error;

  if ((count ?? 0) >= options.limit) {
    throw new ApiError(409, `Limite de ${RESOURCE_LABELS[options.resource]} atingido.`);
  }
}

export async function assertCatalogResourceLimit(supabase: any, resource: CatalogResource) {
  const config = await loadCatalogConfig(supabase);
  if (!config) return;

  await assertCatalogLimit(supabase, {
    resource,
    limit: normalizeLimit(config[RESOURCE_LIMIT_KEYS[resource]]),
  });
}
