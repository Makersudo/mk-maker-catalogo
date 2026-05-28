import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildTotpUri,
  decodeBase32,
  encodeBase32,
  generateTotpCode,
  verifyTotpCode,
} from './totp.js';

describe('TOTP', () => {
  it('encodes and decodes base32 setup secrets', () => {
    const bytes = Buffer.from('12345678901234567890', 'ascii');
    const encoded = encodeBase32(bytes);

    assert.equal(encoded, 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ');
    assert.deepEqual(decodeBase32(encoded), bytes);
  });

  it('generates RFC 6238 compatible codes', () => {
    const secret = encodeBase32(Buffer.from('12345678901234567890', 'ascii'));

    assert.equal(generateTotpCode(secret, new Date(59_000), { digits: 8 }), '94287082');
  });

  it('verifies only the current time window and adjacent drift', () => {
    const secret = encodeBase32(Buffer.from('12345678901234567890', 'ascii'));
    const code = generateTotpCode(secret, new Date(59_000));

    assert.equal(verifyTotpCode(code, secret, new Date(59_000)), true);
    assert.equal(verifyTotpCode(code, secret, new Date(89_000)), true);
    assert.equal(verifyTotpCode(code, secret, new Date(119_000)), false);
  });

  it('builds an otpauth URI for Google Authenticator', () => {
    const uri = buildTotpUri({
      issuer: 'MK MAKER',
      accountName: 'admin@mk-maker.local',
      secret: 'ABCDEF234567',
    });

    assert.equal(uri, 'otpauth://totp/MK%20MAKER:admin%40mk-maker.local?secret=ABCDEF234567&issuer=MK+MAKER&algorithm=SHA1&digits=6&period=30');
  });
});
