import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '../../../../lib/prisma';
import { sendOrderConfirmationEmail } from '../../../../lib/mail';

export async function POST(req: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secretKey || !webhookSecret) {
    return NextResponse.json(
      { error: 'Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET' },
      { status: 500 }
    );
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  const rawBody = await req.text();
  const stripe = new Stripe(secretKey);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid webhook signature';
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.payment_status === 'paid') {
      const order = await prisma.order.findUnique({
        where: { stripeSessionId: session.id },
        include: {
          items: true,
          user: { select: { email: true } },
        },
      });

      if (order && order.status === 'New') {
        await prisma.$transaction(async (tx) => {
          for (const item of order.items) {
            const updated = await tx.product.updateMany({
              where: {
                id: item.productId,
                stock: { gte: item.quantity },
              },
              data: {
                stock: { decrement: item.quantity },
              },
            });

            if (updated.count === 0) {
              throw new Error(`Insufficient stock for product #${item.productId}`);
            }
          }

          await tx.cartItem.deleteMany({
            where: { cart: { userId: order.userId } },
          });

          await tx.order.update({
            where: { id: order.id },
            data: {
              status: 'Paid',
              paidAt: new Date(),
            },
          });
        });

        // Envío de correo transaccional de confirmación vía Mailtrap (B6)
        if (order.user?.email) {
          try {
            await sendOrderConfirmationEmail({
              to: order.user.email,
              customerName: order.shipFullName,
              orderId: order.id,
              subtotal: Number(order.subtotal),
              discountCode: order.discountCode,
              discountAmount: Number(order.discountAmount),
              shippingMethod: order.shippingMethod,
              shippingCost: Number(order.shippingCost),
              total: Number(order.total),
              shipLine1: order.shipLine1,
              shipLine2: order.shipLine2,
              shipCity: order.shipCity,
              shipPostalCode: order.shipPostalCode,
              shipCountry: order.shipCountry,
              items: order.items.map((item) => ({
                productName: item.productName,
                quantity: item.quantity,
                unitPrice: Number(item.unitPrice),
              })),
            });
          } catch (mailError) {
            console.error('[Mailtrap] Failed to send order confirmation email:', mailError);
          }
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}