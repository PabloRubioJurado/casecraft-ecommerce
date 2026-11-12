import Link from 'next/link';
import type { Metadata } from 'next';
import { prisma } from '../../lib/prisma';
import { requireUser } from '../../lib/auth';
import { cartTotals, fromCents, lineTotalCents } from '../../lib/cart';
import { getCategoryMeta } from '../../lib/categories';
import { formatPrice } from '../../lib/format';
import CaseArt from '../../components/CaseArt';
import { removeCartItemAction } from '../actions/cart';
import CartQuantityForm from './CartQuantityForm';

export const metadata: Metadata = { title: 'Your cart' };

export default async function CartPage() {
  const user = await requireUser('/cart');

  const items = await prisma.cartItem.findMany({
    where: { cart: { userId: user.id } },
    include: { product: { include: { category: true } } },
    orderBy: { id: 'asc' },
  });

  // Los totales se recalculan aquí, en el servidor, con los precios de la base de datos.
  const lines = items.map((i) => ({ ...i, unitPrice: Number(i.product.price) }));
  const totals = cartTotals(lines);
  const hasProblem = items.some((i) => !i.product.active || i.quantity > i.product.stock);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center sm:py-24">
        <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Your cart is empty</h1>
        <p className="mt-2 text-sm text-muted sm:text-base">Pick a case and it will wait for you here, even if you sign out.</p>
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
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
      <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-4xl">Your cart</h1>

      <div className="mt-6 grid items-start gap-6 sm:mt-8 sm:gap-8 lg:grid-cols-[1fr_320px]">
        <ul className="space-y-3">
          {lines.map((l) => {
            const meta = getCategoryMeta(l.product.category.name);
            const unavailable = !l.product.active;
            const tooMany = !unavailable && l.quantity > l.product.stock;
            return (
              <li key={l.id} className="flex gap-3 rounded-2xl bg-white p-3 ring-1 ring-line sm:gap-4 sm:p-4">
                <div className="relative h-24 w-16 shrink-0 rounded-xl sm:h-28 sm:w-20" style={{ background: meta.tint }}>
                  <CaseArt kind={meta.key} seed={l.product.id} className="absolute inset-[10%]" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex items-start justify-between gap-2 sm:gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/products/${l.product.id}`}
                        className="font-display text-sm font-bold leading-snug hover:underline sm:text-base"
                      >
                        {l.product.name}
                      </Link>
                      <p className="text-xs text-muted sm:text-sm">{formatPrice(l.unitPrice)} each</p>
                    </div>
                    <p className="shrink-0 text-sm font-bold sm:text-base">{formatPrice(fromCents(lineTotalCents(l)))}</p>
                  </div>

                  {unavailable ? (
                    <p role="alert" className="text-xs text-red-600 sm:text-sm">
                      This case is no longer available. Remove it to continue.
                    </p>
                  ) : (
                    <>
                      <CartQuantityForm productId={l.product.id} quantity={l.quantity} stock={l.product.stock} />
                      {tooMany && (
                        <p role="alert" className="text-xs text-red-600 sm:text-sm">
                          Only {l.product.stock} left in stock. Lower the quantity to continue.
                        </p>
                      )}
                    </>
                  )}

                  <form action={removeCartItemAction} className="mt-auto">
                    <input type="hidden" name="productId" value={l.product.id} />
                    <button type="submit" className="text-xs font-medium text-muted underline hover:text-red-600 sm:text-sm">
                      Remove
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>

        <aside className="rounded-2xl bg-white p-5 ring-1 ring-line sm:p-6 lg:sticky lg:top-24">
          <h2 className="font-display text-lg font-bold">Order summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Items</dt>
              <dd>{totals.itemCount}</dd>
            </div>
            <div className="flex justify-between text-base font-bold">
              <dt>Subtotal</dt>
              <dd>{formatPrice(fromCents(totals.subtotalCents))}</dd>
            </div>
          </dl>
          <p className="mt-2 text-xs text-muted">Shipping is added at checkout.</p>
          {hasProblem && <p className="mt-3 text-sm text-red-600">Fix the items marked above to continue.</p>}
          {/* TODO (A5/A6): enlazar con el checkout cuando exista */}
          <button
            type="button"
            disabled
            className="mt-5 w-full cursor-not-allowed rounded-full bg-line px-6 py-3 font-semibold text-muted"
          >
            Checkout (coming soon)
          </button>
        </aside>
      </div>
    </div>
  );
}