import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import type { Metadata } from 'next';
import type { OrderStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { requireUser } from '../../lib/auth';
import { getCategoryMeta } from '../../lib/categories';
import { formatPrice } from '../../lib/format';
import CaseArt from '../../components/CaseArt';
import { redirect } from 'next/navigation';

export const metadata: Metadata = { title: 'Your orders' };

const STATUS_STYLES: Record<OrderStatus, { label: string; className: string }> = {
  New: { label: 'New · Unpaid', className: 'bg-amber-100 text-amber-800' },
  Paid: { label: 'Paid', className: 'bg-green-100 text-green-800' },
  Shipped: { label: 'Shipped', className: 'bg-blue-100 text-blue-800' },
  Delivered: { label: 'Delivered', className: 'bg-emerald-100 text-emerald-800' },
  Cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800' },
};

async function cancelUnpaidOrderAction(formData: FormData) {
  'use server';
  const user = await requireUser('/orders');
  if (user.role === 'ADMIN') redirect('/admin/orders');
  const orderId = Number(formData.get('orderId'));

  await prisma.order.updateMany({
    where: {
      id: orderId,
      userId: user.id,
      status: 'New',
    },
    data: {
      status: 'Cancelled',
    },
  });

  revalidatePath('/orders');
}

export default async function OrdersPage() {
  const user = await requireUser('/orders');

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: {
      items: {
        include: {
          product: { include: { category: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (orders.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">No orders yet</h1>
        <p className="mt-2 text-muted">
          Once you complete a purchase, your order number and items will appear here.
        </p>
        <Link
          href="/products"
          className="mt-6 inline-block rounded-full bg-cobalt px-6 py-3 font-semibold text-white transition hover:bg-cobalt-dark"
        >
          Browse all cases
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Your orders</h1>
      <p className="mt-1 text-sm text-muted">Track your order numbers, dates, and purchased cases.</p>

      <div className="mt-8 space-y-6">
        {orders.map((order) => {
          const orderNumber = `#CC-${String(order.id).padStart(5, '0')}`;
          const formattedDate = new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }).format(order.createdAt);
          const badge = STATUS_STYLES[order.status];

          return (
            <article key={order.id} className="overflow-hidden rounded-2xl bg-white ring-1 ring-line">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line bg-gray-50/70 px-6 py-4 text-sm">
                <div className="flex flex-wrap gap-6">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted">Order number</p>
                    <p className="mt-0.5 font-mono font-bold text-gray-900">{orderNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted">Date placed</p>
                    <p className="mt-0.5 font-medium text-gray-900">{formattedDate}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted">Total</p>
                    <p className="mt-0.5 font-bold text-gray-900">{formatPrice(Number(order.total))}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}>
                    {badge.label}
                  </span>

                  {order.status === 'New' && (
                    <form action={cancelUnpaidOrderAction}>
                      <input type="hidden" name="orderId" value={order.id} />
                      <button
                        type="submit"
                        className="rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-gray-700 transition hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                    </form>
                  )}
                </div>
              </div>

              <ul className="divide-y divide-line px-6">
                {order.items.map((item) => {
                  const meta = getCategoryMeta(item.product.category.name);
                  const unitPrice = Number(item.unitPrice);

                  return (
                    <li key={item.id} className="flex items-center gap-4 py-4">
                      <div className="relative h-20 w-14 shrink-0 rounded-xl" style={{ background: meta.tint }}>
                        <CaseArt kind={meta.key} seed={item.product.id} className="absolute inset-[10%]" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/products/${item.productId}`}
                          className="font-display font-bold text-gray-900 hover:underline"
                        >
                          {item.productName}
                        </Link>
                        <p className="mt-0.5 text-sm text-muted">
                          Qty: {item.quantity} · {formatPrice(unitPrice)} each
                        </p>
                      </div>

                      <p className="font-bold text-gray-900">
                        {formatPrice(unitPrice * item.quantity)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </article>
          );
        })}
      </div>
    </div>
  );
}