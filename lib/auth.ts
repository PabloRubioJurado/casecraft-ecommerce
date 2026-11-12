import { cache } from 'react';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import type { Role } from '@prisma/client';
import { prisma } from './prisma';
import { SESSION_MAX_AGE_SECONDS, createToken, verifyToken } from './session-token';

const COOKIE_NAME = 'cc_session';

export interface CurrentUser {
  id: number;
  email: string;
  name: string | null;
  role: Role;
}

/** Solo se puede llamar desde Server Actions o Route Handlers (escribe cookies). */
export async function createSession(userId: number) {
  const store = await cookies();
  store.set(COOKIE_NAME, createToken(userId), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/** Usuario de la sesión actual, o null. Una sola consulta por petición. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const userId = verifyToken(token);
  if (!userId) return null;

  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true },
  });
});

/** Exige sesión; si no hay, redirige al login y vuelve después a `next`. */
export async function requireUser(next = '/account'): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

/** RBAC en servidor (A10): los no-admin ven un 404, no se revela que la ruta existe. */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') notFound();
  return user;
}
