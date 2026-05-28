import { apiRequest } from './apiClient';

export interface StoreSettings {
  store_name?: string;
  store_slug?: string;
  whatsapp_phone?: string;
  store_primary_color?: string;
  store_secondary_color?: string;
  store_banner?: string;
  store_logo?: string;
  store_plan?: string;
}

export async function getPublicSettings(): Promise<StoreSettings> {
  return apiRequest<StoreSettings>('/api/settings');
}

export async function saveSettings(settings: StoreSettings): Promise<StoreSettings> {
  return apiRequest<StoreSettings>('/api/settings', {
    method: 'PUT',
    auth: true,
    body: JSON.stringify(settings),
  });
}
