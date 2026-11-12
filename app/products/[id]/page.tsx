import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '../../../lib/prisma';
import CaseArt from '../../../components/CaseArt';
import AddToCartForm from '../../../components/AddToCartForm';
import { getCategoryMeta } from '../../../lib/categories';
import { formatPrice } from '../../../lib/format';

export const dynamic = 'force-dynamic';

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;

  // El id de Product es un Int en el esquema de Prisma: hay que convertirlo,
  // si no Prisma rechaza la consulta con un error de validación.
  const productId = Number(id);
  if (!Number.isInteger(productId) || productId < 1) notFound();

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { category: true },
  });

  if (!product || !product.active) notFound();

  const meta = getCategoryMeta(product.category.name);
  const soldOut = product.stock === 0;
  const lowStock = product.stock > 0 && product.stock <= 10;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted">
        <Link href="/products" className="hover:text-ink">
          Shop
        </Link>
        <span className="mx-2">/</span>
        <Link href={`/products?category=${encodeURIComponent(product.category.name)}`} className="hover:text-ink">
          {product.category.name}
        </Link>
      </nav>

      <div className="grid items-start gap-8 md:grid-cols-2 md:gap-12">
        <div className="relative aspect-[4/5] overflow-hidden rounded-3xl" style={{ background: meta.tint }}>
          <CaseArt kind={meta.key} seed={product.id} className="absolute inset-[8%]" />
        </div>

        <div>
          <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            {product.name}
          </h1>
          <p className="mt-3 text-3xl font-bold">{formatPrice(Number(product.price))}</p>

          <p className="mt-6 max-w-prose leading-relaxed text-muted">{product.description}</p>

          <div className="mt-6 flex items-center gap-2 text-sm font-medium">
            <span
              className={`h-2.5 w-2.5 rounded-full ${soldOut ? 'bg-red-500' : lowStock ? 'bg-amber-500' : 'bg-green-500'}`}
            />
            {soldOut ? 'Sold out' : lowStock ? `Only ${product.stock} left` : `In stock (${product.stock} available)`}
          </div>

          <AddToCartForm productId={product.id} stock={product.stock} />
        </div>
      </div>
    </div>
  );
}
