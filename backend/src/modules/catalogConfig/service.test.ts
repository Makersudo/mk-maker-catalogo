import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ApiError } from '../../lib/http.js';
import {
  assertCatalogLimit,
  mapCatalogConfig,
  mapPublicSettingsToCatalogConfigRow,
  mergeCatalogSettings,
  normalizeCheckoutMode,
} from './service.js';

describe('catalog config service', () => {
  it('maps database config to public settings contract', () => {
    const config = mapCatalogConfig({
      store_name: 'Bella Fit',
      store_slug: 'bella-fit',
      logo_url: 'https://cdn.example.com/logo.png',
      banner_url: 'https://cdn.example.com/banner.png',
      primary_color: '#e91e63',
      secondary_color: '#111827',
      whatsapp_phone: '5511999999999',
      checkout_mode: 'whatsapp',
      plan_code: 'basic',
      max_products: 80,
      max_categories: 8,
      max_subcategories: 30,
      is_active: true,
    });

    assert.deepEqual(config, {
      store_name: 'Bella Fit',
      store_slug: 'bella-fit',
      store_logo: 'https://cdn.example.com/logo.png',
      store_banner: 'https://cdn.example.com/banner.png',
      store_primary_color: '#e91e63',
      store_secondary_color: '#111827',
      whatsapp_phone: '5511999999999',
      checkout_mode: 'whatsapp',
      store_plan: 'basic',
      max_products: '80',
      max_categories: '8',
      max_subcategories: '30',
      store_active: 'true',
    });
  });

  it('lets catalog config override legacy settings values', () => {
    assert.deepEqual(
      mergeCatalogSettings(
        { store_name: 'Legacy', whatsapp_phone: '111' },
        { store_name: 'Config', checkout_mode: 'whatsapp', store_active: 'true' }
      ),
      { store_name: 'Config', whatsapp_phone: '111', checkout_mode: 'whatsapp', store_active: 'true' }
    );
  });

  it('normalizes unsupported checkout modes to whatsapp', () => {
    assert.equal(normalizeCheckoutMode('internal_order'), 'internal_order');
    assert.equal(normalizeCheckoutMode('external_link'), 'external_link');
    assert.equal(normalizeCheckoutMode('unknown'), 'whatsapp');
  });

  it('maps editable public settings back to the catalog config row', () => {
    assert.deepEqual(
      mapPublicSettingsToCatalogConfigRow([
        { key: 'store_name', value: 'MK MAKER', is_public: true },
        { key: 'store_slug', value: 'mk-maker', is_public: true },
        { key: 'store_logo', value: 'https://cdn.example.com/logo.png', is_public: true },
        { key: 'store_banner', value: '', is_public: true },
        { key: 'store_primary_color', value: '#C98F86', is_public: true },
        { key: 'store_secondary_color', value: '#111111', is_public: true },
        { key: 'whatsapp_phone', value: '5511999999999', is_public: true },
      ]),
      {
        id: true,
        store_name: 'MK MAKER',
        store_slug: 'mk-maker',
        logo_url: 'https://cdn.example.com/logo.png',
        banner_url: null,
        primary_color: '#c98f86',
        secondary_color: '#111111',
        whatsapp_phone: '5511999999999',
      }
    );
  });

  it('rejects writes above configured catalog limits', async () => {
    const supabase = {
      from(table: string) {
        return {
          select(_columns: string, options?: { count?: string; head?: boolean }) {
            assert.equal(options?.count, 'exact');
            assert.equal(options?.head, true);
            return this;
          },
          is(field: string, value: unknown) {
            assert.equal(table, 'categories');
            assert.equal(field, 'parent_id');
            assert.equal(value, null);
            return { count: 3, error: null };
          },
        };
      },
    };

    await assert.rejects(
      () => assertCatalogLimit(supabase, {
        resource: 'categories',
        limit: 3,
      }),
      (error) => error instanceof ApiError && error.status === 409
    );
  });
});
