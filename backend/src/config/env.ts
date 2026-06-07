import dotenv from 'dotenv';

dotenv.config();

const defaultOrigins = ['http://localhost:5173', 'http://localhost:3000'];

function list(value: string | undefined): string[] {
  return value?.split(',').map((item) => item.trim()).filter(Boolean) ?? [];
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  corsOrigins: list(process.env.CORS_ORIGINS).length > 0 ? list(process.env.CORS_ORIGINS) : defaultOrigins,
  supabaseUrl: process.env.SUPABASE_URL ?? '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY ?? '',
  jwtSecret: process.env.JWT_SECRET ?? '',
  adminEmail: process.env.ADMIN_EMAIL ?? '',
  adminPassword: process.env.ADMIN_PASSWORD ?? '',
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH ?? '',
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000),
  rateLimitMaxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 120),
  loginRateLimitWindowMs: Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MS ?? 15 * 60_000),
  loginRateLimitMaxAttempts: Number(process.env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS ?? 5),
  checkoutRateLimitWindowMs: Number(process.env.CHECKOUT_RATE_LIMIT_WINDOW_MS ?? 10 * 60_000),
  checkoutRateLimitMaxRequests: Number(process.env.CHECKOUT_RATE_LIMIT_MAX_REQUESTS ?? 8),
  mediaBucket: process.env.SUPABASE_MEDIA_BUCKET ?? 'mk-maker-media',
  productBucket: process.env.SUPABASE_PRODUCT_BUCKET ?? 'mk-maker-products',
  webPushPublicKey: process.env.WEB_PUSH_PUBLIC_KEY ?? '',
  webPushPrivateKey: process.env.WEB_PUSH_PRIVATE_KEY ?? '',
  webPushSubject: process.env.WEB_PUSH_SUBJECT ?? 'mailto:admin@mk-maker.local',
};

export function assertSupabaseConfigured() {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    throw new Error('Supabase nao configurado no ambiente do backend.');
  }
}
