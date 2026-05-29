const PUBLIC_SETTING_WRITE_KEYS = new Set([
  'whatsapp_phone',
  'store_name',
  'store_slug',
  'store_primary_color',
  'store_secondary_color',
  'store_banner',
  'store_logo',
]);

export function normalizePublicSettingsPayload(body: Record<string, unknown>) {
  return Object.entries(body ?? {})
    .filter(([key]) => PUBLIC_SETTING_WRITE_KEYS.has(key))
    .map(([key, value]) => ({
      key,
      value: String(value ?? '').trim(),
      is_public: true,
    }));
}
