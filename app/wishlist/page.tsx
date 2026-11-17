import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '../../lib/prisma';
import { getCurrentUser } from '../../lib/auth';
import { getCategoryMeta } from '../../lib/categories';
import { formatPrice } from '../../lib/format';
import CaseArt from '../../components/CaseArt';
import { moveWishlistToCartAction, removeWishlistItemAction } from '../actions/wishlist';

export const metadata: Metadata = { title: 'My Wishlist' };
export const dynamic = 'force-dynamic';

export default async function WishlistPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role === 'ADMIN') redirect('/admin/products');

  const items = await prisma.wishlistItem.findMany({
    where: { userId: user.id, product: { active: true } },
    include: {
      product: { include: { category: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-4xl">
            My Wishlist
          </h1>
          <p className="mt-1 text-sm text-muted sm:text-base">
            {items.length === 0
              ? 'Save cases you like and move them to your cart anytime.'
              : `${items.length} saved ${items.length === 1 ? 'case' : 'cases'}`}
          </p>
        </div>

        <Link
          href="/products"
          className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold transition hover:border-ink/40"
        >
          Continue shopping
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="mt-8 rounded-2xl bg-white px-6 py-16 text-center ring-1 ring-line">
          <p className="font-display text-xl font-bold">Your wishlist is empty</p>
          <p className="mt-1 text-sm text-muted">
            Browse our catalog and click “Save to wishlist” on any case.
          </p>
          <Link
            href="/products"
            className="mt-5 inline-block rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cobalt"
          >
            Explore cases
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ id, product }) => {
            const meta = getCategoryMeta(product.category.name);
            const soldOut = product.stock === 0;
            const hasUploadedImage =
              Boolean(product.image) &&
              product.image !== '/placeholder.png' &&
              product.image !== '';

            return (
              <div
                key={id}
                className="flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-line"
              >
                <Link
                  href={`/products/${product.id}`}
                  className="relative aspect-[4/3] w-full overflow-hidden"
                  style={{ background: meta.tint }}
                >
                  {hasUploadedImage ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <CaseArt kind={meta.key} seed={product.id} className="absolute inset-[10%]" />
                  )}
                </Link>

                <div className="flex flex-1 flex-col p-4">
                  <span className="text-xs text-muted">{product.category.name}</span>
                  <Link
                    href={`/products/${product.id}`}
                    className="mt-0.5 font-display text-base font-bold hover:text-cobalt"
                  >
                    {product.name}
                  </Link>
                  <p className="mt-1 text-lg font-bold">{formatPrice(Number(product.price))}</p>

                  <p className="mt-1 text-xs font-medium text-muted">
                    {soldOut ? 'Sold out' : `${product.stock} in stock`}
                  </p>

                  <div className="mt-4 flex items-center gap-2 pt-2">
                    <form action={moveWishlistToCartAction} className="flex-1">
                      <input type="hidden" name="productId" value={product.id} />
                      <button
                        type="submit"
                        disabled={soldOut}
                        className="w-full rounded-full bg-cobalt px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-cobalt-dark disabled:cursor-not-allowed disabled:bg-line disabled:text-muted sm:text-sm"
                      >
                        {soldOut ? 'Sold out' : 'Move to cart'}
                      </button>
                    </form>

                    <form action={removeWishlistItemAction}>
                      <input type="hidden" name="productId" value={product.id} />
                      <button
                        type="submit"
                        className="rounded-full border border-line px-3.5 py-2.5 text-xs font-semibold text-muted transition hover:border-red-300 hover:text-red-600 sm:text-sm"
                      >
                        Remove
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}