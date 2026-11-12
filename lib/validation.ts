// Validaciones puras (sin Next ni Prisma) para poder probarlas con tests (A12).

export const PASSWORD_MIN = 8;
/** bcrypt solo usa los primeros 72 bytes de la contraseña. */
export const PASSWORD_MAX_BYTES = 72;

export const COUNTRIES = [
  { code: 'ES', name: 'Spain' },
  { code: 'RO', name: 'Romania' },
  { code: 'PT', name: 'Portugal' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'IT', name: 'Italy' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'GB', name: 'United Kingdom' },
] as const;

export function countryName(code: string): string {
  return COUNTRIES.find((c) => c.code === code)?.name ?? code;
}

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Devuelve el mensaje de error, o null si la contraseña es válida. */
export function validatePassword(password: string): string | null {
  if (password.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters.`;
  if (new TextEncoder().encode(password).length > PASSWORD_MAX_BYTES) {
    return `Password is too long (max ${PASSWORD_MAX_BYTES} bytes).`;
  }
  return null;
}

/** Solo permite redirigir a rutas internas (evita open redirect con ?next=https://...). */
export function safeRedirectPath(next: unknown, fallback = '/account'): string {
  if (typeof next !== 'string') return fallback;
  if (!next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback;
  if (/[\u0000-\u001f]/.test(next)) return fallback;
  return next;
}

export interface AddressInput {
  fullName: string;
  line1: string;
  line2: string | null;
  city: string;
  postalCode: string;
  country: string;
  phone: string | null;
}

export function validateAddress(raw: Record<string, string>): {
  value?: AddressInput;
  errors: Record<string, string>;
} {
  const v = (key: string) => (raw[key] ?? '').trim();
  const errors: Record<string, string> = {};

  const fullName = v('fullName');
  const line1 = v('line1');
  const line2 = v('line2');
  const city = v('city');
  const postalCode = v('postalCode');
  const country = v('country').toUpperCase();
  const phone = v('phone');

  if (fullName.length < 2 || fullName.length > 100) errors.fullName = 'Enter the recipient’s full name.';
  if (line1.length < 3 || line1.length > 120) errors.line1 = 'Enter the street and number.';
  if (line2.length > 120) errors.line2 = 'This line is too long.';
  if (city.length < 2 || city.length > 80) errors.city = 'Enter the city.';
  if (!/^[A-Za-z0-9][A-Za-z0-9 -]{1,10}[A-Za-z0-9]$/.test(postalCode)) errors.postalCode = 'Enter a valid postal code.';
  if (!COUNTRIES.some((c) => c.code === country)) errors.country = 'Choose a country from the list.';
  if (phone && !/^[0-9+()\- ]{6,20}$/.test(phone)) errors.phone = 'Enter a valid phone number.';

  if (Object.keys(errors).length > 0) return { errors };
  return {
    errors,
    value: { fullName, line1, line2: line2 || null, city, postalCode, country, phone: phone || null },
  };
}
