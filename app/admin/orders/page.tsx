import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import type { Metadata } from 'next';
import { OrderStatus } from '@prisma/client';
import { prisma } from '../../../lib/prisma';
import { requireAdmin } from '../../../lib/auth';
import { formatPrice } from '../../../lib/format';

export const metadata: Metadata = { title: 'Admin · Orders' };

const ALL_STATUSES: OrderStatus[] = ['New', 'Paid', 'Shipped', 'Delivered', 'Cancelled'];

const NEXT_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  New: ['Paid', 'Cancelled'],
  Paid: ['Shipped', 'Cancelled'],
  Shipped: ['Delivered', 'Cancelled'],
  Delivered: [],
  Cancelled: [],
};

const STATUS_BADGE: Record<OrderStatus, string> = {
  New: 'bg-amber-100 text-amber-800',
  Paid: 'bg-green-100 text-green-800',
  Shipped: 'bg-blue-100 text-blue-800',
  Delivered: 'bg-emerald-100 text-emerald-800',
  Cancelled: 'bg-red-100 text-red-800',
};

async function updateOrderStatusAction(formData: FormData) {
  'use server';
  await requireAdmin();

  const orderId = Number(formData.get('orderId'));
  const nextStatus = String(formData.get('nextStatus')) as OrderStatus;

  if (!orderId || !ALL_STATUSES.includes(nextStatus)) return;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) return;

  const allowed = NEXT_TRANSITIONS[order.status];
  if (!allowed.includes(nextStatus)) return;

  await prisma.$transaction(async (tx) => {
    // Si pasa de New a Paid manualmente, descontar stock
    if (order.status === 'New' && nextStatus === 'Paid') {
      for (const item of order.items) {
        const updated = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (updated.count === 0) {
          throw new Error(`Not enough stock for ${item.productName}`);
        }
      }
    }

    // Requisito A7: Si se cancela un pedido que ya había descontado stock, restaurarlo
    const hadDeductedStock =
      order.status === 'Paid' || order.status === 'Shipped' || order.status === 'Delivered';

    if (nextStatus === 'Cancelled' && hadDeductedStock) {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }

    await tx.order.update({
      where: { id: order.id },
      data: {
        status: nextStatus,
        ...(nextStatus === 'Paid' && !order.paidAt ? { paidAt: new Date() } : {}),
      },
    });
  });

  revalidatePath('/admin/orders');
  revalidatePath('/orders');
  revalidatePath('/products');
}

interface AdminOrdersPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  await requireAdmin();
  const { status } = await searchParams;

  const selectedFilter =
    status && ALL_STATUSES.includes(status as OrderStatus) ? (status as OrderStatus) : 'ALL';

  const [orders, counts] = await Promise.all([
    prisma.order.findMany({
      where: selectedFilter === 'ALL' ? undefined : { status: selectedFilter },
      include: {
        user: { select: { name: true, email: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.groupBy({
      by: ['status'],
      _count: { _all: true },
    }),
  ]);

  const countMap = new Map<OrderStatus, number>(
    counts.map((c) => [c.status, c._count._all])
  );
  const totalOrders = counts.reduce((acc, c) => acc + c._count._all, 0);

  return (
    <div>
      {/* Filtro por estado */}
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/admin/orders"
          className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
            selectedFilter === 'ALL'
              ? 'bg-ink text-white'
              : 'bg-white text-gray-700 ring-1 ring-line hover:bg-fog'
          }`}
        >
          All ({totalOrders})
        </Link>

        {ALL_STATUSES.map((st) => (
          <Link
            key={st}
            href={`/admin/orders?status=${st}`}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              selectedFilter === st
                ? 'bg-ink text-white'
                : 'bg-white text-gray-700 ring-1 ring-line hover:bg-fog'
            }`}
          >
            {st} ({countMap.get(st) ?? 0})
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="mt-8 rounded-2xl bg-white p-12 text-center ring-1 ring-line">
          <p className="font-semibold text-gray-900">No orders found for this filter.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {orders.map((order) => {
            const orderRef = `#CC-${String(order.id).padStart(5, '0')}`;
            const transitions = NEXT_TRANSITIONS[order.status];

            return (
              <article
                key={order.id}
                className="rounded-2xl bg-white p-6 ring-1 ring-line"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-base font-bold text-gray-900">
                        {orderRef}
                      </span>
                      <span
                        className={`rounded-full px-3 py-0.5 text-xs font-semibold ${STATUS_BADGE[order.status]}`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <p className="text-muted">
                      Customer:{' '}
                      <span className="font-medium text-gray-900">
                        {order.user.name || 'Customer'}
                      </span>{' '}
                      ({order.user.email})
                    </p>
                    <p className="text-xs text-muted">
                      Ship to: {order.shipFullName}, {order.shipLine1}, {order.shipPostalCode}{' '}
                      {order.shipCity} ({order.shipCountry}) ·{' '}
                      <span className="capitalize">{order.shippingMethod}</span> (
                      {formatPrice(Number(order.shippingCost))})
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="mr-3 text-lg font-extrabold text-gray-900">
                      {formatPrice(Number(order.total))}
                    </span>

                    {transitions.map((targetStatus) => (
                      <form key={targetStatus} action={updateOrderStatusAction}>
                        <input type="hidden" name="orderId" value={order.id} />
                        <input type="hidden" name="nextStatus" value={targetStatus} />
                        <button
                          type="submit"
                          className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                            targetStatus === 'Cancelled'
                              ? 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                              : 'bg-cobalt text-white hover:bg-cobalt-dark'
                          }`}
                        >
                          Mark as {targetStatus}
                        </button>
                      </form>
                    ))}
                  </div>
                </div>

                <ul className="mt-3 divide-y divide-line text-sm">
                  {order.items.map((item) => (
                    <li key={item.id} className="flex justify-between py-2">
                      <span>
                        <span className="font-semibold text-gray-900">{item.productName}</span>{' '}
                        <span className="text-muted">× {item.quantity}</span>
                      </span>
                      <span className="font-medium text-gray-900">
                        {formatPrice(Number(item.unitPrice) * item.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}