import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveCheckoutWhatsappPhone } from './checkoutSettings.js';

describe('checkout settings', () => {
  it('uses the merged catalog settings whatsapp phone for checkout links', () => {
    assert.equal(
      resolveCheckoutWhatsappPhone({
        store_name: 'MK MAKER',
        whatsapp_phone: ' 5511999999999 ',
      }),
      '5511999999999'
    );
  });

  it('returns an empty phone when no whatsapp is configured', () => {
    assert.equal(resolveCheckoutWhatsappPhone({ store_name: 'MK MAKER' }), '');
  });
});
