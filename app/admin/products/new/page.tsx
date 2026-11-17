import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import type { Metadata } from 'next';
import { prisma } from '../../../../lib/prisma';
import { requireAdmin } from '../../../../lib/auth';
import ProductForm from '../ProductForm';

export const metadata: Metadata = { title: 'Admin · New Product' };

async function createProductAction(formData: FormData) {
  'use server';
  await requireAdmin();

  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const price = Number(formData.get('price'));
  const stock = Number(formData.get('stock'));
  const categoryId = Number(formData.get('categoryId'));
  const image = String(formData.get('image') ?? '/placeholder.png').trim() || '/placeholder.png';
  const active = formData.get('active') === 'on';

  if (!name || !description || Number.isNaN(price) || price <= 0 || Number.isNaN(stock) || stock < 0 || !categoryId) {
    return;
  }

  await prisma.product.create({
    data: {
      name,
      description,
      price: Number(price.toFixed(2)),
      stock: Math.floor(stock),
      categoryId,
      image,
      active,
    },
  });

  revalidatePath('/admin/products');
  revalidatePath('/products');
  redirect('/admin/products');
}

export default async function NewProductPage() {
  await requireAdmin();

  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });

  return (
    <div>
      <h2 className="mb-5 font-display text-xl font-bold">Create new product</h2>
      <ProductForm
        categories={categories}
        action={createProductAction}
        submitLabel="Create product"
      />
    </div>
  );
}