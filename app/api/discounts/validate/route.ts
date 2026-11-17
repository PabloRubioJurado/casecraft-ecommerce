import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getCurrentUser } from '../../../../lib/auth';

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const body = await req.json();
  const code = String(body.code || '')
    .trim()
    .toUpperCase();

  if (!code) {
    return NextResponse.json({ error: 'Please enter a discount code' }, { status: 400 });
  }

  const discount = await prisma.discountCode.findUnique({ where: { code } });
  if (!discount || !discount.active) {
    return NextResponse.json({ error: 'Invalid or inactive discount code' }, { status: 400 });
  }

  if (discount.expiresAt && discount.expiresAt < new Date()) {
    return NextResponse.json({ error: 'This discount code has expired' }, { status: 400 });
  }

  if (discount.maxUses !== null && discount.usedCount >= discount.maxUses) {
    return NextResponse.json({ error: 'This discount code has reached its usage limit' }, { status: 400 });
  }

  const cart = await prisma.cart.findUnique({
    where: { userId: user.id },
    include: { items: { include: { product: true } } },
  });

  const subtotal =
    cart?.items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0) ?? 0;

  const rawDiscount =
    discount.type === 'PERCENTAGE'
      ? (subtotal * Number(discount.value)) / 100
      : Number(discount.value);

  const discountAmount = Number(Math.min(subtotal, Math.max(0, rawDiscount)).toFixed(2));

  return NextResponse.json({
    code: discount.code,
    type: discount.type,
    value: Number(discount.value),
    discountAmount,
  });
}