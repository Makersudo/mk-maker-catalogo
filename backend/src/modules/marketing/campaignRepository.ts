import type { CampaignRow } from './campaignRules.js';

export const CAMPAIGN_WITH_PRODUCTS_SELECT = '*, marketing_campaign_products(product_id,campaign_price,sort_order)';

function isMissingCampaignSchemaError(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  const code = 'code' in error ? String((error as { code?: unknown }).code ?? '') : '';
  const message = 'message' in error ? String((error as { message?: unknown }).message ?? '') : '';

  return code === '42P01'
    || message.includes('marketing_campaigns')
    || message.includes('marketing_campaign_products');
}

export async function loadCandidateCampaigns(supabase: any): Promise<CampaignRow[]> {
  const { data, error } = await supabase
    .from('marketing_campaigns')
    .select(CAMPAIGN_WITH_PRODUCTS_SELECT)
    .in('status', ['active', 'scheduled'])
    .eq('is_active', true);

  if (error) {
    if (isMissingCampaignSchemaError(error)) return [];
    throw error;
  }

  return ((data ?? []) as unknown) as CampaignRow[];
}
