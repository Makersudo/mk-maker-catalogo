import crypto from 'crypto';
import { ApiError } from '../../lib/http.js';

const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9._:-]{8,128}$/;

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, stableValue(entry)])
  );
}

export function normalizeIdempotencyKey(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null;
  const normalized = String(value).trim();
  if (!IDEMPOTENCY_KEY_PATTERN.test(normalized)) {
    throw new ApiError(400, 'Idempotency-Key invalido.');
  }
  return normalized;
}

export function checkoutRequestHash(value: unknown): string {
  return crypto.createHash('sha256').update(JSON.stringify(stableValue(value))).digest('hex');
}
