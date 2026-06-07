import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ApiError } from '../../lib/http.js';
import { checkoutRequestHash, normalizeIdempotencyKey } from './idempotency.js';

describe('checkout idempotency', () => {
  it('accepts bounded opaque keys and rejects unsafe values', () => {
    assert.equal(normalizeIdempotencyKey(' order-123_abc '), 'order-123_abc');
    assert.equal(normalizeIdempotencyKey(undefined), null);
    assert.throws(
      () => normalizeIdempotencyKey('x'),
      (error) => error instanceof ApiError && error.status === 400
    );
    assert.throws(() => normalizeIdempotencyKey('unsafe key with spaces'), /Idempotency-Key invalido/);
  });

  it('produces the same request hash for equivalent object key order', () => {
    assert.equal(
      checkoutRequestHash({ customer: { phone: '5511', name: 'Ana' }, items: [{ quantity: 1, productId: 'a' }] }),
      checkoutRequestHash({ items: [{ productId: 'a', quantity: 1 }], customer: { name: 'Ana', phone: '5511' } })
    );
  });
});
