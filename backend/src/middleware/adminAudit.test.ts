import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildAdminAuditEvent } from './adminAudit.js';

describe('admin audit event', () => {
  it('records operational metadata without request secrets or bodies', () => {
    const event = buildAdminAuditEvent({
      adminEmail: 'admin@mk-maker.local',
      method: 'PATCH',
      path: '/api/products/123?token=secret',
      statusCode: 200,
      ip: '127.0.0.1',
      userAgent: 'test',
    });

    assert.equal(event.path, '/api/products/123');
    assert.equal('body' in event, false);
    assert.equal(JSON.stringify(event).includes('secret'), false);
  });
});
