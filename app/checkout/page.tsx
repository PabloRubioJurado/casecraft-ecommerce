import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '../../lib/prisma';
import { requireUser } from '../../lib/auth';
import CheckoutForm from './CheckoutForm';

export const metadata: Metadata = { title: 'Checkout' };

export default async function CheckoutPage() {
  const user = await requireUser('/checkout');

  const [cart, addresses] = await Promise.all([
    prisma.cart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: { include: { category: true } },
          },
          orderBy: { id: 'asc' },
        },
      },
    }),
    prisma.address.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: 'desc' }, { id: 'desc' }],
    }),
  ]);

  if (!cart || cart.items.length === 0) {
    redirect('/cart');
  }

  const serializedItems = cart.items.map((item) => ({
    id: item.id,
    productId: item.productId,
    name: item.product.name,
    categoryName: item.product.category.name,
    price: Number(item.product.price),
    quantity: item.quantity,
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/cart" className="text-sm font-medium text-muted hover:text-gray-900">
            ← Back to cart
          </Link>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Checkout
          </h1>
        </div>
      </div>

      <CheckoutForm
        addresses={addresses}
        items={serializedItems}
        defaultName={user.name || ''}
      />
    </div>
  );
}