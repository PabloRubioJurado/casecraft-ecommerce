import { revalidatePath } from 'next/cache';
import type { Metadata } from 'next';
import { prisma } from '../../../lib/prisma';
import { requireAdmin } from '../../../lib/auth';

export const metadata: Metadata = { title: 'Admin · Categories' };

async function createCategoryAction(formData: FormData) {
  'use server';
  await requireAdmin();

  const name = String(formData.get('name') ?? '').trim();
  if (!name) return;

  await prisma.category.upsert({
    where: { name },
    update: {},
    create: { name },
  });

  revalidatePath('/admin/categories');
  revalidatePath('/products');
}

async function renameCategoryAction(formData: FormData) {
  'use server';
  await requireAdmin();

  const id = Number(formData.get('id'));
  const name = String(formData.get('name') ?? '').trim();
  if (!id || !name) return;

  await prisma.category.update({
    where: { id },
    data: { name },
  });

  revalidatePath('/admin/categories');
  revalidatePath('/products');
}

async function deleteCategoryAction(formData: FormData) {
  'use server';
  await requireAdmin();

  const id = Number(formData.get('id'));
  if (!id) return;

  const productCount = await prisma.product.count({ where: { categoryId: id } });
  if (productCount > 0) return;

  await prisma.category.delete({ where: { id } });

  revalidatePath('/admin/categories');
  revalidatePath('/products');
}

export default async function AdminCategoriesPage() {
  await requireAdmin();

  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { id: 'asc' },
  });

  return (
    <div className="max-w-3xl space-y-8">
      {/* Crear categoría */}
      <form
        action={createCategoryAction}
        className="flex flex-wrap items-end gap-3 rounded-2xl bg-white p-6 ring-1 ring-line"
      >
        <div className="min-w-[220px] flex-1">
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
            New category name
          </label>
          <input
            type="text"
            name="name"
            required
            placeholder="e.g. MagSafe Leather"
            className="mt-1.5 w-full rounded-xl border border-line px-3.5 py-2 text-sm outline-none focus:border-cobalt"
          />
        </div>
        <button
          type="submit"
          className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cobalt"
        >
          + Add category
        </button>
      </form>

      {/* Listado con edición y borrado */}
      <div className="divide-y divide-line rounded-2xl bg-white ring-1 ring-line">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="flex flex-wrap items-center justify-between gap-4 px-6 py-4"
          >
            <form action={renameCategoryAction} className="flex flex-1 items-center gap-2">
              <input type="hidden" name="id" value={cat.id} />
              <input
                type="text"
                name="name"
                defaultValue={cat.name}
                required
                className="w-full max-w-xs rounded-xl border border-line px-3 py-1.5 text-sm font-medium outline-none focus:border-cobalt"
              />
              <button
                type="submit"
                className="rounded-full border border-line px-3.5 py-1.5 text-xs font-semibold text-gray-800 hover:bg-fog"
              >
                Save
              </button>
            </form>

            <div className="flex items-center gap-4">
              <span className="text-xs text-muted">
                {cat._count.products} {cat._count.products === 1 ? 'product' : 'products'}
              </span>

              {cat._count.products === 0 ? (
                <form action={deleteCategoryAction}>
                  <input type="hidden" name="id" value={cat.id} />
                  <button
                    type="submit"
                    className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                  >
                    Delete
                  </button>
                </form>
              ) : (
                <span className="text-xs text-muted" title="Reassign products before deleting">
                  In use
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}