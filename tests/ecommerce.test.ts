import test from 'node:test';
import assert from 'node:assert/strict';
import Stripe from 'stripe';
import { toCents, fromCents, lineTotalCents, cartTotals, checkStock } from '../lib/cart';
import { prisma } from '../lib/prisma';
import { POST as stripeWebhookPOST } from '../app/api/webhooks/stripe/route';

// ---------------------------------------------------------------------------
// 1. Pruebas de carrito y cálculo de totales (A3 / A12)
// ---------------------------------------------------------------------------

test('1. Conversión de precios a céntimos evita errores de coma flotante', () => {
  assert.equal(toCents(19.99), 1999);
  assert.equal(toCents('16.49'), 1649);
  assert.equal(fromCents(2048), 20.48);
});

test('2. Cálculo de línea multiplica precio unitario por cantidad en céntimos', () => {
  assert.equal(lineTotalCents({ unitPrice: 14.95, quantity: 3 }), 4485);
});

test('3. Totales del carrito suman correctamente artículos y subtotal', () => {
  const totals = cartTotals([
    { unitPrice: 16.49, quantity: 2 },
    { unitPrice: 24.5, quantity: 1 },
  ]);
  assert.equal(totals.itemCount, 3);
  assert.equal(totals.subtotalCents, 5748);
  assert.equal(fromCents(totals.subtotalCents), 57.48);
});

test('4. Carrito vacío devuelve 0 artículos y 0 céntimos', () => {
  const totals = cartTotals([]);
  assert.equal(totals.itemCount, 0);
  assert.equal(totals.subtotalCents, 0);
});

test('5. Validación de stock permite cantidades dentro del límite disponible', () => {
  const res = checkStock({ requested: 2, inCart: 1, stock: 5 });
  assert.deepEqual(res, { ok: true, quantity: 3 });
});

test('6. Validación de stock rechaza cantidades superiores al inventario disponible', () => {
  const res = checkStock({ requested: 2, inCart: 2, stock: 3 });
  assert.equal(res.ok, false);
  if (!res.ok) {
    assert.match(res.error, /only 3 are in stock/i);
  }
});

test('7. Validación de stock rechaza productos agotados o cantidades inválidas', () => {
  const soldOut = checkStock({ requested: 1, stock: 0 });
  assert.equal(soldOut.ok, false);

  const invalidQty = checkStock({ requested: 0, stock: 10 });
  assert.equal(invalidQty.ok, false);
});

// ---------------------------------------------------------------------------
// 2. Pruebas de confirmación de pago y webhook de Stripe (A6 / A7 / A12)
// ---------------------------------------------------------------------------

test('8. Webhook rechaza peticiones sin cabecera stripe-signature con HTTP 400', async () => {
  process.env.STRIPE_SECRET_KEY = 'sk_test_dummy_key';
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_dummy_secret';

  const req = new Request('http://localhost:3000/api/webhooks/stripe', {
    method: 'POST',
    body: JSON.stringify({ id: 'evt_test' }),
  });

  const res = await stripeWebhookPOST(req);
  assert.equal(res.status, 400);
});

test('9. Webhook rechaza firmas manipuladas o inválidas con HTTP 400', async () => {
  process.env.STRIPE_SECRET_KEY = 'sk_test_dummy_key';
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_dummy_secret';

  const req = new Request('http://localhost:3000/api/webhooks/stripe', {
    method: 'POST',
    headers: { 'stripe-signature': 't=12345,v1=firma_falsa' },
    body: JSON.stringify({ id: 'evt_test' }),
  });

  const res = await stripeWebhookPOST(req);
  assert.equal(res.status, 400);
});

test('10. Confirmación de pago en webhook marca pedido como Paid, descuenta stock y vacía carrito', async () => {
  const secretKey = 'sk_test_dummy_key';
  const webhookSecret = 'whsec_test_dummy_secret';
  process.env.STRIPE_SECRET_KEY = secretKey;
  process.env.STRIPE_WEBHOOK_SECRET = webhookSecret;

  const stripe = new Stripe(secretKey);
  const sessionId = 'cs_test_confirmed_1001';

  let stockDecrementedBy = 0;
  let cartClearedForUser = 0;
  let updatedOrderStatus = '';

  const origFindUnique = prisma.order.findUnique;
  const origTransaction = prisma.$transaction;

  try {
    (prisma.order as unknown as { findUnique: unknown }).findUnique = async () => ({
      id: 501,
      userId: 77,
      status: 'New',
      stripeSessionId: sessionId,
      items: [{ productId: 10, quantity: 2 }],
    });

    (prisma as unknown as { $transaction: unknown }).$transaction = async (
      fn: (tx: unknown) => Promise<void>
    ) => {
      const mockTx = {
        product: {
          updateMany: async (args: { data: { stock: { decrement: number } } }) => {
            stockDecrementedBy = args.data.stock.decrement;
            return { count: 1 };
          },
        },
        cartItem: {
          deleteMany: async (args: { where: { cart: { userId: number } } }) => {
            cartClearedForUser = args.where.cart.userId;
            return { count: 1 };
          },
        },
        order: {
          update: async (args: { data: { status: string } }) => {
            updatedOrderStatus = args.data.status;
            return { id: 501, status: args.data.status };
          },
        },
      };
      await fn(mockTx);
    };

    const payload = JSON.stringify({
      id: 'evt_test_paid',
      object: 'event',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: sessionId,
          object: 'checkout.session',
          payment_status: 'paid',
        },
      },
    });

    const signature = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: webhookSecret,
    });

    const req = new Request('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      headers: { 'stripe-signature': signature },
      body: payload,
    });

    const res = await stripeWebhookPOST(req);
    assert.equal(res.status, 200);
    assert.equal(stockDecrementedBy, 2);
    assert.equal(cartClearedForUser, 77);
    assert.equal(updatedOrderStatus, 'Paid');
  } finally {
    (prisma.order as unknown as { findUnique: unknown }).findUnique = origFindUnique;
    (prisma as unknown as { $transaction: unknown }).$transaction = origTransaction;
  }
});

test('11. Evento con payment_status distinto de paid mantiene el pedido sin pagar y sin tocar stock', async () => {
  const secretKey = 'sk_test_dummy_key';
  const webhookSecret = 'whsec_test_dummy_secret';
  process.env.STRIPE_SECRET_KEY = secretKey;
  process.env.STRIPE_WEBHOOK_SECRET = webhookSecret;

  const stripe = new Stripe(secretKey);
  let dbTouched = false;

  const origFindUnique = prisma.order.findUnique;
  try {
    (prisma.order as unknown as { findUnique: unknown }).findUnique = async () => {
      dbTouched = true;
      return null;
    };

    const payload = JSON.stringify({
      id: 'evt_test_unpaid',
      object: 'event',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_unpaid_1002',
          object: 'checkout.session',
          payment_status: 'unpaid',
        },
      },
    });

    const signature = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: webhookSecret,
    });

    const req = new Request('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      headers: { 'stripe-signature': signature },
      body: payload,
    });

    const res = await stripeWebhookPOST(req);
    assert.equal(res.status, 200);
    assert.equal(dbTouched, false);
  } finally {
    (prisma.order as unknown as { findUnique: unknown }).findUnique = origFindUnique;
  }
});

test('12. Transacción aborta si dos clientes compran a la vez la última unidad (stock insuficiente)', async () => {
  const secretKey = 'sk_test_dummy_key';
  const webhookSecret = 'whsec_test_dummy_secret';
  process.env.STRIPE_SECRET_KEY = secretKey;
  process.env.STRIPE_WEBHOOK_SECRET = webhookSecret;

  const stripe = new Stripe(secretKey);
  const sessionId = 'cs_test_race_1003';

  const origFindUnique = prisma.order.findUnique;
  const origTransaction = prisma.$transaction;

  try {
    (prisma.order as unknown as { findUnique: unknown }).findUnique = async () => ({
      id: 502,
      userId: 88,
      status: 'New',
      stripeSessionId: sessionId,
      items: [{ productId: 10, quantity: 1 }],
    });

    (prisma as unknown as { $transaction: unknown }).$transaction = async (
      fn: (tx: unknown) => Promise<void>
    ) => {
      const mockTx = {
        product: {
          // Simula que otro cliente acaba de comprar la última unidad (count === 0)
          updateMany: async () => ({ count: 0 }),
        },
        cartItem: { deleteMany: async () => ({ count: 0 }) },
        order: { update: async () => ({}) },
      };
      await fn(mockTx);
    };

    const payload = JSON.stringify({
      id: 'evt_test_race',
      object: 'event',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: sessionId,
          object: 'checkout.session',
          payment_status: 'paid',
        },
      },
    });

    const signature = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: webhookSecret,
    });

    const req = new Request('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      headers: { 'stripe-signature': signature },
      body: payload,
    });

    await assert.rejects(() => stripeWebhookPOST(req), /Insufficient stock/i);
  } finally {
    (prisma.order as unknown as { findUnique: unknown }).findUnique = origFindUnique;
    (prisma as unknown as { $transaction: unknown }).$transaction = origTransaction;
  }
});