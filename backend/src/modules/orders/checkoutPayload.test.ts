import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ApiError } from '../../lib/http.js';
import { parseCheckoutPayload } from './checkoutPayload.js';

function validPayload() {
  return {
    customer: {
      fullName: 'Cliente Teste',
      phone: '+55 (11) 99999-9999',
      fulfillmentType: 'pickup',
      paymentMethod: 'pix',
    },
    items: [
      { productId: '9ce71934-d5cc-48f9-a4c8-c94a91e27a0c', quantity: 2 },
    ],
  };
}

describe('checkout payload limits', () => {
  it('normalizes a valid checkout and creates unique product ids', () => {
    const result = parseCheckoutPayload({
      ...validPayload(),
      items: [
        { productId: '9ce71934-d5cc-48f9-a4c8-c94a91e27a0c', quantity: 1 },
        {
          productId: '9ce71934-d5cc-48f9-a4c8-c94a91e27a0c',
          variantId: '9ce71934-d5cc-48f9-a4c8-c94a91e27a0d',
          quantity: 2,
        },
      ],
    });

    assert.deepEqual(result.productIds, ['9ce71934-d5cc-48f9-a4c8-c94a91e27a0c']);
    assert.equal(result.customer.phone, '5511999999999');
    assert.equal(result.items[1].quantity, 2);
  });

  it('rejects oversized carts and unsafe quantities', () => {
    assert.throws(
      () => parseCheckoutPayload({
        ...validPayload(),
        items: Array.from({ length: 41 }, () => validPayload().items[0]),
      }),
      (error) => error instanceof ApiError && error.status === 400
    );

    assert.throws(
      () => parseCheckoutPayload({
        ...validPayload(),
        items: [{ ...validPayload().items[0], quantity: 100 }],
      }),
      /Quantidade invalida/
    );
  });

  it('rejects excessive customer fields and invalid identifiers', () => {
    assert.throws(
      () => parseCheckoutPayload({
        ...validPayload(),
        customer: { ...validPayload().customer, fullName: 'A'.repeat(121) },
      }),
      /fullName excede/
    );

    assert.throws(
      () => parseCheckoutPayload({
        ...validPayload(),
        items: [{ productId: 'not-an-id', quantity: 1 }],
      }),
      /productId invalido/
    );
  });
});
