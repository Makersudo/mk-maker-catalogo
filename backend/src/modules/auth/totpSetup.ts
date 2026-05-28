import crypto from 'crypto';
import { ApiError } from '../../lib/http.js';
import { encryptSecret, decryptSecret } from './secretEncryption.js';
import { buildTotpUri, generateTotpSecret, verifyTotpCode } from './totp.js';

export const ADMIN_TOTP_SECRET_KEY = 'admin_totp_secret_encrypted';
export const ADMIN_TOTP_PENDING_SETUP_KEY = 'admin_totp_pending_setup';

const SETUP_TTL_MS = 10 * 60_000;

interface StartSetupOptions {
  jwtSecret: string;
  allowReset: boolean;
  now?: Date;
}

interface ConfirmSetupOptions {
  jwtSecret: string;
  setupToken: string;
  code: string;
  now?: Date;
}

interface PendingTotpSetup {
  encrypted_secret: string;
  setup_token_hash: string;
  expires_at: string;
  created_at: string;
}

export interface AdminTotpSetupResponse {
  setupKey: string;
  setupToken: string;
  otpauthUri: string;
  expiresAt: string;
}

function createSetupToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

export function hashTotpSetupToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function parsePendingSetup(value: string | null | undefined): PendingTotpSetup | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as PendingTotpSetup;
    if (
      typeof parsed.encrypted_secret === 'string'
      && typeof parsed.setup_token_hash === 'string'
      && typeof parsed.expires_at === 'string'
      && typeof parsed.created_at === 'string'
    ) {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}

async function readSettingValue(supabase: any, key: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', key)
    .eq('is_public', false)
    .maybeSingle();

  if (error) {
    throw new ApiError(503, 'Nao foi possivel ler configuracao segura no Supabase.');
  }

  return data?.value ?? null;
}

export async function getAdminTotpSetupStatus(supabase: any): Promise<{ configured: boolean }> {
  return {
    configured: !!(await readSettingValue(supabase, ADMIN_TOTP_SECRET_KEY)),
  };
}

export async function startAdminTotpSetup(
  supabase: any,
  options: StartSetupOptions
): Promise<AdminTotpSetupResponse> {
  const now = options.now ?? new Date();
  const status = await getAdminTotpSetupStatus(supabase);

  if (status.configured && !options.allowReset) {
    throw new ApiError(409, 'Google Authenticator ja configurado.');
  }

  const setupKey = generateTotpSecret();
  const setupToken = createSetupToken();
  const expiresAt = new Date(now.getTime() + SETUP_TTL_MS).toISOString();
  const pending: PendingTotpSetup = {
    encrypted_secret: encryptSecret(setupKey, options.jwtSecret),
    setup_token_hash: hashTotpSetupToken(setupToken),
    expires_at: expiresAt,
    created_at: now.toISOString(),
  };

  const { error } = await supabase.from('settings').upsert({
    key: ADMIN_TOTP_PENDING_SETUP_KEY,
    value: JSON.stringify(pending),
    is_public: false,
  }, { onConflict: 'key' });

  if (error) {
    throw new ApiError(503, 'Nao foi possivel iniciar configuracao do autenticador.');
  }

  return {
    setupKey,
    setupToken,
    otpauthUri: buildTotpUri({
      issuer: 'MK MAKER',
      accountName: 'admin@mk-maker.local',
      secret: setupKey,
    }),
    expiresAt,
  };
}

export async function confirmAdminTotpSetup(supabase: any, options: ConfirmSetupOptions): Promise<void> {
  const now = options.now ?? new Date();
  const pending = parsePendingSetup(await readSettingValue(supabase, ADMIN_TOTP_PENDING_SETUP_KEY));

  if (!pending) {
    throw new ApiError(404, 'Configuracao do autenticador nao iniciada.');
  }

  if (new Date(pending.expires_at).getTime() <= now.getTime()) {
    throw new ApiError(410, 'Configuracao do autenticador expirada.');
  }

  const receivedTokenHash = hashTotpSetupToken(options.setupToken);
  if (!crypto.timingSafeEqual(Buffer.from(receivedTokenHash), Buffer.from(pending.setup_token_hash))) {
    throw new ApiError(401, 'Configuracao do autenticador invalida.');
  }

  const setupKey = decryptSecret(pending.encrypted_secret, options.jwtSecret);
  if (!verifyTotpCode(options.code, setupKey, now)) {
    throw new ApiError(403, 'Codigo autenticador invalido.');
  }

  const { error } = await supabase.from('settings').upsert({
    key: ADMIN_TOTP_SECRET_KEY,
    value: pending.encrypted_secret,
    is_public: false,
  }, { onConflict: 'key' });

  if (error) {
    throw new ApiError(503, 'Nao foi possivel salvar autenticador admin.');
  }

  const { error: deleteError } = await supabase
    .from('settings')
    .delete()
    .eq('key', ADMIN_TOTP_PENDING_SETUP_KEY);

  if (deleteError) {
    throw new ApiError(503, 'Nao foi possivel finalizar configuracao do autenticador.');
  }
}
