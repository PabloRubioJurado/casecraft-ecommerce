import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import type { Metadata } from 'next';
import { prisma } from '../../../lib/prisma';
import { requireAdmin } from '../../../lib/auth';
import { formatPrice } from '../../../lib/format';
import { getCategoryMeta } from '../../../lib/categories';
import CaseArt from '../../../components/CaseArt';

export const metadata: Metadata = { title: 'Admin · Products' };

async function toggleProductActiveAction(formData: FormData) {
  'use server';
  await requireAdmin();

  const id = Number(formData.get('id'));
  const nextActive = formData.get('nextActive') === 'true';
  if (!id) return;

  await prisma.product.update({
    where: { id },
    data: { active: nextActive },
  });

  revalidatePath('/admin/products');
  revalidatePath('/products');
}

export default async function AdminProductsPage() {
  await requireAdmin();

  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { id: 'desc' },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          Showing {products.length} products in catalog
        </p>
        <Link
          href="/admin/products/new"
          className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cobalt"
        >
          + New product
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl bg-white ring-1 ring-line">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-gray-50 text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {products.map((product) => {
              const meta = getCategoryMeta(product.category.name);
              const hasUploadedImage =
                product.image &&
                product.image !== '/placeholder.png' &&
                product.image !== '';

              return (
                <tr key={product.id} className={!product.active ? 'opacity-60' : ''}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="relative h-12 w-10 shrink-0 overflow-hidden rounded-lg"
                        style={{ background: meta.tint }}
                      >
                        {hasUploadedImage ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <CaseArt
                            kind={meta.key}
                            seed={product.id}
                            className="absolute inset-[10%]"
                          />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{product.name}</p>
                        <p className="text-xs text-muted">ID #{product.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">{product.category.name}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {formatPrice(Number(product.price))}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`font-semibold ${
                        product.stock === 0 ? 'text-red-600' : 'text-gray-900'
                      }`}
                    >
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        product.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {product.active ? 'Active' : 'Archived'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-gray-800 hover:bg-fog"
                      >
                        Edit
                      </Link>
                      <form action={toggleProductActiveAction}>
                        <input type="hidden" name="id" value={product.id} />
                        <input
                          type="hidden"
                          name="nextActive"
                          value={String(!product.active)}
                        />
                        <button
                          type="submit"
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            product.active
                              ? 'bg-red-50 text-red-700 hover:bg-red-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {product.active ? 'Delete' : 'Restore'}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}