'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '../../lib/prisma';
import { getCurrentUser } from '../../lib/auth';
import { checkStock } from '../../lib/cart';

export async function toggleWishlistAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role === 'ADMIN') redirect('/admin/products');

  const productId = Number(formData.get('productId'));
  if (!Number.isInteger(productId) || productId < 1) return;

  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId: user.id, productId } },
  });

  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
  } else {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.active) return;

    await prisma.wishlistItem.create({
      data: { userId: user.id, productId },
    });
  }

  revalidatePath(`/products/${productId}`);
  revalidatePath('/wishlist');
}

export async function removeWishlistItemAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const productId = Number(formData.get('productId'));
  if (!Number.isInteger(productId) || productId < 1) return;

  await prisma.wishlistItem.deleteMany({
    where: { userId: user.id, productId },
  });

  revalidatePath('/wishlist');
  revalidatePath(`/products/${productId}`);
}

export async function moveWishlistToCartAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role === 'ADMIN') redirect('/admin/products');

  const productId = Number(formData.get('productId'));
  if (!Number.isInteger(productId) || productId < 1) return;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.active || product.stock <= 0) return;

  const cart = await prisma.cart.upsert({
    where: { userId: user.id },
    create: { userId: user.id },
    update: {},
  });

  const existingLine = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
  });

  const stockCheck = checkStock({
    requested: 1,
    inCart: existingLine?.quantity ?? 0,
    stock: product.stock,
  });

  if (!stockCheck.ok) return;

  await prisma.$transaction([
    prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId } },
      create: { cartId: cart.id, productId, quantity: 1 },
      update: { quantity: stockCheck.quantity },
    }),
    prisma.wishlistItem.deleteMany({
      where: { userId: user.id, productId },
    }),
  ]);

  revalidatePath('/wishlist');
  revalidatePath('/cart');
  revalidatePath(`/products/${productId}`);
}