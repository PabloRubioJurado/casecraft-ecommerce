'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '../../lib/prisma';
import { getCurrentUser, requireUser } from '../../lib/auth';
import { checkStock } from '../../lib/cart';
import type { FormState } from '../../types/forms';

function refresh() {
  // la cabecera (contador del carrito) está en el layout raíz
  revalidatePath('/', 'layout');
}

export async function addToCartAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const productId = Number(formData.get('productId'));
  if (!Number.isInteger(productId) || productId < 1) return { error: 'Product not found.' };

  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/products/${productId}`)}`);

  // El stock y el precio se leen SIEMPRE de la base de datos, nunca del formulario.
  const product = await prisma.product.findFirst({
    where: { id: productId, active: true },
    select: { id: true, stock: true },
  });
  if (!product) return { error: 'This case is no longer available.' };

  const cart = await prisma.cart.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id } });
  const existing = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
    select: { quantity: true },
  });

  const check = checkStock({ requested: formData.get('quantity'), inCart: existing?.quantity ?? 0, stock: product.stock });
  if (!check.ok) return { error: check.error };

  await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId } },
    update: { quantity: check.quantity },
    create: { cartId: cart.id, productId, quantity: check.quantity },
  });
  refresh();
  return { success: 'Added to your cart.' };
}

export async function updateCartItemAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser('/cart');
  const productId = Number(formData.get('productId'));
  if (!Number.isInteger(productId)) return { error: 'Product not found.' };

  const product = await prisma.product.findFirst({
    where: { id: productId, active: true },
    select: { stock: true },
  });
  if (!product) return { error: 'This case is no longer available. Remove it from your cart.' };

  // Aquí la cantidad es la final de la línea, no se suma a lo que ya hay.
  const check = checkStock({ requested: formData.get('quantity'), stock: product.stock });
  if (!check.ok) return { error: check.error };

  // El filtro por cart.userId garantiza que solo se edita el carrito de la sesión actual.
  await prisma.cartItem.updateMany({
    where: { productId, cart: { userId: user.id } },
    data: { quantity: check.quantity },
  });
  refresh();
  return undefined;
}

export async function removeCartItemAction(formData: FormData) {
  const user = await requireUser('/cart');
  const productId = Number(formData.get('productId'));
  if (!Number.isInteger(productId)) return;

  await prisma.cartItem.deleteMany({ where: { productId, cart: { userId: user.id } } });
  refresh();
}
