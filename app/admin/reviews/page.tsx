import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '../../../lib/prisma';
import { requireAdmin } from '../../../lib/auth';
import { toggleReviewVisibilityAction } from '../../actions/reviews';

export const metadata: Metadata = { title: 'Admin · Reviews Moderation' };
export const dynamic = 'force-dynamic';

export default async function AdminReviewsPage() {
  await requireAdmin();

  const reviews = await prisma.review.findMany({
    include: {
      product: { select: { id: true, name: true } },
      user: { select: { email: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-line">
      <div className="border-b border-line px-6 py-4">
        <h2 className="font-display text-lg font-bold">Customer Reviews ({reviews.length})</h2>
        <p className="text-xs text-muted">
          Hide inappropriate reviews from the public catalog or restore previously hidden ones.
        </p>
      </div>

      {reviews.length === 0 ? (
        <p className="px-6 py-12 text-center text-sm text-muted">
          No customer reviews submitted yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-fog/60 text-xs uppercase text-muted">
              <tr>
                <th className="px-6 py-3">Product</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Rating</th>
                <th className="px-6 py-3">Comment</th>
                <th className="px-6 py-3">Visibility</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {reviews.map((rev) => (
                <tr key={rev.id} className={rev.hidden ? 'bg-fog/40 opacity-75' : ''}>
                  <td className="px-6 py-4 font-semibold text-ink">
                    <Link href={`/products/${rev.product.id}`} className="hover:underline">
                      {rev.product.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-muted">{rev.user.email}</td>
                  <td className="px-6 py-4 font-semibold text-amber-600">
                    {'★'.repeat(rev.rating)} ({rev.rating}/5)
                  </td>
                  <td className="max-w-md px-6 py-4 text-ink">{rev.comment}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        rev.hidden ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {rev.hidden ? 'Hidden' : 'Visible'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <form action={toggleReviewVisibilityAction}>
                      <input type="hidden" name="reviewId" value={rev.id} />
                      <button
                        type="submit"
                        className="rounded-full border border-line px-3.5 py-1.5 text-xs font-semibold transition hover:border-ink/40"
                      >
                        {rev.hidden ? 'Show review' : 'Hide review'}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}