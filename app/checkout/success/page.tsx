import Link from 'next/link';
import { redirect } from 'next/navigation';
import Stripe from 'stripe';
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

  if (!session_id || !process.env.STRIPE_SECRET_KEY) {
    redirect('/cart');
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(session_id);
  } catch (error) {
    console.error('Error retrieving Stripe session:', error);
    redirect('/cart');
  }

  if (session.payment_status !== 'paid') {
    redirect('/cart');
  }

  const amountPaid = (session.amount_total ?? 0) / 100;

  // Buscamos si el pedido ya fue registrado para evitar duplicados al recargar
  let order = await prisma.order.findUnique({
    where: { stripeSessionId: session.id },
  });

  if (!order) {
    order = await prisma.$transaction(async (tx) => {
      const cartItems = await tx.cartItem.findMany({
        where: { cart: { userId: user.id } },
        include: { product: true },
      });

      if (cartItems.length === 0) {
        return null;
      }

      const defaultAddress = await tx.address.findFirst({
        where: { userId: user.id },
        orderBy: { isDefault: 'desc' },
      });

      const createdOrder = await tx.order.create({
        data: {
          userId: user.id,
          status: 'Paid',
          subtotal: amountPaid,
          shippingMethod: 'standard',
          shippingCost: 0,
          total: amountPaid,
          shipFullName: defaultAddress?.fullName || user.name || user.email,
          shipLine1: defaultAddress?.line1 || 'Standard delivery',
          shipLine2: defaultAddress?.line2 ?? null,
          shipCity: defaultAddress?.city || 'Madrid',
          shipPostalCode: defaultAddress?.postalCode || '28001',
          shipCountry: defaultAddress?.country || 'ES',
          stripeSessionId: session.id,
          paidAt: new Date(),
          items: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              productName: item.product.name,
              unitPrice: item.product.price,
              quantity: item.quantity,
            })),
          },
        },
      });

      for (const item of cartItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
          },
        });
      }

      await tx.cartItem.deleteMany({
        where: { cart: { userId: user.id } },
      });

      return createdOrder;
    });
  }

  const orderReference = order
    ? `#CC-${String(order.id).padStart(5, '0')}`
    : session.id.slice(-8).toUpperCase();

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
        Thank you for your order. Your payment has been processed and product stock has been updated.
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
          <span className="text-muted">Total paid</span>
          <span className="font-bold text-gray-900">{formatPrice(amountPaid)}</span>
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