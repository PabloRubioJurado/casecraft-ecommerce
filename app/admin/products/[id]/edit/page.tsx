import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import type { Metadata } from 'next';
import { prisma } from '../../../../../lib/prisma';
import { requireAdmin } from '../../../../../lib/auth';
import ProductForm from '../../ProductForm';

export const metadata: Metadata = { title: 'Admin · Edit Product' };

async function updateProductAction(formData: FormData) {
  'use server';
  await requireAdmin();

  const id = Number(formData.get('id'));
  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const price = Number(formData.get('price'));
  const stock = Number(formData.get('stock'));
  const categoryId = Number(formData.get('categoryId'));
  const image = String(formData.get('image') ?? '/placeholder.png').trim() || '/placeholder.png';
  const active = formData.get('active') === 'on';

  if (!id || !name || !description || Number.isNaN(price) || price <= 0 || Number.isNaN(stock) || stock < 0 || !categoryId) {
    return;
  }

  await prisma.product.update({
    where: { id },
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
  revalidatePath(`/products/${id}`);
  redirect('/admin/products');
}

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  await requireAdmin();
  const { id } = await params;
  const productId = Number(id);

  if (!productId) notFound();

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id: productId } }),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
  ]);

  if (!product) notFound();

  return (
    <div>
      <h2 className="mb-5 font-display text-xl font-bold">
        Edit product · #{product.id}
      </h2>
      <ProductForm
        categories={categories}
        initial={{
          id: product.id,
          name: product.name,
          description: product.description,
          price: String(product.price),
          stock: product.stock,
          image: product.image,
          categoryId: product.categoryId,
          active: product.active,
        }}
        action={updateProductAction}
        submitLabel="Save changes"
      />
    </div>
  );
}