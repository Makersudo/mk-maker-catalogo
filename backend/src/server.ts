import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { handleError, ok } from './lib/http.js';
import { getSupabaseAdmin } from './lib/supabase.js';
import { authRouter } from './modules/auth/routes.js';
import { catalogRouter } from './modules/catalog/routes.js';
import { categoryRouter } from './modules/categories/routes.js';
import { productRouter } from './modules/products/routes.js';
import { mediaRouter } from './modules/media/routes.js';
import { orderRouter } from './modules/orders/routes.js';
import { marketingRouter } from './modules/marketing/routes.js';
import { dashboardRouter } from './modules/dashboard/routes.js';
import { settingsRouter } from './modules/settings/routes.js';
import { mobileRouter } from './modules/mobile/routes.js';
import { rateLimit } from './middleware/rateLimit.js';
import { securityHeaders } from './middleware/securityHeaders.js';
import { rejectDangerousJson } from './middleware/jsonGuard.js';

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(securityHeaders);
app.use(cors({
  origin(origin, callback) {
    if (!origin || env.corsOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Origem nao autorizada pelo CORS.'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Gate-Token', 'X-Admin-Request', 'X-Admin-Client'],
  maxAge: 600,
}));
app.use(rateLimit({
  keyPrefix: 'api',
  windowMs: env.rateLimitWindowMs,
  max: env.rateLimitMaxRequests,
}));
app.use(express.json({ limit: '25mb' }));
app.use(rejectDangerousJson);

app.get('/api/health', (_req, res) => {
  let databaseConfigured = false;
  try {
    getSupabaseAdmin();
    databaseConfigured = true;
  } catch {
    databaseConfigured = false;
  }

  return ok(res, {
    status: 'ok',
    service: 'mk-maker-backend',
    databaseConfigured,
  });
});

app.use('/api/auth', authRouter);
app.use('/api/catalog', catalogRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/products', productRouter);
app.use('/api/media', mediaRouter);
app.use('/api/orders', orderRouter);
app.use('/api/marketing', marketingRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/mobile', mobileRouter);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  return handleError(res, error);
});

app.listen(env.port, '0.0.0.0', () => {
  console.log(`MK MAKER backend listening on port ${env.port}`);
});
