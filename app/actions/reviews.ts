'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '../../lib/prisma';
import { getCurrentUser, requireAdmin } from '../../lib/auth';

export async function submitReviewAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role === 'ADMIN') redirect('/admin/products');

  const productId = Number(formData.get('productId'));
  const rating = Number(formData.get('rating'));
  const comment = String(formData.get('comment') || '').trim();

  if (!Number.isInteger(productId) || productId < 1) return;
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return;
  if (comment.length < 3 || comment.length > 1000) return;

  // Verificación en servidor (B3): solo clientes con pedido confirmado del producto
  const hasPurchased = await prisma.orderItem.findFirst({
    where: {
      productId,
      order: {
        userId: user.id,
        status: { in: ['Paid', 'Shipped', 'Delivered'] },
      },
    },
  });

  if (!hasPurchased) return;

  await prisma.review.upsert({
    where: { userId_productId: { userId: user.id, productId } },
    create: {
      userId: user.id,
      productId,
      rating,
      comment,
      hidden: false,
    },
    update: {
      rating,
      comment,
    },
  });

  revalidatePath(`/products/${productId}`);
  revalidatePath('/products');
  revalidatePath('/admin/reviews');
}

export async function toggleReviewVisibilityAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const reviewId = Number(formData.get('reviewId'));
  if (!Number.isInteger(reviewId) || reviewId < 1) return;

  const existing = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!existing) return;

  await prisma.review.update({
    where: { id: reviewId },
    data: { hidden: !existing.hidden },
  });

  revalidatePath('/admin/reviews');
  revalidatePath(`/products/${existing.productId}`);
  revalidatePath('/products');
}