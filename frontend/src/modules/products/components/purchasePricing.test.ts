import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { calculateSuggestedSalePrice } from './purchasePricing';

describe('calculateSuggestedSalePrice', () => {
  it('suggests sale price from purchase cost and markup percentage', () => {
    assert.equal(calculateSuggestedSalePrice(20, 80), 36);
    assert.equal(calculateSuggestedSalePrice(12.345, 50), 18.52);
  });

  it('returns zero for invalid or negative inputs', () => {
    assert.equal(calculateSuggestedSalePrice(Number.NaN, 80), 0);
    assert.equal(calculateSuggestedSalePrice(20, -10), 0);
    assert.equal(calculateSuggestedSalePrice(-20, 80), 0);
  });
});
