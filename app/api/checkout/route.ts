import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '../../../lib/prisma';
import { getCurrentUser } from '../../../lib/auth';

const SHIPPING_RATES: Record<string, { label: string; cost: number }> = {
  standard: { label: 'Standard Delivery (3–5 business days)', cost: 3.99 },
  express: { label: 'Express Courier (24–48 hours)', cost: 8.99 },
};

export async function POST(req: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Missing STRIPE_SECRET_KEY in .env file' },
        { status: 500 }
      );
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const shippingKey = body.shippingMethod === 'express' ? 'express' : 'standard';
    const shipping = SHIPPING_RATES[shippingKey];

    // 1. Obtener carrito real desde la base de datos
    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: 'Your cart is empty' }, { status: 400 });
    }

    // 2. Verificar stock disponible
    for (const item of cart.items) {
      if (!item.product.active || item.quantity > item.product.stock) {
        return NextResponse.json(
          { error: `Insufficient stock for "${item.product.name}" (available: ${item.product.stock})` },
          { status: 400 }
        );
      }
    }

    // 3. Resolver dirección de envío
    let shipData: {
      fullName: string;
      line1: string;
      line2: string | null;
      city: string;
      postalCode: string;
      country: string;
    };

    if (body.addressId) {
      const saved = await prisma.address.findFirst({
        where: { id: Number(body.addressId), userId: user.id },
      });
      if (!saved) {
        return NextResponse.json({ error: 'Selected address not found' }, { status: 400 });
      }
      shipData = {
        fullName: saved.fullName,
        line1: saved.line1,
        line2: saved.line2,
        city: saved.city,
        postalCode: saved.postalCode,
        country: saved.country,
      };
    } else if (body.newAddress) {
      const { fullName, line1, line2, city, postalCode, country, phone, save } = body.newAddress;
      if (!fullName?.trim() || !line1?.trim() || !city?.trim() || !postalCode?.trim() || !country?.trim()) {
        return NextResponse.json({ error: 'Please complete all required address fields' }, { status: 400 });
      }

      shipData = {
        fullName: fullName.trim(),
        line1: line1.trim(),
        line2: line2?.trim() || null,
        city: city.trim(),
        postalCode: postalCode.trim(),
        country: country.trim(),
      };

      if (save) {
        const existingCount = await prisma.address.count({ where: { userId: user.id } });
        await prisma.address.create({
          data: {
            userId: user.id,
            fullName: shipData.fullName,
            line1: shipData.line1,
            line2: shipData.line2,
            city: shipData.city,
            postalCode: shipData.postalCode,
            country: shipData.country,
            phone: phone?.trim() || null,
            isDefault: existingCount === 0,
          },
        });
      }
    } else {
      return NextResponse.json({ error: 'Delivery address is required' }, { status: 400 });
    }

    // 4. Calcular subtotal y validar código de descuento en servidor (B5)
    const subtotal = cart.items.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0
    );

    const rawDiscountCode = typeof body.discountCode === 'string' ? body.discountCode.trim().toUpperCase() : '';
    let appliedDiscountCode: string | null = null;
    let discountAmount = 0;

    if (rawDiscountCode) {
      const discount = await prisma.discountCode.findUnique({
        where: { code: rawDiscountCode },
      });

      if (!discount || !discount.active) {
        return NextResponse.json({ error: 'Invalid or inactive discount code' }, { status: 400 });
      }
      if (discount.expiresAt && discount.expiresAt < new Date()) {
        return NextResponse.json({ error: 'This discount code has expired' }, { status: 400 });
      }
      if (discount.maxUses !== null && discount.usedCount >= discount.maxUses) {
        return NextResponse.json({ error: 'This discount code has reached its usage limit' }, { status: 400 });
      }

      const rawDiscount =
        discount.type === 'PERCENTAGE'
          ? (subtotal * Number(discount.value)) / 100
          : Number(discount.value);

      discountAmount = Number(Math.min(subtotal, Math.max(0, rawDiscount)).toFixed(2));
      appliedDiscountCode = discount.code;

      await prisma.discountCode.update({
        where: { id: discount.id },
        data: { usedCount: { increment: 1 } },
      });
    }

    const total = Number(Math.max(0.5, subtotal - discountAmount + shipping.cost).toFixed(2));

    // 5. Crear el pedido en estado 'New'
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        status: 'New',
        subtotal: Number(subtotal.toFixed(2)),
        discountCode: appliedDiscountCode,
        discountAmount,
        shippingMethod: shippingKey,
        shippingCost: shipping.cost,
        total,
        shipFullName: shipData.fullName,
        shipLine1: shipData.line1,
        shipLine2: shipData.line2,
        shipCity: shipData.city,
        shipPostalCode: shipData.postalCode,
        shipCountry: shipData.country,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            productName: item.product.name,
            unitPrice: item.product.price,
            quantity: item.quantity,
          })),
        },
      },
    });

    // 6. Crear sesión de pago en Stripe (incluyendo cupón en Stripe si hay descuento)
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const origin =
      req.headers.get('origin') ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'http://localhost:3000';

    let stripeDiscounts: Stripe.Checkout.SessionCreateParams.Discount[] | undefined;
    if (appliedDiscountCode && discountAmount > 0) {
      const coupon = await stripe.coupons.create({
        amount_off: Math.round(discountAmount * 100),
        currency: 'eur',
        duration: 'once',
        name: `Promo ${appliedDiscountCode}`,
      });
      stripeDiscounts = [{ coupon: coupon.id }];
    }

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      ...cart.items.map((item) => ({
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.product.name,
          },
          unit_amount: Math.round(Number(item.product.price) * 100),
        },
        quantity: item.quantity,
      })),
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: shipping.label,
          },
          unit_amount: Math.round(shipping.cost * 100),
        },
        quantity: 1,
      },
    ];

    const session = await stripe.checkout.sessions.create({
      line_items,
      ...(stripeDiscounts ? { discounts: stripeDiscounts } : {}),
      mode: 'payment',
      metadata: {
        orderId: String(order.id),
      },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout?canceled=true`,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown checkout error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}