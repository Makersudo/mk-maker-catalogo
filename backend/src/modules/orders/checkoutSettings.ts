import { loadMergedPublicSettings } from '../catalogConfig/service.js';

export function resolveCheckoutWhatsappPhone(settings: Record<string, string>): string {
  return String(settings.whatsapp_phone ?? '').trim();
}

export async function loadCheckoutWhatsappPhone(): Promise<string> {
  return resolveCheckoutWhatsappPhone(await loadMergedPublicSettings());
}
