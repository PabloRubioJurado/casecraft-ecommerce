import Link from 'next/link';
import CaseArt from './CaseArt';
import { getCategoryMeta } from '../lib/categories';
import { formatPrice } from '../lib/format';
import type { ProductCardData } from '../types/product';

export default function ProductCard({ product }: { product: ProductCardData }) {
  const meta = getCategoryMeta(product.category);
  const soldOut = product.stock === 0;
  const lowStock = product.stock > 0 && product.stock <= 10;

  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-line transition hover:ring-ink/30"
    >
      <div className="relative aspect-[4/5]" style={{ background: meta.tint }}>
        <CaseArt
          kind={meta.key}
          seed={product.id}
          className="absolute inset-[9%] transition-transform duration-300 group-hover:-translate-y-1"
        />
        {(soldOut || lowStock) && (
          <span className="absolute left-3 top-3 rounded-full bg-white px-2.5 py-1 text-xs font-medium">
            {soldOut ? 'Sold out' : `Only ${product.stock} left`}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <span className="text-xs text-muted">{product.category}</span>
        <h3 className="font-display text-base font-bold leading-snug">{product.name}</h3>
        <p className="mt-auto pt-3 text-lg font-bold">{formatPrice(product.price)}</p>
      </div>
    </Link>
  );
}
