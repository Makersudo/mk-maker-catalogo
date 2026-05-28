import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { env, assertSupabaseConfigured } from '../config/env.js';
import { encryptSecret } from '../modules/auth/secretEncryption.js';
import { buildTotpUri, generateTotpSecret } from '../modules/auth/totp.js';

const SETTING_KEY = 'admin_totp_secret_encrypted';

async function main() {
  assertSupabaseConfigured();

  if (!env.jwtSecret) {
    throw new Error('JWT_SECRET nao configurado para criptografar o segredo TOTP.');
  }

  const secret = generateTotpSecret();
  const issuer = process.env.TOTP_ISSUER || 'MK MAKER';
  const accountName = process.env.TOTP_ACCOUNT_NAME || env.adminEmail || 'admin@mk-maker';
  const uri = buildTotpUri({ issuer, accountName, secret });
  const supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error } = await supabase.from('settings').upsert({
    key: SETTING_KEY,
    value: encryptSecret(secret, env.jwtSecret),
    is_public: false,
  }, { onConflict: 'key' });

  if (error) {
    throw error;
  }

  const output = [
    'MK MAKER Google Authenticator setup',
    '',
    'Use "Enter a setup key" in Google Authenticator.',
    `Account: ${accountName}`,
    `Issuer: ${issuer}`,
    `Setup key: ${secret}`,
    '',
    'Or scan/import this otpauth URI if your authenticator supports it:',
    uri,
    '',
    'Keep this file private. After enrolling the app, delete this file or store it in a password manager.',
  ].join('\n');

  const outputPath = process.env.TOTP_SETUP_OUTPUT_PATH;
  if (outputPath) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, output, { encoding: 'utf8', flag: 'w', mode: 0o600 });
    console.log(`Segredo TOTP gravado no Supabase. Arquivo local de configuracao: ${outputPath}`);
    return;
  }

  console.log(output);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
