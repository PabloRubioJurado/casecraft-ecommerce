'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '../../lib/prisma';
import { requireUser } from '../../lib/auth';
import { validateAddress } from '../../lib/validation';
import type { FormState } from '../../types/forms';

const MAX_ADDRESSES = 10;
const FIELDS = ['fullName', 'line1', 'line2', 'city', 'postalCode', 'country', 'phone'] as const;

export async function addAddressAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();

  const raw: Record<string, string> = {};
  for (const key of FIELDS) raw[key] = String(formData.get(key) ?? '');

  const { value, errors } = validateAddress(raw);
  if (!value) return { fieldErrors: errors, values: raw };

  const count = await prisma.address.count({ where: { userId: user.id } });
  if (count >= MAX_ADDRESSES) {
    return { error: `You can save up to ${MAX_ADDRESSES} addresses.`, values: raw };
  }

  await prisma.address.create({
    data: { ...value, userId: user.id, isDefault: count === 0 }, // la primera es la predeterminada
  });
  revalidatePath('/account');
  return { success: 'Address saved.' };
}

export async function deleteAddressAction(formData: FormData) {
  const user = await requireUser();
  const id = Number(formData.get('id'));
  if (!Number.isInteger(id)) return;

  // deleteMany con userId: solo borra direcciones que son del usuario de la sesión
  await prisma.address.deleteMany({ where: { id, userId: user.id } });

  const remaining = await prisma.address.findMany({ where: { userId: user.id }, orderBy: { id: 'asc' } });
  if (remaining.length > 0 && !remaining.some((a) => a.isDefault)) {
    await prisma.address.update({ where: { id: remaining[0].id }, data: { isDefault: true } });
  }
  revalidatePath('/account');
}

export async function setDefaultAddressAction(formData: FormData) {
  const user = await requireUser();
  const id = Number(formData.get('id'));
  if (!Number.isInteger(id)) return;

  const owned = await prisma.address.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!owned) return;

  await prisma.$transaction([
    prisma.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } }),
    prisma.address.update({ where: { id }, data: { isDefault: true } }),
  ]);
  revalidatePath('/account');
}
