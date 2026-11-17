import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '../../../lib/prisma';
import CaseArt from '../../../components/CaseArt';
import AddToCartForm from '../../../components/AddToCartForm';
import ProductCard from '../../../components/ProductCard';
import { getCategoryMeta } from '../../../lib/categories';
import { formatPrice } from '../../../lib/format';
import { getCurrentUser } from '../../../lib/auth';
import { toggleWishlistAction } from '../../actions/wishlist';
import { submitReviewAction } from '../../actions/reviews';

export const dynamic = 'force-dynamic';

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const user = await getCurrentUser();
  if (user?.role === 'ADMIN') redirect('/admin/products');
  const { id } = await params;

  const productId = Number(id);
  if (!Number.isInteger(productId) || productId < 1) notFound();

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { category: true },
  });

  if (!product || !product.active) notFound();

  const [isWishlisted, visibleReviews, verifiedPurchase, existingUserReview] = await Promise.all([
    user
      ? prisma.wishlistItem
          .findUnique({
            where: { userId_productId: { userId: user.id, productId: product.id } },
          })
          .then(Boolean)
      : Promise.resolve(false),
    prisma.review.findMany({
      where: { productId: product.id, hidden: false },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    user
      ? prisma.orderItem.findFirst({
          where: {
            productId: product.id,
            order: {
              userId: user.id,
              status: { in: ['Paid', 'Shipped', 'Delivered'] },
            },
          },
        })
      : Promise.resolve(null),
    user
      ? prisma.review.findUnique({
          where: { userId_productId: { userId: user.id, productId: product.id } },
        })
      : Promise.resolve(null),
  ]);

  const canReview = Boolean(user && verifiedPurchase);
  const reviewCount = visibleReviews.length;
  const averageRating =
    reviewCount > 0
      ? visibleReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
      : null;

  const currentPrice = Number(product.price);

  const sameCategoryCandidates = await prisma.product.findMany({
    where: {
      active: true,
      stock: { gt: 0 },
      categoryId: product.categoryId,
      id: { not: product.id },
    },
    include: {
      category: true,
      reviews: { where: { hidden: false }, select: { rating: true } },
    },
  });

  const sortedSameCategory = sameCategoryCandidates.sort(
    (a, b) =>
      Math.abs(Number(a.price) - currentPrice) - Math.abs(Number(b.price) - currentPrice)
  );

  let recommended = sortedSameCategory.slice(0, 4);

  if (recommended.length < 4) {
    const excludeIds = [product.id, ...recommended.map((r) => r.id)];
    const fallbackCandidates = await prisma.product.findMany({
      where: {
        active: true,
        stock: { gt: 0 },
        id: { notIn: excludeIds },
      },
      include: {
        category: true,
        reviews: { where: { hidden: false }, select: { rating: true } },
      },
    });

    const sortedFallback = fallbackCandidates.sort(
      (a, b) =>
        Math.abs(Number(a.price) - currentPrice) - Math.abs(Number(b.price) - currentPrice)
    );

    recommended = [...recommended, ...sortedFallback.slice(0, 4 - recommended.length)];
  }

  const similarProducts = recommended.map((p) => {
    const count = p.reviews.length;
    const avg = count > 0 ? p.reviews.reduce((sum, r) => sum + r.rating, 0) / count : null;
    return {
      id: p.id,
      name: p.name,
      price: Number(p.price),
      stock: p.stock,
      category: p.category.name,
      image: p.image,
      averageRating: avg,
      reviewCount: count,
    };
  });

  const meta = getCategoryMeta(product.category.name);
  const soldOut = product.stock === 0;
  const lowStock = product.stock > 0 && product.stock <= 10;
  const hasUploadedImage =
    Boolean(product.image) &&
    product.image !== '/placeholder.png' &&
    product.image !== '';

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-y-1 text-sm text-muted sm:mb-6">
        <Link href="/products" className="hover:text-ink">
          Shop
        </Link>
        <span className="mx-2">/</span>
        <Link href={`/products?category=${encodeURIComponent(product.category.name)}`} className="hover:text-ink">
          {product.category.name}
        </Link>
      </nav>

      <div className="grid items-start gap-6 sm:gap-8 md:grid-cols-2 md:gap-12">
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl" style={{ background: meta.tint }}>
          {hasUploadedImage ? (
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <CaseArt kind={meta.key} seed={product.id} className="absolute inset-[8%]" />
          )}
        </div>

        <div>
          <h1 className="font-display text-2xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            {product.name}
          </h1>

          {averageRating !== null && (
            <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-amber-600">
              <span>{'★'.repeat(Math.round(averageRating))}{'☆'.repeat(5 - Math.round(averageRating))}</span>
              <span className="text-ink">{averageRating.toFixed(1)} / 5</span>
              <span className="font-normal text-muted">
                ({reviewCount} {reviewCount === 1 ? 'verified review' : 'verified reviews'})
              </span>
            </div>
          )}

          <p className="mt-2.5 text-2xl font-bold sm:mt-3 sm:text-3xl">{formatPrice(currentPrice)}</p>

          <p className="mt-4 max-w-prose text-sm leading-relaxed text-muted sm:mt-6 sm:text-base">
            {product.description}
          </p>

          <div className="mt-5 flex items-center gap-2 text-sm font-medium sm:mt-6">
            <span
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${soldOut ? 'bg-red-500' : lowStock ? 'bg-amber-500' : 'bg-green-500'}`}
            />
            {soldOut ? 'Sold out' : lowStock ? `Only ${product.stock} left` : `In stock (${product.stock} available)`}
          </div>

          <AddToCartForm productId={product.id} stock={product.stock} />

          <form action={toggleWishlistAction} className="mt-3">
            <input type="hidden" name="productId" value={product.id} />
            <button
              type="submit"
              className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition ${
                isWishlisted
                  ? 'border-ink bg-ink text-white hover:bg-ink/90'
                  : 'border-line bg-white text-ink hover:border-ink/40'
              }`}
            >
              <span aria-hidden="true">{isWishlisted ? '♥' : '♡'}</span>
              {isWishlisted ? 'Saved in wishlist' : 'Save to wishlist'}
            </button>
          </form>
        </div>
      </div>

      {/* Sección de Reseñas y Valoraciones (B3) */}
      <section aria-labelledby="reviews-heading" className="mt-14 border-t border-line pt-10 sm:mt-16 sm:pt-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="reviews-heading" className="font-display text-xl font-extrabold tracking-tight sm:text-2xl">
              Customer Reviews
            </h2>
            <p className="mt-1 text-xs text-muted sm:text-sm">
              {reviewCount === 0
                ? 'No reviews yet. Verified buyers can share their feedback below.'
                : `Average rating ${averageRating!.toFixed(1)} out of 5 based on ${reviewCount} ${reviewCount === 1 ? 'review' : 'reviews'}`}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-12">
          {/* Formulario exclusivo para compradores verificados */}
          <div className="lg:col-span-5">
            {canReview ? (
              <form action={submitReviewAction} className="rounded-2xl bg-white p-5 ring-1 ring-line">
                <input type="hidden" name="productId" value={product.id} />
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-base font-bold">
                    {existingUserReview ? 'Update your review' : 'Write a verified review'}
                  </h3>
                  <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-[11px] font-semibold text-green-800">
                    Verified buyer
                  </span>
                </div>

                <div className="mt-4">
                  <label htmlFor="rating" className="block text-xs font-semibold uppercase tracking-wider text-muted">
                    Rating *
                  </label>
                  <select
                    id="rating"
                    name="rating"
                    defaultValue={existingUserReview?.rating ?? 5}
                    className="mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm"
                  >
                    <option value="5">★★★★★ — 5 (Excellent)</option>
                    <option value="4">★★★★☆ — 4 (Very good)</option>
                    <option value="3">★★★☆☆ — 3 (Average)</option>
                    <option value="2">★★☆☆☆ — 2 (Fair)</option>
                    <option value="1">★☆☆☆☆ — 1 (Poor)</option>
                  </select>
                </div>

                <div className="mt-4">
                  <label htmlFor="comment" className="block text-xs font-semibold uppercase tracking-wider text-muted">
                    Comment *
                  </label>
                  <textarea
                    id="comment"
                    name="comment"
                    rows={3}
                    required
                    minLength={3}
                    maxLength={1000}
                    defaultValue={existingUserReview?.comment ?? ''}
                    placeholder="Share how the case fits and feels..."
                    className="mt-1.5 w-full rounded-xl border border-line px-3.5 py-2.5 text-sm"
                  />
                </div>

                <button
                  type="submit"
                  className="mt-4 w-full rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cobalt"
                >
                  {existingUserReview ? 'Save changes' : 'Submit review'}
                </button>
              </form>
            ) : (
              <div className="rounded-2xl bg-fog/60 p-5 ring-1 ring-line">
                <h3 className="font-display text-base font-bold">Verified Buyers Only</h3>
                <p className="mt-1.5 text-sm text-muted">
                  {user
                    ? 'Only customers who have purchased and paid for this case can leave a review.'
                    : 'Sign in with an account that purchased this case to leave a review.'}
                </p>
              </div>
            )}
          </div>

          {/* Listado de reseñas visibles */}
          <div className="space-y-4 lg:col-span-7">
            {visibleReviews.length === 0 ? (
              <div className="rounded-2xl bg-white p-8 text-center text-sm text-muted ring-1 ring-line">
                No reviews published for this case yet.
              </div>
            ) : (
              visibleReviews.map((rev) => {
                const author = rev.user.name?.trim() || rev.user.email.split('@')[0];
                return (
                  <article key={rev.id} className="rounded-2xl bg-white p-5 ring-1 ring-line">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-semibold text-ink">{author}</span>
                        <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-800">
                          Verified purchase
                        </span>
                      </div>
                      <span className="text-xs text-muted">
                        {rev.createdAt.toISOString().slice(0, 10)}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm font-semibold text-amber-600">
                      {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-ink">{rev.comment}</p>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </section>

      {similarProducts.length > 0 && (
        <section aria-labelledby="similar-heading" className="mt-14 border-t border-line pt-10 sm:mt-16 sm:pt-12">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 id="similar-heading" className="font-display text-xl font-extrabold tracking-tight sm:text-2xl">
                Similar cases you might like
              </h2>
              <p className="mt-1 text-xs text-muted sm:text-sm">
                Matched by material ({product.category.name}) and price range
              </p>
            </div>
            <Link
              href={`/products?category=${encodeURIComponent(product.category.name)}`}
              className="text-xs font-semibold text-cobalt hover:underline sm:text-sm"
            >
              View all in category →
            </Link>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:gap-5 md:grid-cols-4">
            {similarProducts.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}