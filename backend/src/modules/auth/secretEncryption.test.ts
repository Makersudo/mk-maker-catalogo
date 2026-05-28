import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { decryptSecret, encryptSecret } from './secretEncryption.js';

describe('secret encryption', () => {
  it('encrypts reversible secrets without storing plaintext', () => {
    const encrypted = encryptSecret('JBSWY3DPEHPK3PXP', 'jwt-secret-for-tests');

    assert.equal(encrypted.includes('JBSWY3DPEHPK3PXP'), false);
    assert.equal(decryptSecret(encrypted, 'jwt-secret-for-tests'), 'JBSWY3DPEHPK3PXP');
  });

  it('rejects tampered encrypted payloads', () => {
    const encrypted = encryptSecret('JBSWY3DPEHPK3PXP', 'jwt-secret-for-tests');
    const parts = encrypted.split(':');
    const encryptedValue = parts[3] ?? '';
    parts[3] = `${encryptedValue.slice(0, -1)}${encryptedValue.endsWith('A') ? 'B' : 'A'}`;

    assert.throws(() => decryptSecret(parts.join(':'), 'jwt-secret-for-tests'));
  });
});
