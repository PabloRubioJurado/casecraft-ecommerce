// Token de sesión firmado con HMAC-SHA256 (sin dependencias externas).
// Formato: "<userId>.<expiraEnMs>.<firma>". El rol NO va en el token: se lee de la BD en cada petición.
import { createHmac, timingSafeEqual } from 'node:crypto';

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 días

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('AUTH_SECRET is missing or shorter than 32 characters. Set it in your .env file.');
  }
  if (process.env.NODE_ENV === 'production' && secret.startsWith('replace_with')) {
    throw new Error('AUTH_SECRET still has the example value. Generate a random secret.');
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac('sha256', getSecret()).update(payload).digest('base64url');
}

export function createToken(userId: number, now: number = Date.now()): string {
  const payload = `${userId}.${now + SESSION_MAX_AGE_SECONDS * 1000}`;
  return `${payload}.${sign(payload)}`;
}

/** Devuelve el id de usuario si el token es válido y no ha caducado; si no, null. */
export function verifyToken(token: string, now: number = Date.now()): number | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [id, exp, signature] = parts;

  const expected = Buffer.from(sign(`${id}.${exp}`));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

  const expiresAt = Number(exp);
  if (!Number.isFinite(expiresAt) || expiresAt < now) return null;

  const userId = Number(id);
  return Number.isInteger(userId) && userId > 0 ? userId : null;
}
