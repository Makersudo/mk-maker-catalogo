import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { calculateCampaignPrice, selectActiveCampaignForProduct } from './campaignRules.js';

describe('campaign rules', () => {
  it('calculates percent, fixed and override campaign prices', () => {
    assert.equal(calculateCampaignPrice(100, 'percent', 15), 85);
    assert.equal(calculateCampaignPrice(100, 'fixed', 12.5), 87.5);
    assert.equal(calculateCampaignPrice(100, 'override_price', 79.9), 79.9);
    assert.equal(calculateCampaignPrice(100, 'none', 50), 100);
    assert.equal(calculateCampaignPrice(20, 'fixed', 50), 0);
  });

  it('selects the highest priority active campaign for a product', () => {
    const selected = selectActiveCampaignForProduct(
      'prod-1',
      120,
      [
        {
          id: 'campaign-low',
          name: 'Oferta baixa',
          badge_label: 'OFERTA',
          status: 'active',
          is_active: true,
          starts_at: '2026-06-01T08:00:00.000Z',
          ends_at: '2026-06-01T20:00:00.000Z',
          priority: 1,
          discount_type: 'percent',
          discount_value: 10,
          marketing_campaign_products: [{ product_id: 'prod-1', campaign_price: null, sort_order: 0 }],
        },
        {
          id: 'campaign-high',
          name: 'Oferta principal',
          badge_label: 'RELAMPAGO',
          status: 'active',
          is_active: true,
          starts_at: '2026-06-01T08:00:00.000Z',
          ends_at: '2026-06-01T18:00:00.000Z',
          priority: 10,
          discount_type: 'fixed',
          discount_value: 30,
          marketing_campaign_products: [{ product_id: 'prod-1', campaign_price: null, sort_order: 0 }],
        },
      ],
      new Date('2026-06-01T12:00:00.000Z'),
    );

    assert.equal(selected?.id, 'campaign-high');
    assert.equal(selected?.finalPrice, 90);
    assert.equal(selected?.badgeLabel, 'RELAMPAGO');
  });

  it('exposes campaign type and product sort order for public catalog focus', () => {
    const selected = selectActiveCampaignForProduct(
      'prod-focus',
      150,
      [
        {
          id: 'campaign-featured',
          name: 'Destaques Pele',
          type: 'featured',
          badge_label: 'DESTAQUE',
          status: 'active',
          is_active: true,
          starts_at: '2026-06-01T08:00:00.000Z',
          ends_at: '2026-06-01T20:00:00.000Z',
          priority: 7,
          discount_type: 'none',
          discount_value: 0,
          marketing_campaign_products: [{ product_id: 'prod-focus', campaign_price: null, sort_order: 3 }],
        },
      ],
      new Date('2026-06-01T12:00:00.000Z'),
    );

    assert.equal(selected?.type, 'featured');
    assert.equal(selected?.sortOrder, 3);
    assert.equal(selected?.isHighlight, true);
  });

  it('ignores expired, paused and unrelated campaigns', () => {
    const selected = selectActiveCampaignForProduct(
      'prod-1',
      80,
      [
        {
          id: 'expired',
          name: 'Expirada',
          badge_label: 'OFF',
          status: 'active',
          is_active: true,
          starts_at: '2026-05-01T00:00:00.000Z',
          ends_at: '2026-05-02T00:00:00.000Z',
          priority: 99,
          discount_type: 'percent',
          discount_value: 90,
          marketing_campaign_products: [{ product_id: 'prod-1', campaign_price: null, sort_order: 0 }],
        },
        {
          id: 'paused',
          name: 'Pausada',
          badge_label: 'OFF',
          status: 'paused',
          is_active: true,
          starts_at: '2026-06-01T00:00:00.000Z',
          ends_at: '2026-06-02T00:00:00.000Z',
          priority: 99,
          discount_type: 'percent',
          discount_value: 90,
          marketing_campaign_products: [{ product_id: 'prod-1', campaign_price: null, sort_order: 0 }],
        },
        {
          id: 'other-product',
          name: 'Outro produto',
          badge_label: 'OFF',
          status: 'active',
          is_active: true,
          starts_at: '2026-06-01T00:00:00.000Z',
          ends_at: '2026-06-02T00:00:00.000Z',
          priority: 99,
          discount_type: 'percent',
          discount_value: 90,
          marketing_campaign_products: [{ product_id: 'prod-2', campaign_price: null, sort_order: 0 }],
        },
      ],
      new Date('2026-06-01T12:00:00.000Z'),
    );

    assert.equal(selected, null);
  });
});
