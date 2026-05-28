import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CSRF_HEADER,
  SESSION_COOKIE_NAME,
  buildLoginResponse,
  extractSessionToken,
  isUnsafeAuthenticatedRequest,
  serializeLogoutCookie,
  serializeSessionCookie,
  shouldReturnSessionTokenInBody,
} from './sessionCookie.js';

describe('admin session cookies', () => {
  it('serializes production sessions as HttpOnly secure cross-site cookies', () => {
    const cookie = serializeSessionCookie('token-value', 'production');

    assert.match(cookie, new RegExp(`^${SESSION_COOKIE_NAME}=token-value;`));
    assert.match(cookie, /HttpOnly/);
    assert.match(cookie, /Secure/);
    assert.match(cookie, /SameSite=None/);
    assert.match(cookie, /Max-Age=28800/);
  });

  it('clears the admin session cookie', () => {
    const cookie = serializeLogoutCookie('production');

    assert.match(cookie, new RegExp(`^${SESSION_COOKIE_NAME}=;`));
    assert.match(cookie, /Max-Age=0/);
  });

  it('extracts session token from cookie before authorization fallback', () => {
    const token = extractSessionToken({
      headers: {
        cookie: `other=1; ${SESSION_COOKIE_NAME}=cookie-token`,
        authorization: 'Bearer header-token',
      },
    });

    assert.equal(token, 'cookie-token');
  });

  it('falls back to authorization header for backwards compatibility', () => {
    const token = extractSessionToken({
      headers: {
        authorization: 'Bearer header-token',
      },
    });

    assert.equal(token, 'header-token');
  });

  it('requires an admin request header on unsafe authenticated methods', () => {
    assert.equal(isUnsafeAuthenticatedRequest({ method: 'GET', headers: {} }), false);
    assert.equal(isUnsafeAuthenticatedRequest({ method: 'POST', headers: {} }), true);
    assert.equal(isUnsafeAuthenticatedRequest({ method: 'DELETE', headers: { [CSRF_HEADER]: 'true' } }), false);
  });

  it('returns the raw session token only for explicit mobile admin clients', () => {
    const webRequest = { headers: {} };
    const mobileRequest = { headers: { 'x-admin-client': 'mobile' } };

    assert.equal(shouldReturnSessionTokenInBody(webRequest), false);
    assert.equal(shouldReturnSessionTokenInBody(mobileRequest), true);
    assert.deepEqual(buildLoginResponse('admin@mk-maker.local', 'session-token', webRequest), {
      user: {
        id: 'admin',
        email: 'admin@mk-maker.local',
      },
    });
    assert.deepEqual(buildLoginResponse('admin@mk-maker.local', 'session-token', mobileRequest), {
      user: {
        id: 'admin',
        email: 'admin@mk-maker.local',
      },
      token: 'session-token',
    });
  });
});
