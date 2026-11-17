'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '../../lib/prisma';
import { requireAdmin } from '../../lib/auth';

export async function createDiscountAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const rawCode = String(formData.get('code') || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
  const type = formData.get('type') === 'FIXED' ? 'FIXED' : 'PERCENTAGE';
  const value = Number(formData.get('value'));
  const expiresAtRaw = String(formData.get('expiresAt') || '').trim();
  const maxUsesRaw = String(formData.get('maxUses') || '').trim();

  if (!rawCode || rawCode.length < 3 || rawCode.length > 32) return;
  if (!Number.isFinite(value) || value <= 0) return;
  if (type === 'PERCENTAGE' && value > 100) return;

  const expiresAt = expiresAtRaw ? new Date(`${expiresAtRaw}T23:59:59.999Z`) : null;
  if (expiresAt && Number.isNaN(expiresAt.getTime())) return;

  const maxUses = maxUsesRaw ? Number.parseInt(maxUsesRaw, 10) : null;
  if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses < 1)) return;

  await prisma.discountCode.upsert({
    where: { code: rawCode },
    create: {
      code: rawCode,
      type,
      value,
      expiresAt,
      maxUses,
      active: true,
    },
    update: {
      type,
      value,
      expiresAt,
      maxUses,
      active: true,
    },
  });

  revalidatePath('/admin/discounts');
}

export async function toggleDiscountActiveAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get('id'));
  if (!Number.isInteger(id) || id < 1) return;

  const existing = await prisma.discountCode.findUnique({ where: { id } });
  if (!existing) return;

  await prisma.discountCode.update({
    where: { id },
    data: { active: !existing.active },
  });

  revalidatePath('/admin/discounts');
}