import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { mapPublicCategory } from './mapper.js';

describe('public category mapper', () => {
  it('removes operational timestamps from public categories', () => {
    const category = mapPublicCategory({
      id: 'category-id',
      name: 'Pele',
      slug: 'pele',
      parent_id: null,
      sort_order: 1,
      is_active: true,
      created_at: '2026-06-07T00:00:00.000Z',
      updated_at: '2026-06-07T00:00:00.000Z',
    });

    assert.equal('created_at' in category, false);
    assert.equal('updated_at' in category, false);
  });
});
