'use server';

import { redirect } from 'next/navigation';
import { prisma } from '../../lib/prisma';
import { createSession, destroySession } from '../../lib/auth';
import { getDummyHash, hashPassword, verifyPassword } from '../../lib/password';
import { isValidEmail, normalizeEmail, safeRedirectPath, validatePassword } from '../../lib/validation';
import type { FormState } from '../../types/forms';

const text = (formData: FormData, key: string) => String(formData.get(key) ?? '');

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = text(formData, 'name').trim();
  const email = normalizeEmail(text(formData, 'email'));
  const password = text(formData, 'password');
  const confirm = text(formData, 'confirm');
  const values = { name, email };

  const fieldErrors: Record<string, string> = {};
  if (name.length > 80) fieldErrors.name = 'Name is too long.';
  if (!isValidEmail(email)) fieldErrors.email = 'Enter a valid email address.';
  const passwordError = validatePassword(password);
  if (passwordError) fieldErrors.password = passwordError;
  else if (password !== confirm) fieldErrors.confirm = 'Passwords do not match.';
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors, values };

  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
    return { fieldErrors: { email: 'An account with this email already exists.' }, values };
  }

  let userId: number;
  try {
    const user = await prisma.user.create({
      data: { email, name: name || null, passwordHash: await hashPassword(password) },
      select: { id: true },
    });
    userId = user.id;
  } catch (e) {
    // P2002 = email duplicado por una petición simultánea
    if ((e as { code?: string }).code === 'P2002') {
      return { fieldErrors: { email: 'An account with this email already exists.' }, values };
    }
    throw e;
  }

  await createSession(userId);
  redirect('/account'); // redirect lanza una excepción: debe ir fuera del try/catch
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = normalizeEmail(text(formData, 'email'));
  const password = text(formData, 'password');
  const next = safeRedirectPath(text(formData, 'next'));

  const user = isValidEmail(email)
    ? await prisma.user.findUnique({ where: { email }, select: { id: true, passwordHash: true } })
    : null;

  // Se compara siempre contra un hash, exista o no el usuario.
  const ok = await verifyPassword(password, user?.passwordHash ?? (await getDummyHash()));
  if (!user || !ok) {
    return { error: 'Incorrect email or password.', values: { email } };
  }

  await createSession(user.id);
  redirect(next);
}

export async function logoutAction() {
  await destroySession();
  redirect('/');
}
