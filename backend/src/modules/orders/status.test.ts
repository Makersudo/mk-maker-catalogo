import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { matchesOrderSearch, normalizeOrderStatus } from './status.js';

describe('order status rules', () => {
  it('normalizes kanban and legacy labels to stable status codes', () => {
    assert.equal(normalizeOrderStatus('Novo'), 'new');
    assert.equal(normalizeOrderStatus('Em separacao'), 'preparing');
    assert.equal(normalizeOrderStatus('Pronto para retirada'), 'ready_for_pickup');
    assert.equal(normalizeOrderStatus('Entregue'), 'completed');
    assert.equal(normalizeOrderStatus('paid'), 'completed');
  });

  it('rejects unknown statuses', () => {
    assert.equal(normalizeOrderStatus('em analise manual'), null);
  });

  it('matches orders by ticket, customer phone, or customer name', () => {
    const order = {
      order_code: 'MK-20260601-A8K4Q2',
      customer_name: 'Maria Fernanda',
      customer_phone: '(11) 99999-8888',
    };

    assert.equal(matchesOrderSearch(order, 'a8k4'), true);
    assert.equal(matchesOrderSearch(order, '11999998888'), true);
    assert.equal(matchesOrderSearch(order, 'maria fer'), true);
    assert.equal(matchesOrderSearch(order, 'cliente inexistente'), false);
  });
});
