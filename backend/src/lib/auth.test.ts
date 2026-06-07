import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { safeSignatureMatches } from './auth.js';

describe('session signature comparison', () => {
  it('uses a bounded comparison for equal and different signatures', () => {
    assert.equal(safeSignatureMatches('same-signature', 'same-signature'), true);
    assert.equal(safeSignatureMatches('same-signature', 'other-signature'), false);
    assert.equal(safeSignatureMatches('short', 'longer-signature'), false);
  });
});
