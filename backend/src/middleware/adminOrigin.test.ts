import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { assertTrustedAdminOrigin } from './adminOrigin.js';
import { ApiError } from '../lib/http.js';

const allowedOrigins = ['https://mk-maker-catalogo.vercel.app', 'https://mk-maker.vercel.app'];

describe('assertTrustedAdminOrigin', () => {
  it('rejects unsafe cookie-authenticated admin requests from untrusted origins', () => {
    assert.throws(
      () => assertTrustedAdminOrigin({
        method: 'POST',
        headers: {
          cookie: 'mk_maker_admin_session=session',
          origin: 'https://evil.example',
          'x-admin-request': 'true',
        },
      }, allowedOrigins),
      (error) => error instanceof ApiError && error.status === 403
    );
  });

  it('rejects unsafe cookie-authenticated admin requests without an origin', () => {
    assert.throws(
      () => assertTrustedAdminOrigin({
        method: 'DELETE',
        headers: {
          cookie: 'mk_maker_admin_session=session',
          'x-admin-request': 'true',
        },
      }, allowedOrigins),
      (error) => error instanceof ApiError && error.status === 403
    );
  });

  it('allows trusted browser origins and non-browser authorization clients', () => {
    assert.doesNotThrow(() => assertTrustedAdminOrigin({
      method: 'PATCH',
      headers: {
        cookie: 'mk_maker_admin_session=session',
        origin: 'https://mk-maker-catalogo.vercel.app',
        'x-admin-request': 'true',
      },
    }, allowedOrigins));

    assert.doesNotThrow(() => assertTrustedAdminOrigin({
      method: 'PATCH',
      headers: {
        authorization: 'Bearer session',
        'x-admin-request': 'true',
      },
    }, allowedOrigins));
  });
});
