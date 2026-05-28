import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { generateOrderCode } from './orderCode.js';

describe('generateOrderCode', () => {
  it('creates a readable MK MAKER code with date and six safe characters', () => {
    const code = generateOrderCode(new Date('2026-04-22T12:00:00Z'), () => 'A8K4Q2');

    assert.equal(code, 'MK-20260422-A8K4Q2');
  });

  it('removes unsafe random characters and pads short values', () => {
    const code = generateOrderCode(new Date('2026-04-22T12:00:00Z'), () => 'a!-1');

    assert.equal(code, 'MK-20260422-A10000');
  });
});
