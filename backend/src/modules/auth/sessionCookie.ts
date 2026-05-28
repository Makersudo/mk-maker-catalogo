export const SESSION_COOKIE_NAME = 'mk_maker_admin_session';
export const CSRF_HEADER = 'x-admin-request';
export const ADMIN_CLIENT_HEADER = 'x-admin-client';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

interface RequestLike {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
}

function encodeCookieValue(value: string): string {
  return encodeURIComponent(value);
}

function baseCookieAttributes(nodeEnv: string, maxAge: number): string[] {
  const production = nodeEnv === 'production';
  return [
    'Path=/',
    `Max-Age=${maxAge}`,
    'HttpOnly',
    production ? 'SameSite=None' : 'SameSite=Lax',
    ...(production ? ['Secure'] : []),
  ];
}

export function serializeSessionCookie(token: string, nodeEnv: string): string {
  return [
    `${SESSION_COOKIE_NAME}=${encodeCookieValue(token)}`,
    ...baseCookieAttributes(nodeEnv, SESSION_MAX_AGE_SECONDS),
  ].join('; ');
}

export function serializeLogoutCookie(nodeEnv: string): string {
  return [
    `${SESSION_COOKIE_NAME}=`,
    ...baseCookieAttributes(nodeEnv, 0),
  ].join('; ');
}

function firstHeader(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function extractSessionToken(req: RequestLike): string | null {
  const cookie = firstHeader(req.headers.cookie);
  const cookieToken = cookie
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE_NAME}=`))
    ?.slice(SESSION_COOKIE_NAME.length + 1);

  if (cookieToken) {
    return decodeURIComponent(cookieToken);
  }

  return firstHeader(req.headers.authorization)?.replace(/^Bearer\s+/i, '') || null;
}

export function isUnsafeAuthenticatedRequest(req: RequestLike): boolean {
  const method = (req.method ?? 'GET').toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return false;

  const headerValue = firstHeader(req.headers[CSRF_HEADER]);
  return headerValue !== 'true';
}

export function shouldReturnSessionTokenInBody(req: RequestLike): boolean {
  return firstHeader(req.headers[ADMIN_CLIENT_HEADER]) === 'mobile';
}

export function buildLoginResponse(email: string, token: string, req: RequestLike) {
  const response: {
    user: {
      id: 'admin';
      email: string;
    };
    token?: string;
  } = {
    user: {
      id: 'admin',
      email,
    },
  };

  if (shouldReturnSessionTokenInBody(req)) {
    response.token = token;
  }

  return response;
}
