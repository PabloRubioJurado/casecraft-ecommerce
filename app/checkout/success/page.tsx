import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '../../../lib/prisma';
import { requireUser } from '../../../lib/auth';
import { formatPrice } from '../../../lib/format';
import RefreshOnMount from '../../../components/RefreshOnMount';

interface SuccessPageProps {
  searchParams: Promise<{ session_id?: string }>;
}

export default async function CheckoutSuccessPage({ searchParams }: SuccessPageProps) {
  const user = await requireUser('/cart');
  const { session_id } = await searchParams;

  if (!session_id) {
    redirect('/cart');
  }

  const order = await prisma.order.findFirst({
    where: {
      stripeSessionId: session_id,
      userId: user.id,
    },
  });

  if (!order) {
    redirect('/cart');
  }

  // El webhook es el único que pasa el pedido a 'Paid' (A6)
  if (order.status === 'New') {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <RefreshOnMount />
        <meta httpEquiv="refresh" content="2" />
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-line border-t-cobalt" />
        <h1 className="mt-6 font-display text-2xl font-extrabold text-gray-900">
          Confirming your payment...
        </h1>
        <p className="mt-2 text-sm text-muted">
          Waiting for Stripe webhook confirmation. This page will update automatically.
        </p>
      </div>
    );
  }

  const orderReference = `#CC-${String(order.id).padStart(5, '0')}`;

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <RefreshOnMount />

      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700">
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="mt-6 font-display text-3xl font-extrabold tracking-tight text-gray-900">
        Payment confirmed
      </h1>
      <p className="mt-2 text-muted">
        Thank you for your purchase. Your order has been recorded and stock has been updated.
      </p>

      <div className="mt-8 space-y-3 rounded-2xl bg-white p-6 text-left text-sm ring-1 ring-line">
        <div className="flex justify-between">
          <span className="text-muted">Order number</span>
          <span className="font-mono font-bold text-gray-900">{orderReference}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Status</span>
          <span className="font-semibold text-green-700">Paid</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Delivery method</span>
          <span className="font-medium capitalize text-gray-900">
            {order.shippingMethod} ({formatPrice(Number(order.shippingCost))})
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="shrink-0 text-muted">Deliver to</span>
          <span className="text-right font-medium text-gray-900">
            {order.shipFullName}, {order.shipLine1}, {order.shipCity}
          </span>
        </div>
        <div className="flex justify-between border-t border-line pt-3">
          <span className="text-muted">Total paid</span>
          <span className="font-bold text-gray-900">{formatPrice(Number(order.total))}</span>
        </div>
      </div>

      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          href="/orders"
          className="rounded-full bg-black px-6 py-3 font-semibold text-white transition hover:bg-gray-800"
        >
          View my orders
        </Link>
        <Link
          href="/products"
          className="rounded-full border border-line bg-white px-6 py-3 font-semibold text-gray-900 transition hover:bg-gray-50"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}